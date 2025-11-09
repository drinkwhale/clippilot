"""
Metrics API endpoints for ClipPilot
대시보드 및 사용 현황 통계 API
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.database import get_db
from ...middleware.auth import get_current_user
from ...models.user import User
from ...services.metrics_service import MetricsService
from ...services.alert_service import AlertService
from ...schemas.metrics import (
    DashboardMetricsResponse,
    UsageMetricsResponse,
    DailyJobCountResponse,
    UsageAlertResponse
)

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("/dashboard", response_model=DashboardMetricsResponse)
async def get_dashboard_metrics(
    period: Annotated[int, Query(ge=1, le=365, description="집계 기간 (일)")] = 30,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> DashboardMetricsResponse:
    """
    대시보드 메트릭 조회

    통계 집계 기간을 7일, 30일, 90일로 설정할 수 있습니다.

    **권한**: 인증된 사용자

    **Response**:
    - total_jobs: 총 작업 수
    - successful_jobs: 성공한 작업 수
    - failed_jobs: 실패한 작업 수
    - success_rate: 성공률 (%)
    - avg_render_time_seconds: 평균 렌더링 시간 (초)
    - total_tokens_used: 총 사용 토큰 수
    - total_api_cost: 총 API 비용 (USD)
    - period_days: 집계 기간 (일)
    """
    metrics_service = MetricsService(db)

    try:
        metrics = await metrics_service.get_dashboard_metrics(
            user_id=current_user.id,
            period_days=period
        )

        return DashboardMetricsResponse(
            total_jobs=metrics.total_jobs,
            successful_jobs=metrics.successful_jobs,
            failed_jobs=metrics.failed_jobs,
            success_rate=metrics.success_rate,
            avg_render_time_seconds=metrics.avg_render_time_seconds,
            total_tokens_used=metrics.total_tokens_used,
            total_api_cost=metrics.total_api_cost,
            period_days=metrics.period_days
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "code": "METRICS_ERROR",
                "message": f"통계 조회 중 오류가 발생했습니다: {str(e)}"
            }
        )


@router.get("/usage", response_model=UsageMetricsResponse)
async def get_usage_metrics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> UsageMetricsResponse:
    """
    월간 사용량 메트릭 조회

    현재 월의 작업 생성 횟수와 플랜별 할당량을 반환합니다.

    **권한**: 인증된 사용자

    **Response**:
    - current_count: 현재 월 작업 수
    - quota_limit: 플랜별 할당량
    - usage_percentage: 사용률 (%)
    - period_start: 집계 시작 일시
    - period_end: 집계 종료 일시
    """
    metrics_service = MetricsService(db)

    try:
        usage = await metrics_service.get_usage_metrics(
            user_id=current_user.id
        )

        return UsageMetricsResponse(
            current_count=usage.current_count,
            quota_limit=usage.quota_limit,
            usage_percentage=usage.usage_percentage,
            period_start=usage.period_start,
            period_end=usage.period_end
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail={
                "code": "USER_NOT_FOUND",
                "message": str(e)
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "code": "USAGE_ERROR",
                "message": f"사용량 조회 중 오류가 발생했습니다: {str(e)}"
            }
        )


@router.get("/daily-jobs", response_model=DailyJobCountResponse)
async def get_daily_job_counts(
    period: Annotated[int, Query(ge=1, le=365, description="집계 기간 (일)")] = 30,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> DailyJobCountResponse:
    """
    일별 작업 수 통계 조회

    차트 표시를 위한 일별 작업 생성 수를 반환합니다.

    **권한**: 인증된 사용자

    **Response**:
    - daily_counts: 일별 통계 배열
        - date: 날짜 (YYYY-MM-DD)
        - count: 해당 날짜의 작업 수
    """
    metrics_service = MetricsService(db)

    try:
        daily_counts = await metrics_service.get_daily_job_counts(
            user_id=current_user.id,
            period_days=period
        )

        return DailyJobCountResponse(daily_counts=daily_counts)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "code": "METRICS_ERROR",
                "message": f"일별 통계 조회 중 오류가 발생했습니다: {str(e)}"
            }
        )


@router.get("/usage-alert", response_model=UsageAlertResponse)
async def get_usage_alert(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> UsageAlertResponse:
    """
    사용량 알림 체크

    80% 이상 시 배너 표시, 100% 도달 시 이메일 발송 여부를 반환합니다.

    **권한**: 인증된 사용자

    **Response**:
    - should_show_banner: 배너 표시 여부
    - should_send_email: 이메일 발송 여부
    - usage_percentage: 사용률 (%)
    - current_count: 현재 작업 수
    - quota_limit: 할당량
    - message: 알림 메시지
    """
    alert_service = AlertService(db)

    try:
        alert = await alert_service.check_usage_alert(user_id=current_user.id)

        return UsageAlertResponse(
            should_show_banner=alert.should_show_banner,
            should_send_email=alert.should_send_email,
            usage_percentage=alert.usage_percentage,
            current_count=alert.current_count,
            quota_limit=alert.quota_limit,
            message=alert.message
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "code": "ALERT_ERROR",
                "message": f"알림 체크 중 오류가 발생했습니다: {str(e)}"
            }
        )
