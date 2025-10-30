"""
Quota Service for ClipPilot
Manages usage quotas and limits based on subscription plans (FR-008)
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from uuid import UUID
import logging

from sqlalchemy import select, func
from sqlalchemy.orm import Session

from ..models.user import User, PlanType
from ..models.subscription import Subscription, SubscriptionPlan
from ..models.job import Job, JobStatus
from ..core.exceptions import QuotaExceededError

logger = logging.getLogger(__name__)


class QuotaService:
    """Service for checking and managing usage quotas"""

    # Plan quota limits (FR-008)
    QUOTA_LIMITS = {
        PlanType.FREE: 20,      # 월 20회
        PlanType.PRO: 500,      # 월 500회
        PlanType.AGENCY: 2000,  # 월 2000회
    }

    def __init__(self, db: Session):
        """
        Initialize quota service

        Args:
            db: Database session
        """
        self.db = db

    def check_quota(self, user_id: UUID) -> Dict[str, Any]:
        """
        Check user's current usage and quota

        Args:
            user_id: User ID to check

        Returns:
            Dict with:
                - plan: User's plan
                - quota_limit: Monthly quota limit
                - quota_used: Jobs created this month
                - quota_remaining: Remaining quota
                - quota_reset_at: When quota resets (first day of next month)
                - is_exceeded: Whether quota is exceeded

        Raises:
            QuotaExceededError: If quota is exceeded
        """
        # Get user and subscription
        user = self._get_user(user_id)

        # Get quota limit for user's plan
        quota_limit = self.QUOTA_LIMITS.get(user.plan, 20)

        # Calculate current billing period
        now = datetime.utcnow()
        period_start = datetime(now.year, now.month, 1)

        # Calculate next month for reset date
        if now.month == 12:
            period_end = datetime(now.year + 1, 1, 1)
        else:
            period_end = datetime(now.year, now.month + 1, 1)

        # Count jobs created in current period
        quota_used = self._count_jobs_in_period(
            user_id=user_id,
            period_start=period_start,
            period_end=period_end,
        )

        # Calculate remaining quota
        quota_remaining = max(0, quota_limit - quota_used)
        is_exceeded = quota_used >= quota_limit

        logger.info(
            f"Quota check: user_id={user_id}, plan={user.plan.value}, "
            f"used={quota_used}/{quota_limit}, remaining={quota_remaining}"
        )

        return {
            "plan": user.plan.value,
            "quota_limit": quota_limit,
            "quota_used": quota_used,
            "quota_remaining": quota_remaining,
            "quota_reset_at": period_end.isoformat(),
            "is_exceeded": is_exceeded,
        }

    def validate_quota(self, user_id: UUID) -> None:
        """
        Validate that user has remaining quota

        Args:
            user_id: User ID to validate

        Raises:
            QuotaExceededError: If quota is exceeded
        """
        quota_info = self.check_quota(user_id)

        if quota_info["is_exceeded"]:
            raise QuotaExceededError(
                message=f"월간 생성 한도({quota_info['quota_limit']}회)를 초과했습니다. "
                        f"플랜을 업그레이드하거나 {quota_info['quota_reset_at'][:10]}에 한도가 초기화됩니다.",
                quota_limit=quota_info["quota_limit"],
                quota_used=quota_info["quota_used"],
                quota_reset_at=quota_info["quota_reset_at"],
            )

        # Warn if 80% used (FR-033)
        usage_percentage = (quota_info["quota_used"] / quota_info["quota_limit"]) * 100
        if usage_percentage >= 80:
            logger.warning(
                f"User approaching quota limit: user_id={user_id}, "
                f"usage={usage_percentage:.1f}%"
            )

    def _get_user(self, user_id: UUID) -> User:
        """
        Get user by ID

        Args:
            user_id: User ID

        Returns:
            User object

        Raises:
            ValueError: If user not found
        """
        stmt = select(User).where(User.id == user_id)
        result = self.db.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
            raise ValueError(f"User not found: {user_id}")

        return user

    def _count_jobs_in_period(
        self,
        user_id: UUID,
        period_start: datetime,
        period_end: datetime,
    ) -> int:
        """
        Count jobs created by user in time period

        Args:
            user_id: User ID
            period_start: Period start (inclusive)
            period_end: Period end (exclusive)

        Returns:
            Number of jobs created in period
        """
        stmt = (
            select(func.count(Job.id))
            .where(
                Job.user_id == user_id,
                Job.created_at >= period_start,
                Job.created_at < period_end,
            )
        )

        result = self.db.execute(stmt)
        count = result.scalar_one()

        return count

    def get_usage_percentage(self, user_id: UUID) -> float:
        """
        Get current usage as percentage of quota

        Args:
            user_id: User ID

        Returns:
            Usage percentage (0-100)
        """
        quota_info = self.check_quota(user_id)

        if quota_info["quota_limit"] == 0:
            return 0.0

        return (quota_info["quota_used"] / quota_info["quota_limit"]) * 100

    def should_show_quota_warning(self, user_id: UUID) -> bool:
        """
        Check if user should see quota warning (80% threshold, FR-033)

        Args:
            user_id: User ID

        Returns:
            True if warning should be shown
        """
        usage_percentage = self.get_usage_percentage(user_id)
        return usage_percentage >= 80

    def should_show_upgrade_prompt(self, user_id: UUID) -> bool:
        """
        Check if user should see upgrade prompt (100% threshold, FR-008)

        Args:
            user_id: User ID

        Returns:
            True if upgrade prompt should be shown
        """
        quota_info = self.check_quota(user_id)
        return quota_info["is_exceeded"]


def get_quota_service(db: Session) -> QuotaService:
    """
    Factory function to get QuotaService instance

    Args:
        db: Database session

    Returns:
        QuotaService instance
    """
    return QuotaService(db)
