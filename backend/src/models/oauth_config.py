"""
OAuth configuration model for storing YouTube OAuth credentials
"""

from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import Boolean, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class OAuthConfig(Base):
    """
    OAuth configuration for YouTube integration
    Stores encrypted OAuth credentials in the database
    """

    __tablename__ = "oauth_configs"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    provider: Mapped[str] = mapped_column(
        String(50), nullable=False, default="youtube"
    )  # youtube, google, etc.
    client_id: Mapped[str] = mapped_column(Text, nullable=False)
    client_secret_encrypted: Mapped[str] = mapped_column(
        Text, nullable=False
    )  # Encrypted with pgcrypto
    redirect_uri: Mapped[str] = mapped_column(Text, nullable=False)
    config_meta: Mapped[dict] = mapped_column(
        JSONB, nullable=False, default=dict
    )  # Additional config (scopes, etc.)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def __repr__(self) -> str:
        return f"<OAuthConfig(provider={self.provider}, is_active={self.is_active})>"
