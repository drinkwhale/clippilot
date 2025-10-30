"""
Channel model for ClipPilot

Stores YouTube OAuth connection information for users.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import BaseModel


class Channel(BaseModel):
    """
    YouTube channel connection model.

    Persisted fields:
        user_id: Owner user UUID
        yt_channel_id: YouTube channel id (starts with UC)
        channel_name: Display name
        channel_thumbnail: Profile thumbnail URL
        access_token_meta: Encrypted token metadata payload (JSONB)
        token_expires_at: Access token expiration timestamp
        is_active: Whether channel is active (revoked tokens mark inactive)
    """

    __tablename__ = "channels"

    TOKEN_EXPIRY_GRACE_SECONDS = 120

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    yt_channel_id: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True,
        comment="YouTube 채널 ID (UC로 시작)",
    )
    channel_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="채널명",
    )
    channel_thumbnail: Mapped[Optional[str]] = mapped_column(
        String,
        nullable=True,
        comment="채널 프로필 이미지 URL",
    )
    access_token_meta: Mapped[Dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        comment="OAuth 토큰 메타데이터 (암호화)",
    )
    token_expires_at: Mapped[datetime] = mapped_column(
        nullable=False,
        comment="토큰 만료 시각",
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
        comment="채널 활성화 상태",
    )

    # Relationships
    user = relationship("User", back_populates="channels")

    def __repr__(self) -> str:
        return (
            f"Channel(id={self.id}, yt_channel_id={self.yt_channel_id!r}, "
            f"user_id={self.user_id}, is_active={self.is_active})"
        )

    def is_token_expired(self, *, grace_seconds: int | None = None) -> bool:
        """
        Check whether the stored access token is expired (with optional grace period).

        Args:
            grace_seconds: Optional grace window in seconds to pre-empt expiry.

        Returns:
            True if the token is expired or within the grace window.
        """
        window = grace_seconds if grace_seconds is not None else self.TOKEN_EXPIRY_GRACE_SECONDS
        now = datetime.now(timezone.utc)
        return self.token_expires_at <= now + timedelta(seconds=window)

    def mark_inactive(self) -> None:
        """Convenience helper to mark the channel as inactive."""
        self.is_active = False
