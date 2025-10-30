"""
Jobs API endpoints for ClipPilot
Handles job creation, retrieval, and updates
"""

from typing import Optional, List
from uuid import UUID
import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, desc
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...middleware.auth import get_current_user
from ...models.user import User
from ...models.job import Job, JobStatus
from ...schemas.job import JobCreate, JobResponse, JobUpdate, JobListResponse
from ...services.quota_service import get_quota_service
from ...workers.generate import generate_content
from ...core.exceptions import (
    QuotaExceededError,
    ValidationError,
    ResourceNotFoundError,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(
    job_data: JobCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new content generation job (FR-001)

    프로세스:
    1. Quota 확인 (FR-008)
    2. Job 생성 (status: queued)
    3. Celery 큐에 작업 등록
    4. Job 반환

    Returns:
        JobResponse: 생성된 Job 정보
    """
    try:
        logger.info(f"Creating job: user_id={current_user.id}, prompt_length={len(job_data.prompt)}")

        # Step 1: Check quota (FR-008)
        quota_service = get_quota_service(db)
        quota_service.validate_quota(current_user.id)

        # Step 2: Create job
        job = Job(
            user_id=current_user.id,
            template_id=job_data.template_id,
            prompt=job_data.prompt,
            status=JobStatus.QUEUED,
        )
        db.add(job)
        db.commit()
        db.refresh(job)

        logger.info(f"Job created: job_id={job.id}, status={job.status.value}")

        # Step 3: Queue Celery task
        generate_content.apply_async(
            args=[
                str(job.id),
                job.prompt,
                30,  # Default: 30 seconds (MVP)
                "informative",  # Default tone (MVP)
            ],
            queue="generation",
        )

        logger.info(f"Job queued for generation: job_id={job.id}")

        return job

    except QuotaExceededError as e:
        logger.warning(f"Quota exceeded: user_id={current_user.id}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "code": e.code,
                "message": e.message,
                "quota_limit": e.quota_limit,
                "quota_used": e.quota_used,
                "quota_reset_at": e.quota_reset_at,
            },
        )

    except Exception as e:
        logger.error(f"Job creation failed: user_id={current_user.id}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "INTERNAL_ERROR", "message": "작업 생성 중 오류가 발생했습니다"},
        )


@router.get("", response_model=JobListResponse)
def list_jobs(
    status_filter: Optional[str] = Query(None, description="상태 필터 (queued/generating/done/failed)"),
    page: int = Query(1, ge=1, description="페이지 번호 (1부터 시작)"),
    page_size: int = Query(20, ge=1, le=100, description="페이지당 항목 수"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List user's jobs with pagination and filtering (FR-010)

    Args:
        status_filter: 상태 필터 (optional)
        page: 페이지 번호 (1부터 시작)
        page_size: 페이지당 항목 수 (최대 100)

    Returns:
        JobListResponse: 페이지네이션된 Job 목록
    """
    try:
        logger.info(
            f"Listing jobs: user_id={current_user.id}, "
            f"status={status_filter}, page={page}, page_size={page_size}"
        )

        # Build query
        query = select(Job).where(Job.user_id == current_user.id)

        # Apply status filter
        if status_filter:
            try:
                status_enum = JobStatus(status_filter)
                query = query.where(Job.status == status_enum)
            except ValueError:
                raise ValidationError(f"Invalid status filter: {status_filter}")

        # Count total jobs
        count_query = select(func.count()).select_from(query.subquery())
        total = db.execute(count_query).scalar_one()

        # Apply pagination
        query = query.order_by(desc(Job.created_at))
        query = query.offset((page - 1) * page_size).limit(page_size)

        # Execute query
        result = db.execute(query)
        jobs = result.scalars().all()

        logger.info(f"Jobs retrieved: count={len(jobs)}, total={total}")

        return JobListResponse(
            jobs=jobs,
            total=total,
            page=page,
            page_size=page_size,
        )

    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": e.code, "message": e.message},
        )

    except Exception as e:
        logger.error(f"Job listing failed: user_id={current_user.id}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "INTERNAL_ERROR", "message": "작업 목록 조회 중 오류가 발생했습니다"},
        )


@router.get("/{job_id}", response_model=JobResponse)
def get_job(
    job_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get job details by ID (FR-020)

    Args:
        job_id: Job ID

    Returns:
        JobResponse: Job 상세 정보

    Raises:
        404: Job not found or not owned by user
    """
    try:
        logger.info(f"Getting job: user_id={current_user.id}, job_id={job_id}")

        # Get job
        stmt = select(Job).where(Job.id == job_id, Job.user_id == current_user.id)
        result = db.execute(stmt)
        job = result.scalar_one_or_none()

        if not job:
            raise ResourceNotFoundError("작업을 찾을 수 없습니다")

        return job

    except ResourceNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": e.code, "message": e.message},
        )

    except Exception as e:
        logger.error(f"Job retrieval failed: job_id={job_id}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "INTERNAL_ERROR", "message": "작업 조회 중 오류가 발생했습니다"},
        )


@router.patch("/{job_id}", response_model=JobResponse)
def update_job(
    job_id: UUID,
    update_data: JobUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update job (edit script, subtitle, metadata) (FR-019)

    Args:
        job_id: Job ID
        update_data: 수정할 필드 (script, srt, metadata_json)

    Returns:
        JobResponse: 수정된 Job 정보

    Raises:
        404: Job not found or not owned by user
    """
    try:
        logger.info(f"Updating job: user_id={current_user.id}, job_id={job_id}")

        # Get job
        stmt = select(Job).where(Job.id == job_id, Job.user_id == current_user.id)
        result = db.execute(stmt)
        job = result.scalar_one_or_none()

        if not job:
            raise ResourceNotFoundError("작업을 찾을 수 없습니다")

        # Update fields
        if update_data.script is not None:
            job.script = update_data.script

        if update_data.srt is not None:
            job.srt = update_data.srt

        if update_data.metadata_json is not None:
            job.metadata_json = update_data.metadata_json

        db.commit()
        db.refresh(job)

        logger.info(f"Job updated: job_id={job_id}")

        return job

    except ResourceNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": e.code, "message": e.message},
        )

    except Exception as e:
        logger.error(f"Job update failed: job_id={job_id}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "INTERNAL_ERROR", "message": "작업 수정 중 오류가 발생했습니다"},
        )
