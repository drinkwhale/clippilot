"""
Authentication Pydantic schemas for ClipPilot API
Handles auth request/response validation
"""

from typing import Optional
from uuid import UUID

from pydantic import EmailStr, Field

from .base import BaseSchema
from .user import UserResponse


class SignupRequest(BaseSchema):
    """
    Schema for user signup request

    Requirements:
    - FR-021: Email/password based signup
    - FR-022: Password minimum 8 characters
    """

    email: EmailStr = Field(
        ...,
        description="사용자 이메일 주소",
        json_schema_extra={"example": "user@example.com"}
    )
    password: str = Field(
        ...,
        min_length=8,
        max_length=100,
        description="사용자 비밀번호 (최소 8자)",
        json_schema_extra={"example": "SecurePass123!"}
    )


class LoginRequest(BaseSchema):
    """
    Schema for user login request

    Requirements:
    - FR-023: Email/password based login
    - 3 failed attempts trigger 15-minute lockout
    """

    email: EmailStr = Field(
        ...,
        description="사용자 이메일 주소",
        json_schema_extra={"example": "user@example.com"}
    )
    password: str = Field(
        ...,
        description="사용자 비밀번호",
        json_schema_extra={"example": "SecurePass123!"}
    )


class TokenResponse(BaseSchema):
    """
    Schema for authentication token response

    Returns JWT access token and user info
    """

    access_token: str = Field(
        ...,
        description="JWT 액세스 토큰",
        json_schema_extra={"example": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
    )
    token_type: str = Field(
        "bearer",
        description="토큰 타입",
        json_schema_extra={"example": "bearer"}
    )
    user: UserResponse = Field(
        ...,
        description="사용자 정보"
    )


class ResetPasswordRequest(BaseSchema):
    """
    Schema for password reset request

    Requirements:
    - FR-024: Password reset functionality
    """

    email: EmailStr = Field(
        ...,
        description="비밀번호를 재설정할 이메일 주소",
        json_schema_extra={"example": "user@example.com"}
    )


class ResetPasswordConfirm(BaseSchema):
    """
    Schema for password reset confirmation

    Used to set new password after reset email verification
    """

    token: str = Field(
        ...,
        description="비밀번호 재설정 토큰 (이메일에서 전송됨)",
        json_schema_extra={"example": "reset_token_12345"}
    )
    new_password: str = Field(
        ...,
        min_length=8,
        max_length=100,
        description="새 비밀번호 (최소 8자)",
        json_schema_extra={"example": "NewSecurePass123!"}
    )


class ChangePasswordRequest(BaseSchema):
    """
    Schema for password change (when user is logged in)
    """

    current_password: str = Field(
        ...,
        description="현재 비밀번호",
        json_schema_extra={"example": "OldPassword123!"}
    )
    new_password: str = Field(
        ...,
        min_length=8,
        max_length=100,
        description="새 비밀번호 (최소 8자)",
        json_schema_extra={"example": "NewPassword123!"}
    )


class DeleteAccountRequest(BaseSchema):
    """
    Schema for account deletion request

    Requirements:
    - FR-025: Account deletion with 30-day grace period
    """

    password: str = Field(
        ...,
        description="계정 삭제 확인을 위한 비밀번호",
        json_schema_extra={"example": "SecurePass123!"}
    )
    confirmation: str = Field(
        ...,
        description="삭제 확인 문구 (정확히 'DELETE' 입력)",
        json_schema_extra={"example": "DELETE"}
    )


class LoginAttemptResponse(BaseSchema):
    """
    Schema for login attempt information

    Used to inform users about failed login attempts and lockout status
    """

    attempts: int = Field(
        ...,
        ge=0,
        description="현재 로그인 시도 실패 횟수",
        json_schema_extra={"example": 0}
    )
    max_attempts: int = Field(
        3,
        description="최대 허용 시도 횟수",
        json_schema_extra={"example": 3}
    )
    locked: bool = Field(
        ...,
        description="계정 잠김 여부",
        json_schema_extra={"example": False}
    )
    locked_until: Optional[str] = Field(
        None,
        description="계정 잠김 해제 시각 (ISO 8601)",
        json_schema_extra={"example": "2024-01-01T00:15:00Z"}
    )
    remaining_attempts: int = Field(
        ...,
        ge=0,
        description="남은 시도 횟수",
        json_schema_extra={"example": 3}
    )
