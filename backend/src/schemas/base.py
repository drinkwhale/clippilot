"""
Base Pydantic schemas for ClipPilot API
Provides common schema patterns and validation
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class BaseSchema(BaseModel):
    """Base schema with common configuration"""

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        json_schema_extra={
            "example": {}
        }
    )


class TimestampMixin(BaseModel):
    """Mixin for created_at and updated_at timestamps"""

    created_at: datetime = Field(
        ...,
        description="생성 시각",
        json_schema_extra={"example": "2024-01-01T00:00:00Z"}
    )
    updated_at: datetime = Field(
        ...,
        description="수정 시각",
        json_schema_extra={"example": "2024-01-01T00:00:00Z"}
    )


class UUIDMixin(BaseModel):
    """Mixin for UUID primary key"""

    id: UUID = Field(
        ...,
        description="고유 식별자",
        json_schema_extra={"example": "123e4567-e89b-12d3-a456-426614174000"}
    )


class ErrorResponse(BaseSchema):
    """Standard error response schema"""

    error: "ErrorDetail"


class ErrorDetail(BaseSchema):
    """Error detail structure"""

    code: str = Field(
        ...,
        description="에러 코드",
        json_schema_extra={"example": "INVALID_INPUT"}
    )
    message: str = Field(
        ...,
        description="한국어 에러 메시지",
        json_schema_extra={"example": "입력 값이 유효하지 않습니다"}
    )
    details: Optional[dict] = Field(
        None,
        description="추가 에러 상세 정보"
    )


class SuccessResponse(BaseSchema):
    """Standard success response schema"""

    success: bool = Field(
        True,
        description="성공 여부"
    )
    message: Optional[str] = Field(
        None,
        description="성공 메시지"
    )


class PaginationParams(BaseSchema):
    """Common pagination parameters"""

    page: int = Field(
        1,
        ge=1,
        description="페이지 번호 (1부터 시작)"
    )
    page_size: int = Field(
        20,
        ge=1,
        le=100,
        description="페이지당 항목 수 (최대 100)"
    )


class PaginatedResponse(BaseSchema):
    """Paginated response wrapper"""

    items: list = Field(
        ...,
        description="항목 목록"
    )
    total: int = Field(
        ...,
        description="전체 항목 수"
    )
    page: int = Field(
        ...,
        description="현재 페이지"
    )
    page_size: int = Field(
        ...,
        description="페이지당 항목 수"
    )
    total_pages: int = Field(
        ...,
        description="전체 페이지 수"
    )
    has_next: bool = Field(
        ...,
        description="다음 페이지 존재 여부"
    )
    has_prev: bool = Field(
        ...,
        description="이전 페이지 존재 여부"
    )


# Error codes
class ErrorCode:
    """Standard error codes"""

    # Authentication & Authorization (1xxx)
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    INVALID_TOKEN = "INVALID_TOKEN"
    TOKEN_EXPIRED = "TOKEN_EXPIRED"

    # Validation (2xxx)
    INVALID_INPUT = "INVALID_INPUT"
    MISSING_FIELD = "MISSING_FIELD"
    INVALID_FORMAT = "INVALID_FORMAT"

    # Resource (3xxx)
    NOT_FOUND = "NOT_FOUND"
    ALREADY_EXISTS = "ALREADY_EXISTS"
    CONFLICT = "CONFLICT"

    # Business Logic (4xxx)
    QUOTA_EXCEEDED = "QUOTA_EXCEEDED"
    INSUFFICIENT_CREDITS = "INSUFFICIENT_CREDITS"
    OPERATION_NOT_ALLOWED = "OPERATION_NOT_ALLOWED"

    # External Services (5xxx)
    EXTERNAL_API_ERROR = "EXTERNAL_API_ERROR"
    YOUTUBE_API_ERROR = "YOUTUBE_API_ERROR"
    OPENAI_API_ERROR = "OPENAI_API_ERROR"
    STORAGE_ERROR = "STORAGE_ERROR"

    # Internal (9xxx)
    INTERNAL_ERROR = "INTERNAL_ERROR"
    DATABASE_ERROR = "DATABASE_ERROR"
    QUEUE_ERROR = "QUEUE_ERROR"


# Update forward references
ErrorResponse.model_rebuild()
