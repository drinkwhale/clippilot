"""
User Pydantic schemas for ClipPilot API
Handles user data validation and serialization
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import EmailStr, Field

from .base import BaseSchema, TimestampMixin, UUIDMixin


class UserBase(BaseSchema):
    """Base user schema with common fields"""

    email: EmailStr = Field(
        ...,
        description="사용자 이메일 주소",
        json_schema_extra={"example": "user@example.com"}
    )


class UserCreate(UserBase):
    """
    Schema for creating a new user

    Used for signup requests
    """

    password: str = Field(
        ...,
        min_length=8,
        max_length=100,
        description="사용자 비밀번호 (최소 8자)",
        json_schema_extra={"example": "SecurePass123!"}
    )


class UserUpdate(BaseSchema):
    """
    Schema for updating user information

    All fields are optional
    """

    email: Optional[EmailStr] = Field(
        None,
        description="사용자 이메일 주소"
    )
    onboarding_completed: Optional[bool] = Field(
        None,
        description="온보딩 완료 여부"
    )


class UserResponse(UUIDMixin, TimestampMixin, BaseSchema):
    """
    Schema for user response data

    Excludes sensitive fields like password
    """

    email: str = Field(
        ...,
        description="사용자 이메일 주소",
        json_schema_extra={"example": "user@example.com"}
    )
    plan: str = Field(
        ...,
        description="구독 플랜 (free/pro/agency)",
        json_schema_extra={"example": "free"}
    )
    oauth_provider: str = Field(
        ...,
        description="OAuth 제공자 (email/google)",
        json_schema_extra={"example": "email"}
    )
    is_active: bool = Field(
        ...,
        description="계정 활성화 여부",
        json_schema_extra={"example": True}
    )
    email_verified: bool = Field(
        ...,
        description="이메일 인증 여부",
        json_schema_extra={"example": True}
    )
    last_login_at: Optional[datetime] = Field(
        None,
        description="마지막 로그인 시각",
        json_schema_extra={"example": "2024-01-01T00:00:00Z"}
    )
    onboarding_completed: bool = Field(
        ...,
        description="온보딩 완료 여부",
        json_schema_extra={"example": False}
    )


class UserInDB(UserResponse):
    """
    Schema for user data stored in database

    Includes internal fields not exposed in API responses
    """

    login_attempts: int = Field(
        ...,
        description="로그인 시도 실패 횟수",
        json_schema_extra={"example": 0}
    )
    locked_until: Optional[datetime] = Field(
        None,
        description="계정 잠김 해제 시각",
        json_schema_extra={"example": None}
    )


class OnboardingStatusResponse(BaseSchema):
    """Schema for onboarding status response"""

    onboarding_completed: bool = Field(
        ...,
        description="온보딩 완료 여부",
        json_schema_extra={"example": False}
    )
    user: UserResponse = Field(
        ...,
        description="사용자 정보"
    )


class OnboardingUpdateRequest(BaseSchema):
    """Schema for updating onboarding status"""

    onboarding_completed: bool = Field(
        True,
        description="온보딩 완료 여부",
        json_schema_extra={"example": True}
    )
