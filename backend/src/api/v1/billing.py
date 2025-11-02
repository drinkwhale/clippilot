"""
결제 및 구독 관리 API

Stripe를 통한 결제 처리, 구독 관리 엔드포인트를 제공합니다.

주요 기능:
- Checkout Session 생성 (FR-009, FR-017)
- Customer Portal 접근
- 구독 정보 조회
- Webhook 이벤트 처리
"""
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session
from typing import Optional
import logging

from ...core.billing import StripeService
from ...core.database import get_db
from ...middleware.auth import get_current_user
from ...models.user import User
from ...models.subscription import Subscription
from ...models.usage_log import UsageLog
from ...schemas.billing import (
    CheckoutRequest,
    CheckoutResponse,
    PortalRequest,
    PortalResponse,
    SubscriptionResponse,
    PlanType,
)
from ...services.subscription_service import SubscriptionService
from datetime import datetime, timedelta
from sqlalchemy import func

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/billing", tags=["billing"])


@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout_session(
    request: CheckoutRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Stripe Checkout Session 생성

    FR-009: 플랜 업그레이드 기능
    FR-017: Stripe를 통한 결제 처리

    플랜 업그레이드를 위한 Stripe Checkout 페이지 URL을 생성합니다.
    사용자는 이 URL로 이동하여 결제를 진행합니다.

    업그레이드 규칙:
    - Pro → Agency: 가능
    - Free → Pro/Agency: 가능
    - 다운그레이드는 Customer Portal에서 취소를 통해 진행
    """
    try:
        # 기본 URL 설정
        base_url = "https://clippilot.com"  # 프로덕션에서는 환경 변수로 관리
        success_url = request.success_url or f"{base_url}/dashboard/settings/billing?success=true"
        cancel_url = request.cancel_url or f"{base_url}/dashboard/settings/billing?canceled=true"

        # Checkout Session 생성
        result = await StripeService.create_checkout_session(
            user=current_user,
            plan=request.plan,
            success_url=success_url,
            cancel_url=cancel_url,
            db=db
        )

        return CheckoutResponse(
            checkout_url=result["checkout_url"],
            session_id=result["session_id"]
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating checkout session: {str(e)}")
        raise HTTPException(status_code=500, detail="결제 세션 생성 중 오류가 발생했습니다")


@router.post("/portal", response_model=PortalResponse)
async def create_customer_portal_session(
    request: PortalRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Stripe Customer Portal Session 생성

    사용자가 구독 관리, 결제 수단 변경, 인보이스 확인 등을 할 수 있는
    Stripe Customer Portal 페이지 URL을 생성합니다.

    기능:
    - 구독 플랜 변경/취소
    - 결제 수단 관리
    - 인보이스 확인 및 다운로드
    - 결제 내역 조회
    """
    try:
        # 기본 URL 설정
        base_url = "https://clippilot.com"  # 프로덕션에서는 환경 변수로 관리
        return_url = request.return_url or f"{base_url}/dashboard/settings/billing"

        # Customer Portal Session 생성
        portal_url = await StripeService.create_customer_portal_session(
            user=current_user,
            return_url=return_url
        )

        return PortalResponse(portal_url=portal_url)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating customer portal session: {str(e)}")
        raise HTTPException(status_code=500, detail="고객 포털 세션 생성 중 오류가 발생했습니다")


@router.get("/subscription", response_model=SubscriptionResponse)
async def get_subscription_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    구독 정보 조회

    현재 사용자의 구독 상태, 플랜, 사용량 정보를 조회합니다.

    응답 정보:
    - 현재 플랜 및 상태
    - 구독 기간 정보
    - 취소 예정 여부
    - 월간 사용량 (생성 횟수)
    - 플랜별 한도
    """
    try:
        # 구독 정보 조회
        subscription = db.query(Subscription).filter(
            Subscription.user_id == current_user.id
        ).first()

        # 플랜별 한도 설정 (FR-008)
        plan_limits = {
            PlanType.FREE.value: 20,
            PlanType.PRO.value: 500,
            PlanType.AGENCY.value: 999999  # 무제한 (실질적으로 큰 숫자)
        }

        current_plan = current_user.plan or PlanType.FREE.value
        usage_limit = plan_limits.get(current_plan, 20)

        # 이번 달 사용량 조회
        now = datetime.utcnow()
        start_of_month = datetime(now.year, now.month, 1)

        usage_current = db.query(func.count(UsageLog.id)).filter(
            UsageLog.user_id == current_user.id,
            UsageLog.created_at >= start_of_month
        ).scalar() or 0

        # 사용량 퍼센트 계산
        usage_percentage = (usage_current / usage_limit * 100) if usage_limit > 0 else 0.0

        # 구독 정보가 없으면 Free 플랜으로 간주
        if not subscription:
            return SubscriptionResponse(
                plan=PlanType.FREE,
                status="active",
                current_period_start=None,
                current_period_end=None,
                cancel_at_period_end=False,
                stripe_customer_id=current_user.stripe_customer_id,
                stripe_subscription_id=None,
                usage_current=usage_current,
                usage_limit=usage_limit,
                usage_percentage=usage_percentage
            )

        return SubscriptionResponse(
            plan=PlanType(subscription.plan) if subscription.plan else PlanType.FREE,
            status=subscription.status,
            current_period_start=subscription.current_period_start,
            current_period_end=subscription.current_period_end,
            cancel_at_period_end=subscription.cancel_at_period_end,
            stripe_customer_id=current_user.stripe_customer_id,
            stripe_subscription_id=subscription.stripe_subscription_id,
            usage_current=usage_current,
            usage_limit=usage_limit,
            usage_percentage=usage_percentage
        )

    except Exception as e:
        logger.error(f"Error getting subscription info: {str(e)}")
        raise HTTPException(status_code=500, detail="구독 정보 조회 중 오류가 발생했습니다")


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="stripe-signature"),
    db: Session = Depends(get_db)
):
    """
    Stripe Webhook 엔드포인트

    FR-017: Stripe webhook 서명 검증

    Stripe로부터 webhook 이벤트를 수신하고 처리합니다.

    주요 이벤트:
    - customer.subscription.created: 구독 생성
    - customer.subscription.updated: 구독 업데이트
    - customer.subscription.deleted: 구독 취소
    - invoice.payment_succeeded: 결제 성공
    - invoice.payment_failed: 결제 실패

    보안:
    - Stripe 서명 검증 필수
    - 중복 이벤트 처리 방지
    """
    try:
        # 요청 바디 읽기 (raw bytes)
        payload = await request.body()

        if not stripe_signature:
            logger.error("Missing Stripe signature header")
            raise HTTPException(status_code=400, detail="Stripe 서명 헤더가 없습니다")

        # Stripe 서명 검증
        event = await StripeService.verify_webhook_signature(payload, stripe_signature)

        # 이벤트 처리
        result = await StripeService.handle_webhook_event(event, db)

        logger.info(f"Webhook processed successfully: {event['type']}")

        return {"status": "success", "result": result}

    except ValueError as e:
        logger.error(f"Webhook signature verification failed: {str(e)}")
        raise HTTPException(status_code=400, detail="Stripe 서명 검증 실패")
    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}")
        raise HTTPException(status_code=500, detail="Webhook 처리 중 오류가 발생했습니다")
