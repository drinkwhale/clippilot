"""
Channel Pydantic schemas for ClipPilot API.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import AnyUrl, Field

from .base import BaseSchema, TimestampMixin, UUIDMixin


class ChannelBase(BaseSchema):
    """Shared channel fields."""

    yt_channel_id: str = Field(
        ...,
        min_length=10,
        description="YouTube 채널 ID (일반적으로 UC로 시작)",
        json_schema_extra={"example": "UC_x5XG1OV2P6uZZ5FSM9Ttw"},
    )
    channel_name: str = Field(
        ...,
        description="YouTube 채널명",
        json_schema_extra={"example": "ClipPilot Official"},
    )
    channel_thumbnail: Optional[AnyUrl] = Field(
        None,
        description="채널 프로필 이미지 URL",
        json_schema_extra={"example": "https://yt3.ggpht.com/ytc/AKedOLQxyz=s88-c-k-c0x00ffffff-no-rj"},
    )


class ChannelCreate(ChannelBase):
    """Schema used internally when creating a channel connection."""

    token_expires_at: datetime = Field(
        ...,
        description="OAuth 액세스 토큰 만료 시각",
        json_schema_extra={"example": "2024-01-01T00:00:00Z"},
    )
    is_active: bool = Field(
        True,
        description="채널 활성화 상태",
        json_schema_extra={"example": True},
    )


class ChannelResponse(UUIDMixin, TimestampMixin, ChannelBase):
    """Schema returned to clients when listing channels."""

    user_id: UUID = Field(
        ...,
        description="채널 소유 사용자 ID",
        json_schema_extra={"example": "c1d5f7b3-1234-4567-89ab-abcdef012345"},
    )
    token_expires_at: datetime = Field(
        ...,
        description="OAuth 액세스 토큰 만료 시각",
        json_schema_extra={"example": "2024-01-01T00:00:00Z"},
    )
    is_active: bool = Field(
        ...,
        description="채널 활성화 상태",
        json_schema_extra={"example": True},
    )
    requires_reauth: bool = Field(
        ...,
        description="토큰 재인증 필요 여부 (만료 또는 만료 임박)",
        json_schema_extra={"example": False},
    )
