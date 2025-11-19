"""
대시보드 통계 API
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta

from src.core.deps import get_current_user, get_db
from src.models.user import User
from src.models.job import Job
from src.models.channel import Channel
from src.models.usage_log import UsageLog

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    대시보드 통계 조회

    Returns:
        - total_jobs: 총 작업 수
        - completed_jobs: 완료된 작업 수
        - connected_channels: 연결된 채널 수
        - monthly_usage: 이번 달 생성된 영상 수
    """

    # 총 작업 수
    total_jobs_query = select(func.count(Job.id)).where(
        Job.user_id == current_user.id
    )
    total_jobs_result = await db.execute(total_jobs_query)
    total_jobs = total_jobs_result.scalar() or 0

    # 완료된 작업 수
    completed_jobs_query = select(func.count(Job.id)).where(
        Job.user_id == current_user.id,
        Job.status == "done"
    )
    completed_jobs_result = await db.execute(completed_jobs_query)
    completed_jobs = completed_jobs_result.scalar() or 0

    # 연결된 채널 수
    connected_channels_query = select(func.count(Channel.id)).where(
        Channel.user_id == current_user.id,
        Channel.is_active == True
    )
    connected_channels_result = await db.execute(connected_channels_query)
    connected_channels = connected_channels_result.scalar() or 0

    # 이번 달 사용량 (영상 생성 수)
    first_day_of_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    monthly_usage_query = select(func.count(Job.id)).where(
        Job.user_id == current_user.id,
        Job.status == "done",
        Job.created_at >= first_day_of_month
    )
    monthly_usage_result = await db.execute(monthly_usage_query)
    monthly_usage = monthly_usage_result.scalar() or 0

    return {
        "total_jobs": total_jobs,
        "completed_jobs": completed_jobs,
        "connected_channels": connected_channels,
        "monthly_usage": monthly_usage
    }
