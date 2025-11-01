"""
Celery tasks for content generation
Handles script, subtitle, and metadata generation with OpenAI
"""

import asyncio
import logging
from decimal import Decimal
from typing import Dict, Any
from uuid import UUID
from dotenv import load_dotenv

from celery import Task
from sqlalchemy import select, create_engine
from sqlalchemy.orm import sessionmaker, Session

from .celery_app import celery_app
from ..core.ai.script_service import get_script_service
from ..core.ai.subtitle_service import get_subtitle_service
from ..core.ai.metadata_service import get_metadata_service
from ..models.job import Job, JobStatus
from ..models.usage_log import UsageLog
from ..core.exceptions import ContentGenerationError
import os

# .env 파일 로드
load_dotenv()

logger = logging.getLogger(__name__)

# Supabase PostgreSQL 연결 (psycopg2 사용 - Supabase 권장 방식)
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/clippilot"
)

# 동기 엔진 사용
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)


class ContentGenerationTask(Task):
    """Base task with database session management"""

    def get_db(self) -> Session:
        """Get database session"""
        return SessionLocal()


@celery_app.task(
    bind=True,
    base=ContentGenerationTask,
    name="generate_content",
    queue="generation",
    max_retries=3,
    default_retry_delay=60,
)
def generate_content(
    self,
    job_id: str,
    prompt: str,
    video_length_sec: int = 30,
    tone: str = "informative",
) -> Dict[str, Any]:
    """
    Generate content (script, subtitle, metadata) for a job

    Args:
        job_id: Job ID (UUID as string)
        prompt: User input prompt
        video_length_sec: Target video length (15, 30, or 60 seconds)
        tone: Script tone (informative, fun, emotional)

    Returns:
        Dict with generation results
    """
    # Run async logic in sync context
    return asyncio.run(
        _generate_content_async(
            job_id=UUID(job_id),
            prompt=prompt,
            video_length_sec=video_length_sec,
            tone=tone,
        )
    )


async def _generate_content_async(
    job_id: UUID,
    prompt: str,
    video_length_sec: int,
    tone: str,
) -> Dict[str, Any]:
    """
    Async implementation of content generation

    Args:
        job_id: Job ID
        prompt: User input prompt
        video_length_sec: Target video length
        tone: Script tone

    Returns:
        Dict with generation results
    """
    async with AsyncSessionLocal() as db:
        try:
            logger.info(f"Starting content generation: job_id={job_id}")

            # Update job status to 'generating'
            await _update_job_status(db, job_id, JobStatus.GENERATING)

            # Get job to retrieve user_id
            job = await _get_job(db, job_id)

            # Step 1: Generate script
            logger.info(f"Generating script: job_id={job_id}")
            script_service = get_script_service()
            script_result = await script_service.generate_script(
                prompt=prompt,
                video_length_sec=video_length_sec,
                tone=tone,
            )
            script = script_result["script"]
            script_tokens = script_result["tokens_in"] + script_result["tokens_out"]
            script_cost = script_result["api_cost"]

            # Step 2: Generate subtitle
            logger.info(f"Generating subtitle: job_id={job_id}")
            subtitle_service = get_subtitle_service()
            srt = subtitle_service.generate_srt(
                script=script,
                video_length_sec=video_length_sec,
            )

            # Step 3: Generate metadata
            logger.info(f"Generating metadata: job_id={job_id}")
            metadata_service = get_metadata_service()
            metadata_result = await metadata_service.generate_metadata(
                script=script,
                prompt=prompt,
            )
            metadata_json = {
                "title": metadata_result["title"],
                "description": metadata_result["description"],
                "tags": metadata_result["tags"],
            }
            metadata_tokens = metadata_result["tokens_in"] + metadata_result["tokens_out"]
            metadata_cost = metadata_result["api_cost"]

            # Calculate total usage
            total_tokens = script_tokens + metadata_tokens
            total_cost = script_cost + metadata_cost

            logger.info(
                f"Content generation completed: job_id={job_id}, "
                f"tokens={total_tokens}, cost=${total_cost:.4f}"
            )

            # Update job with generated content
            await _update_job_content(
                db=db,
                job_id=job_id,
                script=script,
                srt=srt,
                metadata_json=metadata_json,
                status=JobStatus.DONE,  # For MVP, mark as done (rendering in Phase 6)
            )

            # Log usage
            await _log_usage(
                db=db,
                user_id=job.user_id,
                job_id=job_id,
                tokens=total_tokens,
                api_cost=total_cost,
            )

            await db.commit()

            return {
                "status": "success",
                "job_id": str(job_id),
                "tokens": total_tokens,
                "api_cost": float(total_cost),
            }

        except ContentGenerationError as e:
            logger.error(f"Content generation failed: job_id={job_id}, error={e}")

            # Update job with error
            await _update_job_error(
                db=db,
                job_id=job_id,
                error_message=e.message,
            )
            await db.commit()

            raise

        except Exception as e:
            logger.error(f"Unexpected error during content generation: job_id={job_id}", exc_info=True)

            # Update job with generic error
            await _update_job_error(
                db=db,
                job_id=job_id,
                error_message="콘텐츠 생성 중 예상치 못한 오류가 발생했습니다",
            )
            await db.commit()

            raise


async def _get_job(db: AsyncSession, job_id: UUID) -> Job:
    """Get job by ID"""
    stmt = select(Job).where(Job.id == job_id)
    result = await db.execute(stmt)
    job = result.scalar_one_or_none()

    if not job:
        raise ValueError(f"Job not found: {job_id}")

    return job


async def _update_job_status(db: AsyncSession, job_id: UUID, status: JobStatus) -> None:
    """Update job status"""
    stmt = select(Job).where(Job.id == job_id)
    result = await db.execute(stmt)
    job = result.scalar_one_or_none()

    if job:
        job.status = status
        await db.commit()


async def _update_job_content(
    db: AsyncSession,
    job_id: UUID,
    script: str,
    srt: str,
    metadata_json: Dict[str, Any],
    status: JobStatus,
) -> None:
    """Update job with generated content"""
    stmt = select(Job).where(Job.id == job_id)
    result = await db.execute(stmt)
    job = result.scalar_one_or_none()

    if job:
        job.script = script
        job.srt = srt
        job.metadata_json = metadata_json
        job.status = status
        await db.commit()


async def _update_job_error(
    db: AsyncSession,
    job_id: UUID,
    error_message: str,
) -> None:
    """Update job with error"""
    stmt = select(Job).where(Job.id == job_id)
    result = await db.execute(stmt)
    job = result.scalar_one_or_none()

    if job:
        job.status = JobStatus.FAILED
        job.error_message = error_message
        job.retry_count += 1
        await db.commit()


async def _log_usage(
    db: AsyncSession,
    user_id: UUID,
    job_id: UUID,
    tokens: int,
    api_cost: float,
) -> None:
    """Log API usage"""
    usage_log = UsageLog(
        user_id=user_id,
        job_id=job_id,
        tokens=tokens,
        api_cost=Decimal(str(api_cost)),
    )
    db.add(usage_log)
    await db.commit()
