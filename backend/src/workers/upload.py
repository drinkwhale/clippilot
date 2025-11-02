"""
YouTube 업로드 Celery Task

렌더링 완료된 영상을 YouTube에 업로드합니다.
FR-005: YouTube 자동 업로드
FR-006: 업로드 상태 추적 (draft/public/scheduled)
"""

import os
import time
from typing import Dict, Any, Optional
from datetime import datetime

from celery import Task
from loguru import logger
from sqlalchemy import select
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from googleapiclient.errors import HttpError

from ..workers.celery_app import celery_app
from ..core.database import get_db_session
from ..models.job import Job, JobStatus
from ..models.channel import Channel
from ..core.supabase import get_supabase_client


class UploadTask(Task):
    """업로드 작업 기본 클래스"""

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """작업 실패 시 처리"""
        job_id = args[0] if args else kwargs.get("job_id")
        if job_id:
            logger.error(f"Upload task failed for job {job_id}: {exc}")
            # Job 상태를 failed로 업데이트
            with get_db_session() as db:
                job = db.get(Job, job_id)
                if job:
                    job.status = JobStatus.FAILED
                    job.error_message = f"Upload failed: {str(exc)}"
                    db.commit()


@celery_app.task(
    bind=True,
    base=UploadTask,
    name="workers.upload.upload_to_youtube",
    max_retries=3,
    default_retry_delay=60,  # 1분 후 재시도
)
def upload_to_youtube(
    self,
    job_id: str,
    channel_id: str,
    privacy_status: str = "draft",
    scheduled_time: Optional[str] = None,
) -> Dict[str, Any]:
    """
    YouTube에 영상 업로드

    Args:
        job_id: 작업 ID
        channel_id: YouTube 채널 ID
        privacy_status: 공개 상태 (draft, public, private, unlisted)
        scheduled_time: 예약 시간 (ISO 8601 형식, privacy_status가 'private'일 때만)

    Returns:
        업로드 결과 정보

    Raises:
        Exception: 업로드 실패
    """
    logger.info(f"Starting YouTube upload for job {job_id}")

    try:
        with get_db_session() as db:
            # Job 조회
            job = db.get(Job, job_id)
            if not job:
                raise ValueError(f"Job {job_id} not found")

            # Channel 조회
            channel = db.get(Channel, channel_id)
            if not channel:
                raise ValueError(f"Channel {channel_id} not found")

            # Job 상태 확인
            if job.status != JobStatus.COMPLETED:
                raise ValueError(
                    f"Job {job_id} is not ready for upload. "
                    f"Current status: {job.status}"
                )

            # 비디오 URL 확인
            if not job.video_url:
                raise ValueError(f"Job {job_id} has no video URL")

            # Job 상태를 uploading으로 업데이트
            job.status = JobStatus.UPLOADING
            job.upload_started_at = datetime.utcnow()
            db.commit()

            # Supabase Storage에서 비디오 다운로드
            video_path = _download_video_from_storage(job.video_url)

            # YouTube API 클라이언트 생성
            youtube = _get_youtube_service(channel)

            # 메타데이터 준비
            metadata = job.metadata_json or {}
            title = metadata.get("title", f"Video {job.id}")
            description = metadata.get("description", "")
            tags = metadata.get("tags", [])

            # 업로드 요청 준비
            body = {
                "snippet": {
                    "title": title[:100],  # 최대 100자
                    "description": description[:5000],  # 최대 5000자
                    "tags": tags[:500] if isinstance(tags, list) else [],  # 최대 500개
                    "categoryId": "22",  # People & Blogs
                },
                "status": {
                    "privacyStatus": privacy_status,
                    "selfDeclaredMadeForKids": False,
                },
            }

            # 예약 시간 설정
            if scheduled_time and privacy_status == "private":
                body["status"]["publishAt"] = scheduled_time

            # 미디어 파일 업로드
            media = MediaFileUpload(
                video_path,
                chunksize=1024 * 1024,  # 1MB 청크
                resumable=True,
                mimetype="video/mp4"
            )

            # YouTube API 호출
            request = youtube.videos().insert(
                part="snippet,status",
                body=body,
                media_body=media
            )

            # 업로드 실행 (재개 가능)
            response = None
            retry_count = 0
            max_retries = 3

            while response is None:
                try:
                    status, response = request.next_chunk()
                    if status:
                        progress = status.progress()
                        logger.info(f"Upload progress: {progress:.1%}")

                        # 진행률 업데이트
                        metadata["upload_progress"] = progress
                        job.metadata_json = metadata
                        db.commit()

                except HttpError as e:
                    if e.resp.status in [500, 502, 503, 504]:
                        # 서버 오류 시 재시도
                        retry_count += 1
                        if retry_count > max_retries:
                            raise

                        sleep_seconds = 2 ** retry_count
                        logger.warning(
                            f"Server error {e.resp.status}, "
                            f"retrying in {sleep_seconds}s..."
                        )
                        time.sleep(sleep_seconds)
                    else:
                        raise

            # 업로드 완료
            video_id = response.get("id")
            logger.info(f"YouTube upload completed: {video_id}")

            # Job 상태 업데이트
            job.status = JobStatus.DONE
            job.youtube_video_id = video_id
            job.upload_completed_at = datetime.utcnow()

            # 메타데이터에 YouTube 링크 추가
            metadata["youtube_url"] = f"https://www.youtube.com/watch?v={video_id}"
            metadata["privacy_status"] = privacy_status
            if scheduled_time:
                metadata["scheduled_time"] = scheduled_time
            job.metadata_json = metadata

            db.commit()
            db.refresh(job)

            # 임시 파일 삭제
            if os.path.exists(video_path):
                os.remove(video_path)

            return {
                "job_id": str(job.id),
                "status": job.status.value,
                "youtube_video_id": video_id,
                "youtube_url": metadata["youtube_url"],
                "privacy_status": privacy_status,
            }

    except HttpError as e:
        error_message = f"YouTube API error: {e.resp.status} - {e.content}"
        logger.error(error_message)

        # Quota exceeded 체크
        if "quotaExceeded" in str(e.content):
            error_message = "YouTube API 할당량 초과. 내일 다시 시도해주세요."

        # Job 상태 업데이트
        with get_db_session() as db:
            job = db.get(Job, job_id)
            if job:
                job.status = JobStatus.FAILED
                job.error_message = error_message
                job.upload_completed_at = datetime.utcnow()
                db.commit()

        # 재시도 가능한 오류면 재시도
        if e.resp.status in [500, 502, 503, 504]:
            raise self.retry(exc=e)

        raise

    except Exception as e:
        logger.error(f"Upload failed for job {job_id}: {str(e)}")

        # Job 상태 업데이트
        with get_db_session() as db:
            job = db.get(Job, job_id)
            if job:
                job.status = JobStatus.FAILED
                job.error_message = f"Upload failed: {str(e)}"
                job.upload_completed_at = datetime.utcnow()
                db.commit()

        raise


def _get_youtube_service(channel: Channel):
    """
    YouTube API 서비스 클라이언트 생성

    Args:
        channel: Channel 모델 인스턴스

    Returns:
        YouTube API 서비스 객체
    """
    # OAuth 토큰으로 Credentials 생성
    credentials = Credentials(
        token=channel.access_token,
        refresh_token=channel.refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.getenv("GOOGLE_CLIENT_ID"),
        client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    )

    # YouTube API 서비스 생성
    youtube = build("youtube", "v3", credentials=credentials)
    return youtube


def _download_video_from_storage(video_url: str) -> str:
    """
    Supabase Storage에서 비디오 다운로드

    Args:
        video_url: Supabase Storage 비디오 URL

    Returns:
        다운로드된 비디오 로컬 경로
    """
    import tempfile
    import httpx

    # 임시 파일 생성
    temp_file = tempfile.NamedTemporaryFile(
        delete=False,
        suffix=".mp4",
        prefix="clippilot_"
    )
    temp_path = temp_file.name
    temp_file.close()

    # Supabase Storage에서 다운로드
    try:
        response = httpx.get(video_url, timeout=300.0)
        response.raise_for_status()

        with open(temp_path, "wb") as f:
            f.write(response.content)

        logger.info(f"Video downloaded to {temp_path}")
        return temp_path

    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise Exception(f"Failed to download video: {str(e)}")


@celery_app.task(name="workers.upload.update_video_privacy")
def update_video_privacy(
    job_id: str,
    privacy_status: str,
    scheduled_time: Optional[str] = None,
) -> Dict[str, Any]:
    """
    YouTube 영상 공개 상태 업데이트

    Args:
        job_id: 작업 ID
        privacy_status: 새 공개 상태 (draft, public, private, unlisted)
        scheduled_time: 예약 시간 (ISO 8601 형식)

    Returns:
        업데이트 결과
    """
    logger.info(f"Updating privacy status for job {job_id} to {privacy_status}")

    try:
        with get_db_session() as db:
            job = db.get(Job, job_id)
            if not job:
                raise ValueError(f"Job {job_id} not found")

            if not job.youtube_video_id:
                raise ValueError(f"Job {job_id} has no YouTube video")

            # Channel 조회 (user_id로 찾기)
            stmt = select(Channel).where(Channel.user_id == job.user_id)
            result = db.execute(stmt)
            channel = result.scalar_one_or_none()

            if not channel:
                raise ValueError(f"No channel found for user {job.user_id}")

            # YouTube API 클라이언트 생성
            youtube = _get_youtube_service(channel)

            # 업데이트 요청
            body = {
                "id": job.youtube_video_id,
                "status": {
                    "privacyStatus": privacy_status,
                },
            }

            if scheduled_time and privacy_status == "private":
                body["status"]["publishAt"] = scheduled_time

            # API 호출
            youtube.videos().update(
                part="status",
                body=body
            ).execute()

            # 메타데이터 업데이트
            metadata = job.metadata_json or {}
            metadata["privacy_status"] = privacy_status
            if scheduled_time:
                metadata["scheduled_time"] = scheduled_time
            job.metadata_json = metadata

            db.commit()

            logger.info(f"Privacy status updated for job {job_id}")

            return {
                "job_id": str(job.id),
                "youtube_video_id": job.youtube_video_id,
                "privacy_status": privacy_status,
            }

    except Exception as e:
        logger.error(f"Failed to update privacy status: {str(e)}")
        raise
