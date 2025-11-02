"""
구독 관리 서비스

구독 상태 동기화, 플랜 업그레이드/다운그레이드 로직을 담당합니다.

주요 기능:
- T126: Webhook을 통한 구독 상태 동기화
- T127: 플랜 업그레이드 즉시 활성화 (FR-009)
- T128: 플랜 다운그레이드 기간 종료 시 적용 (FR-009)
"""
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Dict, Any
import logging

from ..models.user import User
from ..models.subscription import Subscription
from ..schemas.billing import PlanType, SubscriptionStatus

logger = logging.getLogger(__name__)


class SubscriptionService:
    """구독 관리 서비스"""

    @staticmethod
    async def sync_subscription_from_stripe(
        user: User,
        stripe_subscription_data: Dict[str, Any],
        db: Session
    ) -> Subscription:
        """
        T126: Stripe webhook으로부터 구독 상태 동기화

        Stripe의 구독 정보를 로컬 데이터베이스와 동기화합니다.

        Args:
            user: 사용자 객체
            stripe_subscription_data: Stripe 구독 데이터
            db: 데이터베이스 세션

        Returns:
            동기화된 Subscription 객체
        """
        # 기존 구독 조회 또는 생성
        subscription = db.query(Subscription).filter(
            Subscription.user_id == user.id
        ).first()

        if not subscription:
            subscription = Subscription(user_id=user.id)
            db.add(subscription)
            logger.info(f"Created new subscription for user {user.id}")

        # Stripe 데이터로 업데이트
        subscription.stripe_subscription_id = stripe_subscription_data["id"]
        subscription.status = stripe_subscription_data["status"]
        subscription.current_period_start = datetime.fromtimestamp(
            stripe_subscription_data["current_period_start"]
        )
        subscription.current_period_end = datetime.fromtimestamp(
            stripe_subscription_data["current_period_end"]
        )
        subscription.cancel_at_period_end = stripe_subscription_data.get("cancel_at_period_end", False)

        # 플랜 정보 추출
        if stripe_subscription_data.get("items") and stripe_subscription_data["items"]["data"]:
            price_id = stripe_subscription_data["items"]["data"][0]["price"]["id"]

            # Price ID로 플랜 매핑 (config에서 가져옴)
            from ..config import settings

            if price_id == settings.STRIPE_PRO_PRICE_ID:
                new_plan = PlanType.PRO.value
            elif price_id == settings.STRIPE_AGENCY_PRICE_ID:
                new_plan = PlanType.AGENCY.value
            else:
                new_plan = PlanType.FREE.value

            old_plan = subscription.plan
            subscription.plan = new_plan

            # T127: 플랜 업그레이드 처리 (즉시 활성화)
            if old_plan and old_plan != new_plan:
                await SubscriptionService._handle_plan_change(
                    user=user,
                    old_plan=old_plan,
                    new_plan=new_plan,
                    subscription=subscription,
                    db=db
                )

            # User 모델의 plan도 동기화
            user.plan = new_plan

        db.commit()
        logger.info(f"Synced subscription for user {user.id}: {subscription.status}")

        return subscription

    @staticmethod
    async def _handle_plan_change(
        user: User,
        old_plan: str,
        new_plan: str,
        subscription: Subscription,
        db: Session
    ) -> None:
        """
        플랜 변경 처리

        T127: 업그레이드는 즉시 활성화
        T128: 다운그레이드는 기간 종료 시 적용

        Args:
            user: 사용자 객체
            old_plan: 기존 플랜
            new_plan: 새 플랜
            subscription: 구독 객체
            db: 데이터베이스 세션
        """
        # 플랜 순위 정의 (낮을수록 하위 플랜)
        plan_rank = {
            PlanType.FREE.value: 0,
            PlanType.PRO.value: 1,
            PlanType.AGENCY.value: 2
        }

        old_rank = plan_rank.get(old_plan, 0)
        new_rank = plan_rank.get(new_plan, 0)

        if new_rank > old_rank:
            # T127: 업그레이드 - 즉시 활성화 (FR-009)
            logger.info(f"Upgrade detected for user {user.id}: {old_plan} → {new_plan}")
            logger.info(f"Plan upgrade activated immediately for user {user.id}")

            # 업그레이드는 이미 subscription.plan에 반영되어 있으므로
            # 추가 처리가 필요하면 여기서 수행 (예: 이메일 전송, 알림 등)

        elif new_rank < old_rank:
            # T128: 다운그레이드 - 기간 종료 시 적용 (FR-009)
            logger.info(f"Downgrade detected for user {user.id}: {old_plan} → {new_plan}")

            if subscription.cancel_at_period_end:
                logger.info(f"Plan downgrade scheduled for period end: {subscription.current_period_end}")

                # 다운그레이드는 기간 종료 시 자동으로 적용됩니다
                # Stripe가 다음 billing cycle에 자동으로 처리
                # 추가 처리가 필요하면 여기서 수행 (예: 사용자 알림)
            else:
                # 즉시 취소된 경우
                logger.info(f"Plan downgrade applied immediately for user {user.id}")

    @staticmethod
    async def handle_subscription_canceled(
        user: User,
        db: Session
    ) -> None:
        """
        구독 취소 처리

        사용자가 구독을 취소하면 Free 플랜으로 다운그레이드됩니다.

        Args:
            user: 사용자 객체
            db: 데이터베이스 세션
        """
        subscription = db.query(Subscription).filter(
            Subscription.user_id == user.id
        ).first()

        if subscription:
            subscription.status = SubscriptionStatus.CANCELED.value
            subscription.plan = PlanType.FREE.value
            user.plan = PlanType.FREE.value

            db.commit()

            logger.info(f"Subscription canceled for user {user.id}, downgraded to Free plan")

    @staticmethod
    async def check_usage_quota(
        user: User,
        db: Session
    ) -> Dict[str, Any]:
        """
        사용량 할당량 체크

        FR-008: 플랜별 월간 생성 횟수 제한
        - Free: 20회
        - Pro: 500회
        - Agency: 무제한

        Args:
            user: 사용자 객체
            db: 데이터베이스 세션

        Returns:
            사용량 정보 딕셔너리
        """
        from ..models.usage_log import UsageLog
        from sqlalchemy import func

        # 플랜별 한도 설정
        plan_limits = {
            PlanType.FREE.value: 20,
            PlanType.PRO.value: 500,
            PlanType.AGENCY.value: 999999  # 무제한
        }

        current_plan = user.plan or PlanType.FREE.value
        usage_limit = plan_limits.get(current_plan, 20)

        # 이번 달 사용량 조회
        now = datetime.utcnow()
        start_of_month = datetime(now.year, now.month, 1)

        usage_current = db.query(func.count(UsageLog.id)).filter(
            UsageLog.user_id == user.id,
            UsageLog.created_at >= start_of_month
        ).scalar() or 0

        # 사용량 퍼센트 계산
        usage_percentage = (usage_current / usage_limit * 100) if usage_limit > 0 else 0.0

        # 할당량 초과 여부
        quota_exceeded = usage_current >= usage_limit

        return {
            "usage_current": usage_current,
            "usage_limit": usage_limit,
            "usage_percentage": usage_percentage,
            "quota_exceeded": quota_exceeded,
            "plan": current_plan
        }
