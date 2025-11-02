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
# from ...workers.generate import generate_content  # TODO: Worker 구현 완료 후 활성화
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
        # TODO: Worker 구현 완료 후 활성화
        # generate_content.apply_async(
        #     args=[
        #         str(job.id),
        #         job.prompt,
        #         30,  # Default: 30 seconds (MVP)
        #         "informative",  # Default tone (MVP)
        #     ],
        #     queue="generation",
        # )

        logger.info(f"Job created (worker queuing disabled for MVP testing): job_id={job.id}")

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


@router.post("/{job_id}/retry", response_model=JobResponse)
def retry_job(
    job_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retry failed job (FR-011, FR-029)

    Failed 상태의 작업을 재시도합니다.
    - generating 단계 실패: 콘텐츠 생성 재시도
    - rendering 단계 실패: 렌더링 재시도
    - uploading 단계 실패: YouTube 업로드 재시도

    Args:
        job_id: Job ID

    Returns:
        JobResponse: 재시도 요청된 Job 정보

    Raises:
        404: Job not found or not owned by user
        400: Job is not in failed status or retry limit exceeded
    """
    try:
        logger.info(f"Retrying job: user_id={current_user.id}, job_id={job_id}")

        # Get job
        stmt = select(Job).where(Job.id == job_id, Job.user_id == current_user.id)
        result = db.execute(stmt)
        job = result.scalar_one_or_none()

        if not job:
            raise ResourceNotFoundError("작업을 찾을 수 없습니다")

        # Check job status
        if job.status != JobStatus.FAILED:
            raise ValidationError("실패한 작업만 재시도할 수 있습니다")

        # Check retry limit (FR-011: 최대 3회 재시도)
        MAX_RETRIES = 3
        if job.retry_count >= MAX_RETRIES:
            raise ValidationError(f"재시도 횟수가 초과되었습니다 (최대 {MAX_RETRIES}회)")

        # Increment retry count
        job.retry_count += 1
        job.error_message = None

        # Determine retry action based on last failed stage
        from ...workers.generate import generate_content
        from ...workers.render import request_render
        from ...workers.upload import upload_to_youtube

        if not job.script or not job.srt_content:
            # Retry content generation
            job.status = JobStatus.QUEUED
            db.commit()
            video_length_sec = job.duration_seconds or 30
            tone = "informative"
            if job.metadata_json:
                tone = (
                    job.metadata_json.get("tone")
                    or job.metadata_json.get("script_tone")
                    or tone
                )

            generate_content.delay(
                str(job.id),
                job.prompt,
                video_length_sec,
                tone,
            )
            logger.info(f"Content generation retry queued: job_id={job_id}")

        elif not job.video_url:
            # Retry rendering
            job.status = JobStatus.GENERATING  # Will be updated to RENDERING by render task
            db.commit()
            request_render.delay(str(job.id))
            logger.info(f"Rendering retry queued: job_id={job_id}")

        elif not job.youtube_video_id:
            # Retry YouTube upload
            # Need to get channel_id from user's channels
            from ...models.channel import Channel
            stmt = select(Channel).where(Channel.user_id == current_user.id)
            result = db.execute(stmt)
            channel = result.scalar_one_or_none()

            if not channel:
                raise ValidationError("YouTube 채널이 연결되어 있지 않습니다")

            job.status = JobStatus.COMPLETED  # Will be updated to UPLOADING by upload task
            db.commit()
            upload_to_youtube.delay(str(job.id), str(channel.id))
            logger.info(f"Upload retry queued: job_id={job_id}")

        else:
            # Unknown failure state
            raise ValidationError("재시도할 수 없는 작업 상태입니다")

        db.refresh(job)
        return job

    except (ResourceNotFoundError, ValidationError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST if isinstance(e, ValidationError) else status.HTTP_404_NOT_FOUND,
            detail={"code": e.code, "message": e.message},
        )

    except Exception as e:
        logger.error(f"Job retry failed: job_id={job_id}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "INTERNAL_ERROR", "message": "작업 재시도 중 오류가 발생했습니다"},
        )


@router.get("/{job_id}/download")
def download_job_video(
    job_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Download job video (FR-029)

    완료된 작업의 영상을 다운로드합니다.
    Supabase Storage URL로 리디렉트합니다.

    Args:
        job_id: Job ID

    Returns:
        Redirect to Supabase Storage video URL

    Raises:
        404: Job not found or not owned by user
        400: Job has no video URL
    """
    from fastapi.responses import RedirectResponse

    try:
        logger.info(f"Downloading job video: user_id={current_user.id}, job_id={job_id}")

        # Get job
        stmt = select(Job).where(Job.id == job_id, Job.user_id == current_user.id)
        result = db.execute(stmt)
        job = result.scalar_one_or_none()

        if not job:
            raise ResourceNotFoundError("작업을 찾을 수 없습니다")

        # Check video URL
        if not job.video_url:
            raise ValidationError("작업에 영상이 없습니다")

        # Redirect to Supabase Storage URL
        logger.info(f"Redirecting to video URL: job_id={job_id}")
        return RedirectResponse(url=job.video_url)

    except (ResourceNotFoundError, ValidationError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST if isinstance(e, ValidationError) else status.HTTP_404_NOT_FOUND,
            detail={"code": e.code, "message": e.message},
        )

    except Exception as e:
        logger.error(f"Job download failed: job_id={job_id}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "INTERNAL_ERROR", "message": "영상 다운로드 중 오류가 발생했습니다"},
        )
