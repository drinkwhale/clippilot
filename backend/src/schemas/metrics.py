"""
Metrics Pydantic schemas for ClipPilot
대시보드 및 사용 현황 통계 응답 스키마
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class DashboardMetricsResponse(BaseModel):
    """대시보드 메트릭 응답"""

    total_jobs: int = Field(description="총 작업 수")
    successful_jobs: int = Field(description="성공한 작업 수")
    failed_jobs: int = Field(description="실패한 작업 수")
    success_rate: float = Field(description="성공률 (%)")
    avg_render_time_seconds: Optional[float] = Field(None, description="평균 렌더링 시간 (초)")
    total_tokens_used: int = Field(description="총 사용 토큰 수")
    total_api_cost: Decimal = Field(description="총 API 비용 (USD)")
    period_days: int = Field(description="집계 기간 (일)")

    class Config:
        json_schema_extra = {
            "example": {
                "total_jobs": 45,
                "successful_jobs": 42,
                "failed_jobs": 3,
                "success_rate": 93.33,
                "avg_render_time_seconds": 125.5,
                "total_tokens_used": 85000,
                "total_api_cost": "12.50",
                "period_days": 30
            }
        }


class UsageMetricsResponse(BaseModel):
    """월간 사용량 메트릭 응답"""

    current_count: int = Field(description="현재 월 작업 수")
    quota_limit: int = Field(description="플랜별 할당량")
    usage_percentage: float = Field(description="사용률 (%)")
    period_start: datetime = Field(description="집계 시작 일시")
    period_end: datetime = Field(description="집계 종료 일시")

    class Config:
        json_schema_extra = {
            "example": {
                "current_count": 18,
                "quota_limit": 20,
                "usage_percentage": 90.0,
                "period_start": "2025-01-01T00:00:00Z",
                "period_end": "2025-02-01T00:00:00Z"
            }
        }


class DailyJobCount(BaseModel):
    """일별 작업 수"""

    date: str = Field(description="날짜 (YYYY-MM-DD)")
    count: int = Field(description="작업 수")


class DailyJobCountResponse(BaseModel):
    """일별 작업 수 통계 응답"""

    daily_counts: list[DailyJobCount] = Field(description="일별 통계 배열")

    class Config:
        json_schema_extra = {
            "example": {
                "daily_counts": [
                    {"date": "2025-01-01", "count": 3},
                    {"date": "2025-01-02", "count": 5},
                    {"date": "2025-01-03", "count": 2}
                ]
            }
        }


class UsageAlertResponse(BaseModel):
    """사용량 알림 응답"""

    should_show_banner: bool = Field(description="배너 표시 여부")
    should_send_email: bool = Field(description="이메일 발송 여부")
    usage_percentage: float = Field(description="사용률 (%)")
    current_count: int = Field(description="현재 작업 수")
    quota_limit: int = Field(description="할당량")
    message: Optional[str] = Field(None, description="알림 메시지")

    class Config:
        json_schema_extra = {
            "example": {
                "should_show_banner": True,
                "should_send_email": False,
                "usage_percentage": 85.0,
                "current_count": 17,
                "quota_limit": 20,
                "message": "이번 달 할당량의 85%를 사용하셨습니다. 남은 작업 수: 3개"
            }
        }
