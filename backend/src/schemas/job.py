"""
Job Pydantic schemas for ClipPilot API.
"""

from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID

from pydantic import Field, field_validator

from .base import BaseSchema, TimestampMixin, UUIDMixin
from ..models.job import JobStatus


class JobBase(BaseSchema):
    """Shared job fields."""

    prompt: str = Field(
        ...,
        min_length=10,
        max_length=2000,
        description="사용자 입력 프롬프트 (10-2000자)",
        json_schema_extra={"example": "30초 분량의 아이폰 15 Pro 리뷰 숏폼 영상을 만들어줘"},
    )
    template_id: Optional[UUID] = Field(
        None,
        description="사용할 템플릿 ID (선택사항)",
        json_schema_extra={"example": "a1b2c3d4-5678-90ab-cdef-1234567890ab"},
    )


class JobCreate(JobBase):
    """Schema for creating a new job."""

    @field_validator("prompt")
    @classmethod
    def validate_prompt(cls, v: str) -> str:
        """프롬프트 검증"""
        v = v.strip()
        if len(v) < 10:
            raise ValueError("프롬프트는 최소 10자 이상이어야 합니다")
        if len(v) > 2000:
            raise ValueError("프롬프트는 최대 2000자까지 입력 가능합니다")
        return v


class JobUpdate(BaseSchema):
    """Schema for updating a job (script/subtitle editing)."""

    script: Optional[str] = Field(
        None,
        description="수정된 스크립트 내용",
    )
    srt: Optional[str] = Field(
        None,
        description="수정된 자막 내용 (SRT 형식)",
    )
    metadata_json: Optional[Dict[str, Any]] = Field(
        None,
        description="수정된 메타데이터 (title, description, tags)",
    )


class JobResponse(UUIDMixin, TimestampMixin, JobBase):
    """Schema returned to clients when retrieving jobs."""

    user_id: UUID = Field(
        ...,
        description="작업을 생성한 사용자 ID",
        json_schema_extra={"example": "c1d5f7b3-1234-4567-89ab-abcdef012345"},
    )
    status: JobStatus = Field(
        ...,
        description="작업 상태 (queued/generating/rendering/uploading/done/failed)",
        json_schema_extra={"example": "generating"},
    )
    script: Optional[str] = Field(
        None,
        description="생성된 스크립트 내용",
    )
    srt: Optional[str] = Field(
        None,
        description="생성된 자막 내용 (SRT 형식)",
    )
    metadata_json: Optional[Dict[str, Any]] = Field(
        None,
        description="생성된 메타데이터 (title, description, tags)",
        json_schema_extra={
            "example": {
                "title": "아이폰 15 Pro 리뷰 - 2023년 최고의 스마트폰",
                "description": "아이폰 15 Pro의 핵심 기능을 30초 안에 살펴보세요!",
                "tags": ["아이폰", "리뷰", "애플", "스마트폰"],
            }
        },
    )
    video_url: Optional[str] = Field(
        None,
        description="렌더링된 영상 URL (Supabase Storage)",
    )
    thumbnail_url: Optional[str] = Field(
        None,
        description="생성된 썸네일 URL (Supabase Storage)",
    )
    youtube_video_id: Optional[str] = Field(
        None,
        description="YouTube 업로드 후 비디오 ID",
        json_schema_extra={"example": "dQw4w9WgXcQ"},
    )
    error_message: Optional[str] = Field(
        None,
        description="오류 발생 시 오류 메시지",
    )
    retry_count: int = Field(
        ...,
        description="재시도 횟수",
        json_schema_extra={"example": 0},
    )
    duration_seconds: Optional[int] = Field(
        None,
        description="영상 길이 (초)",
        json_schema_extra={"example": 30},
    )
    render_time_seconds: Optional[int] = Field(
        None,
        description="렌더링 소요 시간 (초)",
        json_schema_extra={"example": 180},
    )


class JobListResponse(BaseSchema):
    """Schema for paginated job list."""

    jobs: list[JobResponse] = Field(
        ...,
        description="작업 목록",
    )
    total: int = Field(
        ...,
        description="전체 작업 개수",
        json_schema_extra={"example": 42},
    )
    page: int = Field(
        ...,
        description="현재 페이지 (1부터 시작)",
        json_schema_extra={"example": 1},
    )
    page_size: int = Field(
        ...,
        description="페이지당 항목 수",
        json_schema_extra={"example": 20},
    )
