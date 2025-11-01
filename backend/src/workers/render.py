"""
렌더링 작업 Celery Task

Redis 큐를 통해 Go Worker에 렌더링 작업을 전송합니다.
"""

import json
from typing import Dict, Any, Optional
from datetime import datetime

from celery import Task
from loguru import logger
from sqlalchemy import select

from ..workers.celery_app import celery_app
from ..core.database import get_db_session
from ..models.job import Job, JobStatus
from ..core.redis_client import get_redis_client


class RenderTask(Task):
    """렌더링 작업 기본 클래스"""

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """작업 실패 시 처리"""
        job_id = args[0] if args else kwargs.get("job_id")
        if job_id:
            logger.error(f"Render task failed for job {job_id}: {exc}")
            # Job 상태를 failed로 업데이트
            with get_db_session() as db:
                job = db.get(Job, job_id)
                if job:
                    job.status = JobStatus.FAILED
                    job.error_message = str(exc)
                    db.commit()


@celery_app.task(
    bind=True,
    base=RenderTask,
    name="workers.render.request_render",
    max_retries=0,  # 렌더링 작업은 재시도하지 않음 (retry 엔드포인트 사용)
)
def request_render(self, job_id: str) -> Dict[str, Any]:
    """
    렌더링 작업 요청

    Redis 큐에 렌더링 작업을 추가하고 Go Worker가 처리하도록 합니다.

    Args:
        job_id: 작업 ID

    Returns:
        작업 상태 정보

    Raises:
        Exception: 작업 요청 실패
    """
    logger.info(f"Requesting render for job {job_id}")

    try:
        with get_db_session() as db:
            # Job 조회
            job = db.get(Job, job_id)
            if not job:
                raise ValueError(f"Job {job_id} not found")

            # Job 상태 확인
            if job.status not in [JobStatus.GENERATING, JobStatus.COMPLETED]:
                raise ValueError(
                    f"Job {job_id} is not ready for rendering. "
                    f"Current status: {job.status}"
                )

            # 렌더링에 필요한 데이터 확인
            if not job.script or not job.srt_content:
                raise ValueError(
                    f"Job {job_id} is missing required data (script or srt)"
                )

            # Job 상태를 rendering으로 업데이트
            job.status = JobStatus.RENDERING
            job.render_started_at = datetime.utcnow()
            db.commit()
            db.refresh(job)

            # 렌더링 작업 데이터 구성
            render_job = {
                "job_id": str(job.id),
                "user_id": str(job.user_id),
                "script": job.script,
                "srt_content": job.srt_content,
                "metadata": job.metadata_json or {},
                "template_id": str(job.template_id) if job.template_id else None,
                "created_at": job.created_at.isoformat(),
            }

            # Redis 큐에 작업 추가
            redis_client = get_redis_client()
            queue_key = "render_queue"

            # JSON으로 직렬화하여 큐에 추가
            redis_client.rpush(queue_key, json.dumps(render_job))

            logger.info(
                f"Render job {job_id} added to queue. "
                f"Queue length: {redis_client.llen(queue_key)}"
            )

            return {
                "job_id": str(job.id),
                "status": job.status.value,
                "queue_position": redis_client.llen(queue_key),
                "message": "Render job queued successfully",
            }

    except Exception as e:
        logger.error(f"Failed to request render for job {job_id}: {str(e)}")
        # Job 상태를 failed로 업데이트
        try:
            with get_db_session() as db:
                job = db.get(Job, job_id)
                if job:
                    job.status = JobStatus.FAILED
                    job.error_message = f"Failed to queue render job: {str(e)}"
                    db.commit()
        except Exception as update_error:
            logger.error(f"Failed to update job status: {update_error}")

        raise


@celery_app.task(name="workers.render.update_render_progress")
def update_render_progress(
    job_id: str,
    progress: float,
    message: Optional[str] = None
) -> Dict[str, Any]:
    """
    렌더링 진행률 업데이트

    Go Worker가 렌더링 진행 중에 호출하는 콜백 함수입니다.

    Args:
        job_id: 작업 ID
        progress: 진행률 (0.0 ~ 1.0)
        message: 진행 상태 메시지

    Returns:
        업데이트된 작업 정보
    """
    logger.info(f"Updating render progress for job {job_id}: {progress:.1%}")

    try:
        with get_db_session() as db:
            job = db.get(Job, job_id)
            if not job:
                raise ValueError(f"Job {job_id} not found")

            # 진행률 업데이트 (metadata_json에 저장)
            metadata = job.metadata_json or {}
            metadata["render_progress"] = progress
            if message:
                metadata["render_message"] = message

            job.metadata_json = metadata
            db.commit()
            db.refresh(job)

            return {
                "job_id": str(job.id),
                "progress": progress,
                "message": message,
            }

    except Exception as e:
        logger.error(f"Failed to update render progress for job {job_id}: {str(e)}")
        raise


@celery_app.task(name="workers.render.complete_render")
def complete_render(
    job_id: str,
    video_url: str,
    duration: Optional[float] = None,
) -> Dict[str, Any]:
    """
    렌더링 완료 처리

    Go Worker가 렌더링 완료 후 호출하는 콜백 함수입니다.

    Args:
        job_id: 작업 ID
        video_url: 렌더링된 비디오 URL (Supabase Storage)
        duration: 렌더링 소요 시간 (초)

    Returns:
        완료된 작업 정보
    """
    logger.info(f"Completing render for job {job_id}")

    try:
        with get_db_session() as db:
            job = db.get(Job, job_id)
            if not job:
                raise ValueError(f"Job {job_id} not found")

            # Job 상태 업데이트
            job.status = JobStatus.COMPLETED
            job.video_url = video_url
            job.render_completed_at = datetime.utcnow()

            # 렌더링 소요 시간 저장
            if duration:
                metadata = job.metadata_json or {}
                metadata["render_duration"] = duration
                job.metadata_json = metadata

            db.commit()
            db.refresh(job)

            logger.info(f"Render completed for job {job_id}: {video_url}")

            return {
                "job_id": str(job.id),
                "status": job.status.value,
                "video_url": video_url,
                "duration": duration,
            }

    except Exception as e:
        logger.error(f"Failed to complete render for job {job_id}: {str(e)}")
        raise


@celery_app.task(name="workers.render.fail_render")
def fail_render(
    job_id: str,
    error_message: str,
) -> Dict[str, Any]:
    """
    렌더링 실패 처리

    Go Worker가 렌더링 실패 시 호출하는 콜백 함수입니다.

    Args:
        job_id: 작업 ID
        error_message: 오류 메시지

    Returns:
        실패한 작업 정보
    """
    logger.error(f"Render failed for job {job_id}: {error_message}")

    try:
        with get_db_session() as db:
            job = db.get(Job, job_id)
            if not job:
                raise ValueError(f"Job {job_id} not found")

            # Job 상태 업데이트
            job.status = JobStatus.FAILED
            job.error_message = error_message
            job.render_completed_at = datetime.utcnow()

            db.commit()
            db.refresh(job)

            return {
                "job_id": str(job.id),
                "status": job.status.value,
                "error_message": error_message,
            }

    except Exception as e:
        logger.error(f"Failed to update failed render for job {job_id}: {str(e)}")
        raise
