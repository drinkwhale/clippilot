"""
Template Pydantic schemas for ClipPilot API
Manages brand presets and video templates
"""

from typing import Optional
from uuid import UUID

from pydantic import Field, field_validator

from .base import BaseSchema, TimestampMixin, UUIDMixin


class BrandColors(BaseSchema):
    """브랜드 색상 설정"""

    primary: str = Field(
        ...,
        description="주요 색상 (HEX)",
        pattern=r"^#[0-9A-Fa-f]{6}$",
        json_schema_extra={"example": "#FF5733"}
    )
    secondary: Optional[str] = Field(
        None,
        description="보조 색상 (HEX)",
        pattern=r"^#[0-9A-Fa-f]{6}$",
        json_schema_extra={"example": "#33C1FF"}
    )
    accent: Optional[str] = Field(
        None,
        description="강조 색상 (HEX)",
        pattern=r"^#[0-9A-Fa-f]{6}$",
        json_schema_extra={"example": "#FFD700"}
    )
    background: Optional[str] = Field(
        None,
        description="배경 색상 (HEX)",
        pattern=r"^#[0-9A-Fa-f]{6}$",
        json_schema_extra={"example": "#FFFFFF"}
    )
    text: Optional[str] = Field(
        None,
        description="텍스트 색상 (HEX)",
        pattern=r"^#[0-9A-Fa-f]{6}$",
        json_schema_extra={"example": "#000000"}
    )


class BrandFonts(BaseSchema):
    """브랜드 폰트 설정"""

    title: str = Field(
        ...,
        description="제목 폰트",
        json_schema_extra={"example": "Noto Sans KR"}
    )
    body: str = Field(
        ...,
        description="본문 폰트",
        json_schema_extra={"example": "Noto Sans KR"}
    )
    subtitle: Optional[str] = Field(
        None,
        description="자막 폰트",
        json_schema_extra={"example": "Noto Sans KR"}
    )


class BrandConfig(BaseSchema):
    """브랜드 설정 (JSON 구조)"""

    colors: BrandColors = Field(
        ...,
        description="브랜드 색상"
    )
    fonts: BrandFonts = Field(
        ...,
        description="브랜드 폰트"
    )
    intro_video_url: Optional[str] = Field(
        None,
        description="인트로 영상 URL (Supabase Storage)",
        max_length=500,
        json_schema_extra={"example": "https://storage.supabase.co/v1/object/public/videos/intro.mp4"}
    )
    outro_video_url: Optional[str] = Field(
        None,
        description="아웃트로 영상 URL (Supabase Storage)",
        max_length=500,
        json_schema_extra={"example": "https://storage.supabase.co/v1/object/public/videos/outro.mp4"}
    )
    watermark_url: Optional[str] = Field(
        None,
        description="워터마크 이미지 URL (Supabase Storage)",
        max_length=500,
        json_schema_extra={"example": "https://storage.supabase.co/v1/object/public/images/watermark.png"}
    )
    watermark_position: Optional[str] = Field(
        "bottom-right",
        description="워터마크 위치 (top-left, top-right, bottom-left, bottom-right)",
        json_schema_extra={"example": "bottom-right"}
    )
    watermark_opacity: Optional[float] = Field(
        0.7,
        ge=0.0,
        le=1.0,
        description="워터마크 투명도 (0.0 ~ 1.0)",
        json_schema_extra={"example": 0.7}
    )


class TemplateBase(BaseSchema):
    """템플릿 기본 스키마"""

    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="템플릿 이름",
        json_schema_extra={"example": "브랜드 템플릿 A"}
    )
    description: Optional[str] = Field(
        None,
        max_length=1000,
        description="템플릿 설명",
        json_schema_extra={"example": "기본 브랜드 색상과 폰트를 적용한 템플릿"}
    )
    brand_config_json: BrandConfig = Field(
        ...,
        description="브랜드 설정"
    )


class TemplateCreate(TemplateBase):
    """템플릿 생성 요청 스키마"""

    pass


class TemplateUpdate(BaseSchema):
    """템플릿 수정 요청 스키마"""

    name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=255,
        description="템플릿 이름"
    )
    description: Optional[str] = Field(
        None,
        max_length=1000,
        description="템플릿 설명"
    )
    brand_config_json: Optional[BrandConfig] = Field(
        None,
        description="브랜드 설정"
    )


class TemplateResponse(TemplateBase, UUIDMixin, TimestampMixin):
    """템플릿 응답 스키마"""

    user_id: Optional[UUID] = Field(
        None,
        description="소유자 ID (NULL이면 시스템 기본 템플릿)"
    )
    is_system_default: bool = Field(
        ...,
        description="시스템 기본 템플릿 여부"
    )

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "user_id": "123e4567-e89b-12d3-a456-426614174001",
                "name": "브랜드 템플릿 A",
                "description": "기본 브랜드 색상과 폰트를 적용한 템플릿",
                "brand_config_json": {
                    "colors": {
                        "primary": "#FF5733",
                        "secondary": "#33C1FF",
                        "accent": "#FFD700",
                        "background": "#FFFFFF",
                        "text": "#000000"
                    },
                    "fonts": {
                        "title": "Noto Sans KR",
                        "body": "Noto Sans KR",
                        "subtitle": "Noto Sans KR"
                    },
                    "intro_video_url": "https://storage.supabase.co/v1/object/public/videos/intro.mp4",
                    "outro_video_url": "https://storage.supabase.co/v1/object/public/videos/outro.mp4",
                    "watermark_url": "https://storage.supabase.co/v1/object/public/images/watermark.png",
                    "watermark_position": "bottom-right",
                    "watermark_opacity": 0.7
                },
                "is_system_default": False,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            }
        }
    }


class TemplateListResponse(BaseSchema):
    """템플릿 목록 응답 스키마"""

    templates: list[TemplateResponse] = Field(
        ...,
        description="템플릿 목록"
    )
    total: int = Field(
        ...,
        description="전체 템플릿 수"
    )
