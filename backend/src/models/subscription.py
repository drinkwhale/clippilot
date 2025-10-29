"""
Subscription model for ClipPilot
Manages user subscription plans and billing
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import String, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from .base import BaseModel


class SubscriptionStatus(str, enum.Enum):
    """Subscription status types"""
    ACTIVE = "active"
    CANCELED = "canceled"
    PAST_DUE = "past_due"
    TRIALING = "trialing"


class SubscriptionPlan(str, enum.Enum):
    """Subscription plan types (matches User.PlanType)"""
    FREE = "free"
    PRO = "pro"
    AGENCY = "agency"


class Subscription(BaseModel):
    """
    Subscription model for managing user plans and billing

    Attributes:
        user_id: Foreign key to users table
        plan: Subscription plan (free/pro/agency)
        status: Current subscription status
        stripe_customer_id: Stripe customer ID
        stripe_subscription_id: Stripe subscription ID
        current_period_start: Current billing period start
        current_period_end: Current billing period end
        cancel_at_period_end: Whether subscription will cancel at period end
        canceled_at: When subscription was canceled
    """

    __tablename__ = "subscriptions"

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True
    )
    plan: Mapped[SubscriptionPlan] = mapped_column(
        SQLEnum(SubscriptionPlan, name="subscription_plan", native_enum=False),
        nullable=False,
        default=SubscriptionPlan.FREE,
        server_default=SubscriptionPlan.FREE.value
    )
    status: Mapped[SubscriptionStatus] = mapped_column(
        SQLEnum(SubscriptionStatus, name="subscription_status", native_enum=False),
        nullable=False,
        default=SubscriptionStatus.ACTIVE,
        server_default=SubscriptionStatus.ACTIVE.value
    )
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    stripe_subscription_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    current_period_start: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    current_period_end: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    cancel_at_period_end: Mapped[bool] = mapped_column(
        nullable=False,
        default=False,
        server_default="false"
    )
    canceled_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)

    # Relationships
    user = relationship("User", back_populates="subscription")

    def __repr__(self) -> str:
        return (
            f"Subscription(id={self.id}, user_id={self.user_id}, "
            f"plan={self.plan.value}, status={self.status.value})"
        )

    @property
    def is_active(self) -> bool:
        """Check if subscription is currently active"""
        return self.status == SubscriptionStatus.ACTIVE

    @property
    def is_paid_plan(self) -> bool:
        """Check if subscription is a paid plan"""
        return self.plan in (SubscriptionPlan.PRO, SubscriptionPlan.AGENCY)
