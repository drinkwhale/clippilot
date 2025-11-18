"""
YouTube API 에러 핸들러

YouTube Data API v3 사용 시 발생할 수 있는 에러를 처리합니다.
"""

from googleapiclient.errors import HttpError
from fastapi import HTTPException, status
import logging
import json

logger = logging.getLogger(__name__)


class YouTubeAPIError(Exception):
    """YouTube API 에러 기본 클래스"""

    def __init__(self, message: str, status_code: int = 500, details: dict = None):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class QuotaExceededError(YouTubeAPIError):
    """API Quota 초과 에러"""

    def __init__(self, message: str = "YouTube API 할당량이 초과되었습니다."):
        super().__init__(
            message=message,
            status_code=429,
            details={"retry_after": 3600}  # 1시간 후 재시도
        )


class InvalidAPIKeyError(YouTubeAPIError):
    """잘못된 API 키 에러"""

    def __init__(self, message: str = "YouTube API 키가 유효하지 않습니다."):
        super().__init__(
            message=message,
            status_code=401
        )


class VideoNotFoundError(YouTubeAPIError):
    """영상을 찾을 수 없음 에러"""

    def __init__(self, video_id: str):
        super().__init__(
            message=f"영상을 찾을 수 없습니다. (ID: {video_id})",
            status_code=404,
            details={"video_id": video_id}
        )


class ChannelNotFoundError(YouTubeAPIError):
    """채널을 찾을 수 없음 에러"""

    def __init__(self, channel_id: str):
        super().__init__(
            message=f"채널을 찾을 수 없습니다. (ID: {channel_id})",
            status_code=404,
            details={"channel_id": channel_id}
        )


def handle_youtube_api_error(error: HttpError) -> YouTubeAPIError:
    """
    Google API HttpError를 YouTubeAPIError로 변환

    Args:
        error: Google API HttpError

    Returns:
        YouTubeAPIError: 적절한 커스텀 에러
    """
    try:
        # 에러 세부 정보 파싱
        error_details = json.loads(error.content.decode('utf-8'))
        error_reason = error_details.get('error', {}).get('errors', [{}])[0].get('reason', '')
        error_message = error_details.get('error', {}).get('message', str(error))

        logger.error(
            f"YouTube API Error: {error_reason} - {error_message}",
            extra={
                "status_code": error.resp.status,
                "reason": error_reason,
                "details": error_details
            }
        )

        # Quota 초과
        if error_reason in ['quotaExceeded', 'dailyLimitExceeded']:
            return QuotaExceededError(error_message)

        # 인증 에러
        if error.resp.status == 401 or error_reason == 'authError':
            return InvalidAPIKeyError(error_message)

        # Not Found 에러
        if error.resp.status == 404:
            if 'video' in error_message.lower():
                # video_id 추출 시도
                video_id = error_details.get('error', {}).get('errors', [{}])[0].get('location', 'unknown')
                return VideoNotFoundError(video_id)
            elif 'channel' in error_message.lower():
                # channel_id 추출 시도
                channel_id = error_details.get('error', {}).get('errors', [{}])[0].get('location', 'unknown')
                return ChannelNotFoundError(channel_id)

        # 기타 에러
        return YouTubeAPIError(
            message=error_message,
            status_code=error.resp.status,
            details=error_details
        )

    except Exception as e:
        logger.error(f"Failed to parse YouTube API error: {str(e)}")
        return YouTubeAPIError(
            message=str(error),
            status_code=500
        )


def youtube_error_to_http_exception(error: YouTubeAPIError) -> HTTPException:
    """
    YouTubeAPIError를 FastAPI HTTPException으로 변환

    Args:
        error: YouTubeAPIError

    Returns:
        HTTPException: FastAPI HTTPException
    """
    return HTTPException(
        status_code=error.status_code,
        detail={
            "error": {
                "code": error.__class__.__name__.replace("Error", "").upper(),
                "message": error.message,
                "details": error.details
            }
        }
    )
