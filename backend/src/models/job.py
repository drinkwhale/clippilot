"""
Job model for ClipPilot
Manages content generation jobs with AI-generated scripts and metadata
"""

from datetime import datetime
from typing import Optional
from uuid import UUID
import enum

from sqlalchemy import String, Text, Enum as SQLEnum, ForeignKey, Integer, JSON, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import BaseModel


class JobStatus(str, enum.Enum):
    """Job processing status"""
    QUEUED = "queued"
    GENERATING = "generating"
    RENDERING = "rendering"
    UPLOADING = "uploading"
    DONE = "done"
    FAILED = "failed"


class Job(BaseModel):
    """
    Job model for content generation and rendering

    Attributes:
        user_id: Reference to user who created the job
        template_id: Optional reference to template used
        prompt: User input prompt for content generation
        status: Current job processing status
        script: Generated script content (stored as text)
        srt: Generated subtitle content in SRT format
        metadata_json: Generated metadata (title, description, tags) as JSON
        video_url: URL to rendered video in Supabase Storage
        thumbnail_url: URL to generated thumbnail in Supabase Storage
        youtube_video_id: YouTube video ID after upload
        error_message: Error details if job failed
        retry_count: Number of retry attempts
        duration_seconds: Video duration in seconds
        render_time_seconds: Time taken to render video
    """

    __tablename__ = "jobs"

    # Foreign Keys
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    template_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("templates.id", ondelete="SET NULL"),
        nullable=True
    )

    # Content Generation
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[JobStatus] = mapped_column(
        SQLEnum(JobStatus, name="job_status", native_enum=False),
        nullable=False,
        default=JobStatus.QUEUED,
        server_default=JobStatus.QUEUED.value,
        index=True
    )
    script: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    srt_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    metadata_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Rendering & Upload
    video_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    thumbnail_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    youtube_video_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Rendering Timestamps
    render_started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    render_completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    upload_started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    upload_completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Error Handling
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")

    # Metrics
    duration_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    render_time_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Relationships
    user = relationship("User", back_populates="jobs")
    template = relationship("Template", back_populates="jobs")
    usage_logs = relationship(
        "UsageLog",
        back_populates="job",
        cascade="all, delete-orphan",
        passive_deletes=True
    )

    def __repr__(self) -> str:
        return f"Job(id={self.id}, user_id={self.user_id}, status={self.status.value}, prompt={self.prompt[:50]}...)"

    @property
    def srt(self) -> Optional[str]:
        """Backward-compatible alias for subtitle content."""
        return self.srt_content

    @srt.setter
    def srt(self, value: Optional[str]) -> None:
        self.srt_content = value
