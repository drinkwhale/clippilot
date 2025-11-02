"""
Stripe 결제 서비스

Stripe API를 사용하여 구독 관리, 결제 처리를 담당합니다.

주요 기능:
- Checkout Session 생성 (FR-009, FR-017)
- Customer Portal 접근
- Webhook 이벤트 처리 및 signature 검증
- 구독 상태 동기화
"""
import stripe
from typing import Optional, Dict, Any
from datetime import datetime
import logging

from ...config import settings
from ...models.user import User
from ...models.subscription import Subscription
from ...models.webhook import Webhook
from ...schemas.billing import PlanType, SubscriptionStatus
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

# Stripe API 키 설정
stripe.api_key = settings.STRIPE_SECRET_KEY


class StripeService:
    """
    Stripe 결제 처리 서비스

    구독 생성, 업그레이드, 다운그레이드, 취소 등을 처리합니다.
    """

    # Stripe Product ID 매핑 (환경 변수로 관리)
    PLAN_TO_STRIPE_PRICE_ID = {
        PlanType.PRO: settings.STRIPE_PRO_PRICE_ID,
        PlanType.AGENCY: settings.STRIPE_AGENCY_PRICE_ID,
    }

    @staticmethod
    async def create_checkout_session(
        user: User,
        plan: PlanType,
        success_url: str,
        cancel_url: str,
        db: Session
    ) -> Dict[str, str]:
        """
        Stripe Checkout Session 생성

        FR-009: 플랜 업그레이드 기능
        FR-017: Stripe를 통한 결제 처리

        Args:
            user: 현재 사용자
            plan: 업그레이드할 플랜 (pro, agency)
            success_url: 결제 성공 후 리디렉션 URL
            cancel_url: 결제 취소 후 리디렉션 URL
            db: 데이터베이스 세션

        Returns:
            checkout_url: Stripe Checkout 페이지 URL
            session_id: Stripe Checkout Session ID

        Raises:
            ValueError: Free 플랜으로 다운그레이드 시도 시
            stripe.error.StripeError: Stripe API 오류
        """
        if plan == PlanType.FREE:
            raise ValueError("Free 플랜으로의 다운그레이드는 Customer Portal에서 취소를 통해 가능합니다")

        # Stripe Customer ID 확인/생성
        if not user.stripe_customer_id:
            customer = stripe.Customer.create(
                email=user.email,
                metadata={
                    "user_id": str(user.id),
                    "clippilot_plan": plan.value
                }
            )
            user.stripe_customer_id = customer.id
            db.commit()
            logger.info(f"Created Stripe customer for user {user.id}: {customer.id}")
        else:
            logger.info(f"Using existing Stripe customer for user {user.id}: {user.stripe_customer_id}")

        # Stripe Price ID 가져오기
        price_id = StripeService.PLAN_TO_STRIPE_PRICE_ID.get(plan)
        if not price_id:
            raise ValueError(f"Invalid plan: {plan}")

        # Checkout Session 생성
        try:
            checkout_session = stripe.checkout.Session.create(
                customer=user.stripe_customer_id,
                payment_method_types=["card"],
                line_items=[
                    {
                        "price": price_id,
                        "quantity": 1,
                    }
                ],
                mode="subscription",
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={
                    "user_id": str(user.id),
                    "plan": plan.value
                },
                subscription_data={
                    "metadata": {
                        "user_id": str(user.id),
                        "plan": plan.value
                    }
                }
            )

            logger.info(f"Created checkout session for user {user.id}: {checkout_session.id}")

            return {
                "checkout_url": checkout_session.url,
                "session_id": checkout_session.id
            }

        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating checkout session: {str(e)}")
            raise

    @staticmethod
    async def create_customer_portal_session(
        user: User,
        return_url: str
    ) -> str:
        """
        Stripe Customer Portal Session 생성

        사용자가 구독 관리, 결제 수단 변경, 인보이스 확인 등을 할 수 있습니다.

        Args:
            user: 현재 사용자
            return_url: 포털 종료 후 리디렉션 URL

        Returns:
            portal_url: Stripe Customer Portal URL

        Raises:
            ValueError: Stripe Customer ID가 없는 경우
            stripe.error.StripeError: Stripe API 오류
        """
        if not user.stripe_customer_id:
            raise ValueError("사용자에게 Stripe Customer ID가 없습니다. 먼저 구독을 생성해주세요.")

        try:
            portal_session = stripe.billing_portal.Session.create(
                customer=user.stripe_customer_id,
                return_url=return_url
            )

            logger.info(f"Created customer portal session for user {user.id}")

            return portal_session.url

        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating customer portal session: {str(e)}")
            raise

    @staticmethod
    async def verify_webhook_signature(
        payload: bytes,
        signature: str
    ) -> Optional[stripe.Event]:
        """
        Stripe Webhook Signature 검증

        FR-017: Stripe webhook 서명 검증

        Args:
            payload: Webhook 요청 바디 (raw bytes)
            signature: Stripe-Signature 헤더 값

        Returns:
            stripe.Event: 검증된 Stripe 이벤트
            None: 서명 검증 실패 시

        Raises:
            stripe.error.SignatureVerificationError: 서명 검증 실패
        """
        try:
            event = stripe.Webhook.construct_event(
                payload,
                signature,
                settings.STRIPE_WEBHOOK_SECRET
            )
            logger.info(f"Webhook signature verified: {event['type']}")
            return event

        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Webhook signature verification failed: {str(e)}")
            raise

    @staticmethod
    async def handle_webhook_event(
        event: stripe.Event,
        db: Session
    ) -> Dict[str, Any]:
        """
        Stripe Webhook 이벤트 처리

        주요 이벤트:
        - customer.subscription.created: 구독 생성
        - customer.subscription.updated: 구독 업데이트
        - customer.subscription.deleted: 구독 취소
        - invoice.payment_succeeded: 결제 성공
        - invoice.payment_failed: 결제 실패

        Args:
            event: Stripe 이벤트 객체
            db: 데이터베이스 세션

        Returns:
            처리 결과 딕셔너리

        Raises:
            Exception: 이벤트 처리 중 오류 발생 시
        """
        event_type = event["type"]
        event_data = event["data"]["object"]

        logger.info(f"Processing webhook event: {event_type}")

        # Webhook 이벤트 저장
        webhook = Webhook(
            type=event_type,
            provider="stripe",
            event_id=event["id"],
            payload_json=dict(event),
            status="pending"
        )
        db.add(webhook)
        db.commit()

        try:
            # 이벤트 타입별 처리
            if event_type.startswith("customer.subscription."):
                result = await StripeService._handle_subscription_event(event_type, event_data, db)
            elif event_type.startswith("invoice."):
                result = await StripeService._handle_invoice_event(event_type, event_data, db)
            else:
                logger.info(f"Unhandled event type: {event_type}")
                result = {"status": "ignored", "reason": "unhandled event type"}

            # Webhook 처리 완료 상태 업데이트
            webhook.status = "processed"
            webhook.processed_at = datetime.utcnow()
            db.commit()

            return result

        except Exception as e:
            # Webhook 처리 실패 상태 업데이트
            webhook.status = "failed"
            webhook.error_message = str(e)
            db.commit()

            logger.error(f"Error handling webhook event {event_type}: {str(e)}")
            raise

    @staticmethod
    async def _handle_subscription_event(
        event_type: str,
        subscription_data: Dict[str, Any],
        db: Session
    ) -> Dict[str, Any]:
        """
        구독 관련 이벤트 처리

        Args:
            event_type: 이벤트 타입
            subscription_data: 구독 데이터
            db: 데이터베이스 세션

        Returns:
            처리 결과
        """
        # Stripe Subscription ID로 구독 조회
        stripe_subscription_id = subscription_data["id"]
        customer_id = subscription_data["customer"]

        # User 조회
        user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
        if not user:
            logger.error(f"User not found for Stripe customer: {customer_id}")
            return {"status": "error", "reason": "user not found"}

        # Subscription 조회 또는 생성
        subscription = db.query(Subscription).filter(
            Subscription.user_id == user.id
        ).first()

        if not subscription:
            subscription = Subscription(user_id=user.id)
            db.add(subscription)

        # 구독 상태 업데이트
        subscription.stripe_subscription_id = stripe_subscription_id
        subscription.status = subscription_data["status"]
        subscription.current_period_start = datetime.fromtimestamp(subscription_data["current_period_start"])
        subscription.current_period_end = datetime.fromtimestamp(subscription_data["current_period_end"])
        subscription.cancel_at_period_end = subscription_data.get("cancel_at_period_end", False)

        # 구독 취소 처리 (customer.subscription.deleted 또는 status가 canceled)
        if event_type == "customer.subscription.deleted" or subscription_data["status"] == "canceled":
            logger.info(f"Subscription canceled for user {user.id}, downgrading to Free plan")
            subscription.plan = PlanType.FREE.value
            user.plan = PlanType.FREE.value
        # 플랜 정보 추출 (Stripe Product/Price 메타데이터에서)
        elif subscription_data.get("items") and subscription_data["items"]["data"]:
            price_id = subscription_data["items"]["data"][0]["price"]["id"]

            # Price ID로 플랜 매핑
            if price_id == settings.STRIPE_PRO_PRICE_ID:
                subscription.plan = PlanType.PRO.value
                user.plan = PlanType.PRO.value
            elif price_id == settings.STRIPE_AGENCY_PRICE_ID:
                subscription.plan = PlanType.AGENCY.value
                user.plan = PlanType.AGENCY.value

        db.commit()

        logger.info(f"Updated subscription for user {user.id}: {event_type}")

        return {
            "status": "success",
            "user_id": str(user.id),
            "plan": subscription.plan,
            "subscription_status": subscription.status
        }

    @staticmethod
    async def _handle_invoice_event(
        event_type: str,
        invoice_data: Dict[str, Any],
        db: Session
    ) -> Dict[str, Any]:
        """
        인보이스 관련 이벤트 처리

        Args:
            event_type: 이벤트 타입
            invoice_data: 인보이스 데이터
            db: 데이터베이스 세션

        Returns:
            처리 결과
        """
        customer_id = invoice_data["customer"]

        # User 조회
        user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
        if not user:
            logger.error(f"User not found for Stripe customer: {customer_id}")
            return {"status": "error", "reason": "user not found"}

        # 결제 성공/실패에 따른 처리
        if event_type == "invoice.payment_succeeded":
            logger.info(f"Payment succeeded for user {user.id}")
            # 추가 처리 (예: 이메일 전송, 사용량 리셋 등)

        elif event_type == "invoice.payment_failed":
            logger.warning(f"Payment failed for user {user.id}")
            # 추가 처리 (예: 알림 전송, 구독 상태 업데이트 등)

        return {
            "status": "success",
            "user_id": str(user.id),
            "event_type": event_type
        }
