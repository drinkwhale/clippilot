"""
Template model for ClipPilot
Manages brand presets and video templates
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import ARRAY, BigInteger, Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import BaseModel


class Template(BaseModel):
    """템플릿 모델 - 브랜드 아이덴티티 및 비디오 설정 저장"""

    __tablename__ = "templates"

    # 기본 정보
    user_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,  # NULL이면 시스템 기본 템플릿
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # 브랜드 설정 (JSON)
    brand_config_json: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        comment="Brand configuration including colors, fonts, intro/outro, watermark"
    )

    # 시스템 템플릿 여부
    is_system_default: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        index=True,
        comment="System default templates (리뷰, 뉴스, 교육)"
    )

    # YouTube 관련 컬럼 (002-youtube-search 기능)
    youtube_video_id: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        index=True,
        comment="YouTube video ID if template was created from YouTube video"
    )
    youtube_title: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Original YouTube video title"
    )
    youtube_description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Original YouTube video description"
    )
    youtube_thumbnail_url: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="YouTube video thumbnail URL"
    )
    youtube_channel_id: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        index=True,
        comment="YouTube channel ID"
    )
    youtube_channel_name: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        comment="YouTube channel name"
    )
    youtube_published_at: Mapped[Optional[datetime]] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True,
        index=True,
        comment="YouTube video publication date"
    )
    youtube_view_count: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        nullable=True,
        comment="YouTube video view count at time of saving"
    )
    youtube_duration_seconds: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        comment="YouTube video duration in seconds"
    )
    youtube_captions: Mapped[Optional[dict]] = mapped_column(
        JSONB,
        nullable=True,
        comment="YouTube video captions (multiple languages)"
    )
    youtube_tags: Mapped[Optional[list[str]]] = mapped_column(
        ARRAY(Text),
        nullable=True,
        comment="YouTube video tags"
    )

    # 관계
    user: Mapped[Optional["User"]] = relationship(
        "User",
        back_populates="templates",
        lazy="joined"
    )

    jobs: Mapped[list["Job"]] = relationship(
        "Job",
        back_populates="template",
        lazy="select"
    )

    def __repr__(self) -> str:
        return (
            f"Template(id={self.id}, name={self.name!r}, "
            f"user_id={self.user_id}, is_system={self.is_system_default})"
        )

    @property
    def brand_colors(self) -> Optional[dict]:
        """브랜드 색상 가져오기"""
        return self.brand_config_json.get("colors")

    @property
    def brand_fonts(self) -> Optional[dict]:
        """브랜드 폰트 가져오기"""
        return self.brand_config_json.get("fonts")

    @property
    def intro_video_url(self) -> Optional[str]:
        """인트로 비디오 URL"""
        return self.brand_config_json.get("intro_video_url")

    @property
    def outro_video_url(self) -> Optional[str]:
        """아웃트로 비디오 URL"""
        return self.brand_config_json.get("outro_video_url")

    @property
    def watermark_url(self) -> Optional[str]:
        """워터마크 이미지 URL"""
        return self.brand_config_json.get("watermark_url")
