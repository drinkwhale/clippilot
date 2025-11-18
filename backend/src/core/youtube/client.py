"""
YouTube API 클라이언트

YouTube Data API v3와의 연동을 위한 클라이언트를 제공합니다.
"""

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from src.config import settings
import logging

logger = logging.getLogger(__name__)


class YouTubeClient:
    """YouTube Data API v3 클라이언트"""

    def __init__(self, api_key: str = None):
        """
        YouTube API 클라이언트 초기화

        Args:
            api_key: YouTube Data API 키 (기본값: settings.YOUTUBE_API_KEY)
        """
        self.api_key = api_key or settings.YOUTUBE_API_KEY
        self._client = None

    @property
    def client(self):
        """YouTube API 클라이언트 인스턴스 (lazy loading)"""
        if self._client is None:
            try:
                self._client = build(
                    'youtube',
                    'v3',
                    developerKey=self.api_key,
                    cache_discovery=False
                )
                logger.info("YouTube API 클라이언트 초기화 완료")
            except Exception as e:
                logger.error(f"YouTube API 클라이언트 초기화 실패: {str(e)}")
                raise
        return self._client

    def get_service(self):
        """
        YouTube API 서비스 객체 반환

        Returns:
            googleapiclient.discovery.Resource: YouTube API 서비스
        """
        return self.client


# 전역 클라이언트 인스턴스
youtube_client = YouTubeClient()


def get_youtube_client() -> YouTubeClient:
    """
    YouTube 클라이언트 인스턴스 반환 (의존성 주입용)

    Returns:
        YouTubeClient: YouTube API 클라이언트
    """
    return youtube_client
