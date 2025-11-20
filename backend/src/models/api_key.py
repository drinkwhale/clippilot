"""API Keys 모델"""
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from src.core.database import Base


class APIKey(Base):
    """API Key 모델 - 외부 서비스 API 키 저장"""

    __tablename__ = "api_keys"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("auth.users.id", ondelete="CASCADE"), nullable=False)
    service_name = Column(String(50), nullable=False)  # 'youtube', 'openai', 'pexels'
    api_key_encrypted = Column(Text, nullable=False)  # 암호화된 API 키
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_used_at = Column(DateTime, nullable=True)

    # 관계 정의
    # user = relationship("User", back_populates="api_keys")

    # 인덱스 정의
    __table_args__ = (
        Index('idx_api_keys_user_id', 'user_id'),
        Index('idx_api_keys_service_name', 'service_name'),
        # 한 사용자당 하나의 서비스 키만 허용
        Index('uq_api_keys_user_service', 'user_id', 'service_name', unique=True),
    )

    def __repr__(self):
        return f"<APIKey(id={self.id}, user_id={self.user_id}, service={self.service_name})>"
