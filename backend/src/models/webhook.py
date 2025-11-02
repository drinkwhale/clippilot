"""
Webhook 모델

Stripe 및 기타 외부 서비스로부터 받은 webhook 이벤트를 추적합니다.
"""
from sqlalchemy import Column, String, Text, JSON, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from .base import Base


class Webhook(Base):
    """
    Webhook 이벤트 모델

    외부 서비스(Stripe, YouTube 등)로부터 받은 webhook 이벤트를 저장합니다.
    """
    __tablename__ = "webhooks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = Column(String(100), nullable=False, comment="webhook 이벤트 타입 (예: stripe.customer.subscription.updated)")
    provider = Column(String(50), nullable=False, comment="webhook 제공자 (stripe, youtube 등)")
    event_id = Column(String(255), unique=True, nullable=False, comment="외부 서비스의 이벤트 ID")
    payload_json = Column(JSON, nullable=False, comment="webhook 페이로드 전체")
    status = Column(
        String(20),
        nullable=False,
        default="pending",
        comment="처리 상태: pending, processed, failed"
    )
    error_message = Column(Text, nullable=True, comment="처리 실패 시 오류 메시지")
    processed_at = Column(DateTime, nullable=True, comment="처리 완료 시각")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("idx_webhooks_provider_type", "provider", "type"),
        Index("idx_webhooks_status", "status"),
        Index("idx_webhooks_created_at", "created_at"),
    )

    def __repr__(self):
        return f"<Webhook(id={self.id}, type={self.type}, provider={self.provider}, status={self.status})>"
