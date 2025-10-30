"""
UsageLog model for ClipPilot
Tracks API usage and costs for billing and analytics
"""

from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy import ForeignKey, Integer, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import BaseModel


class UsageLog(BaseModel):
    """
    UsageLog model for tracking API usage and costs

    Attributes:
        user_id: Reference to user who generated the usage
        job_id: Reference to job that generated the usage
        tokens: Number of tokens used (for OpenAI API)
        api_cost: Cost of API call in USD (Decimal for precision)
    """

    __tablename__ = "usage_logs"

    # Foreign Keys
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    job_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("jobs.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )

    # Usage Metrics
    tokens: Mapped[int] = mapped_column(Integer, nullable=False)
    api_cost: Mapped[Decimal] = mapped_column(
        Numeric(10, 4),  # 최대 999,999.9999 USD
        nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="usage_logs")
    job = relationship("Job", back_populates="usage_logs")

    def __repr__(self) -> str:
        return f"UsageLog(id={self.id}, user_id={self.user_id}, tokens={self.tokens}, cost=${self.api_cost})"
