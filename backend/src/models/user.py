"""
User model for ClipPilot
Manages user accounts and authentication
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import String, Boolean, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from .base import BaseModel


class PlanType(str, enum.Enum):
    """Subscription plan types"""
    FREE = "free"
    PRO = "pro"
    AGENCY = "agency"


class OAuthProvider(str, enum.Enum):
    """OAuth provider types"""
    EMAIL = "email"
    GOOGLE = "google"


class User(BaseModel):
    """
    User model for authentication and account management

    Attributes:
        email: User email address (unique)
        plan: Current subscription plan (free/pro/agency)
        oauth_provider: Authentication provider (email/google)
        is_active: Whether account is active
        email_verified: Whether email has been verified
        last_login_at: Timestamp of last successful login
        login_attempts: Failed login attempts counter
        locked_until: Account lock timestamp (after 3 failed attempts)
        onboarding_completed: Whether user completed onboarding flow
    """

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    plan: Mapped[PlanType] = mapped_column(
        SQLEnum(PlanType, name="plan_type", native_enum=False),
        nullable=False,
        default=PlanType.FREE,
        server_default=PlanType.FREE.value
    )
    oauth_provider: Mapped[OAuthProvider] = mapped_column(
        SQLEnum(OAuthProvider, name="oauth_provider", native_enum=False),
        nullable=False,
        default=OAuthProvider.EMAIL,
        server_default=OAuthProvider.EMAIL.value
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    email_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    last_login_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    login_attempts: Mapped[int] = mapped_column(nullable=False, default=0, server_default="0")
    locked_until: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    onboarding_completed: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false"
    )

    # Relationships
    subscription = relationship("Subscription", back_populates="user", uselist=False)
    channels = relationship(
        "Channel",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    jobs = relationship(
        "Job",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    usage_logs = relationship(
        "UsageLog",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    # TODO: Phase 7 (US3) - 템플릿 관리 시 추가
    # templates = relationship("Template", back_populates="user")

    def __repr__(self) -> str:
        return f"User(id={self.id}, email={self.email!r}, plan={self.plan.value})"
