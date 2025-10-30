"""
Pydantic schemas for ClipPilot API
"""

from .base import (
    BaseSchema,
    TimestampMixin,
    UUIDMixin,
    ErrorResponse,
    ErrorDetail,
    ErrorCode,
    SuccessResponse,
    PaginationParams,
    PaginatedResponse,
)
from .user import (
    UserBase,
    UserCreate,
    UserUpdate,
    UserResponse,
    UserInDB,
    OnboardingStatusResponse,
    OnboardingUpdateRequest,
)
from .auth import (
    SignupRequest,
    LoginRequest,
    TokenResponse,
    ResetPasswordRequest,
    ResetPasswordConfirm,
    ChangePasswordRequest,
    DeleteAccountRequest,
    LoginAttemptResponse,
)
from .channel import (
    ChannelBase,
    ChannelCreate,
    ChannelResponse,
)

__all__ = [
    # Base
    "BaseSchema",
    "TimestampMixin",
    "UUIDMixin",
    "ErrorResponse",
    "ErrorDetail",
    "ErrorCode",
    "SuccessResponse",
    "PaginationParams",
    "PaginatedResponse",
    # User
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "UserInDB",
    "OnboardingStatusResponse",
    "OnboardingUpdateRequest",
    # Auth
    "SignupRequest",
    "LoginRequest",
    "TokenResponse",
    "ResetPasswordRequest",
    "ResetPasswordConfirm",
    "ChangePasswordRequest",
    "DeleteAccountRequest",
    "LoginAttemptResponse",
    # Channel
    "ChannelBase",
    "ChannelCreate",
    "ChannelResponse",
]
