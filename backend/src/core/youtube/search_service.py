"""YouTube 검색 서비스"""

from typing import Optional, List, Dict, Any
from datetime import datetime
import logging

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from src.config import settings
from src.core.youtube.exceptions import YouTubeAPIError, QuotaExceededError
from src.core.youtube.utils import parse_iso8601_duration

logger = logging.getLogger(__name__)


class YouTubeSearchService:
    """YouTube 검색 서비스 클래스"""

    def __init__(self):
        """YouTube API 클라이언트 초기화"""
        self.youtube = build("youtube", "v3", developerKey=settings.YOUTUBE_API_KEY)

    async def search_videos(
        self,
        query: str,
        max_results: int = 25,
        region_code: Optional[str] = None,
        published_after: Optional[datetime] = None,
        published_before: Optional[datetime] = None,
        video_duration: Optional[str] = None,
        order: str = "relevance",
        min_subscriber_count: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        YouTube 영상 검색

        Args:
            query: 검색 키워드
            max_results: 최대 결과 수 (25~50)
            region_code: 국가 코드 (KR, JP, US 등)
            published_after: 업로드 시작 날짜
            published_before: 업로드 종료 날짜
            video_duration: 영상 길이 (short, medium, long)
            order: 정렬 기준 (relevance, date, viewCount, rating)
            min_subscriber_count: 최소 구독자 수 (선택)

        Returns:
            검색된 영상 정보 목록

        Raises:
            YouTubeAPIError: YouTube API 오류
            QuotaExceededError: API 할당량 초과
        """
        try:
            # 검색 파라미터 구성
            search_params = {
                "part": "id,snippet",
                "q": query,
                "type": "video",
                "maxResults": min(max_results, 50),  # 최대 50개 제한
                "order": order,
                "videoEmbeddable": "true",  # 임베디드 가능한 영상만
                "videoSyndicated": "true",  # 신디케이트 가능한 영상만
            }

            # 선택적 파라미터 추가
            if region_code:
                search_params["regionCode"] = region_code

            if published_after:
                # YouTube API는 RFC 3339 형식 필요 (UTC timezone: Z suffix)
                # timezone-aware datetime의 경우 +00:00를 Z로 변환
                timestamp = published_after.isoformat()
                if timestamp.endswith('+00:00'):
                    timestamp = timestamp[:-6] + 'Z'
                elif not timestamp.endswith('Z'):
                    timestamp += 'Z'
                search_params["publishedAfter"] = timestamp

            if published_before:
                # YouTube API는 RFC 3339 형식 필요 (UTC timezone: Z suffix)
                # timezone-aware datetime의 경우 +00:00를 Z로 변환
                timestamp = published_before.isoformat()
                if timestamp.endswith('+00:00'):
                    timestamp = timestamp[:-6] + 'Z'
                elif not timestamp.endswith('Z'):
                    timestamp += 'Z'
                search_params["publishedBefore"] = timestamp

            if video_duration:
                search_params["videoDuration"] = video_duration

            # YouTube API 호출
            logger.info(f"YouTube 검색 시작: query={query}, max_results={max_results}")
            search_response = self.youtube.search().list(**search_params).execute()

            video_ids = [item["id"]["videoId"] for item in search_response.get("items", [])]

            if not video_ids:
                logger.warning(f"검색 결과 없음: query={query}")
                return []

            # 영상 상세 정보 조회
            videos = await self.get_video_details(video_ids)

            # 구독자 수 필터 적용
            if min_subscriber_count is not None:
                videos = await self._filter_by_subscriber_count(
                    videos, min_subscriber_count
                )

            logger.info(f"YouTube 검색 완료: {len(videos)}개 영상")
            return videos

        except HttpError as e:
            if e.resp.status == 403:
                logger.error("YouTube API 할당량 초과")
                raise QuotaExceededError("YouTube API 할당량이 초과되었습니다.")
            logger.error(f"YouTube API 오류: {e}")
            raise YouTubeAPIError(f"YouTube API 오류: {e}")
        except Exception as e:
            logger.error(f"YouTube 검색 중 오류 발생: {e}")
            raise YouTubeAPIError(f"검색 중 오류가 발생했습니다: {e}")

    async def get_video_details(self, video_ids: List[str]) -> List[Dict[str, Any]]:
        """
        YouTube 영상 상세 정보 조회

        Args:
            video_ids: 영상 ID 목록

        Returns:
            영상 상세 정보 목록

        Raises:
            YouTubeAPIError: YouTube API 오류
        """
        try:
            if not video_ids:
                return []

            # videos.list API 호출
            videos_response = (
                self.youtube.videos()
                .list(
                    part="snippet,contentDetails,statistics",
                    id=",".join(video_ids),
                )
                .execute()
            )

            videos = []
            for item in videos_response.get("items", []):
                video_data = self._parse_video_item(item)
                videos.append(video_data)

            return videos

        except HttpError as e:
            logger.error(f"YouTube API 오류 (영상 상세 조회): {e}")
            raise YouTubeAPIError(f"영상 정보 조회 중 오류가 발생했습니다: {e}")
        except Exception as e:
            logger.error(f"영상 상세 정보 조회 중 오류 발생: {e}")
            raise YouTubeAPIError(f"영상 정보 처리 중 오류가 발생했습니다: {e}")

    async def _filter_by_subscriber_count(
        self, videos: List[Dict[str, Any]], min_subscribers: int
    ) -> List[Dict[str, Any]]:
        """
        구독자 수로 영상 필터링

        Args:
            videos: 영상 목록
            min_subscribers: 최소 구독자 수

        Returns:
            필터링된 영상 목록
        """
        try:
            # 채널 ID 추출
            channel_ids = list(set(video["channel_id"] for video in videos))

            if not channel_ids:
                return []

            # 채널 정보 조회
            channels_response = (
                self.youtube.channels()
                .list(
                    part="statistics",
                    id=",".join(channel_ids),
                )
                .execute()
            )

            # 채널 ID → 구독자 수 매핑
            channel_subscribers = {}
            for item in channels_response.get("items", []):
                channel_id = item["id"]
                subscriber_count = int(
                    item.get("statistics", {}).get("subscriberCount", 0)
                )
                channel_subscribers[channel_id] = subscriber_count

            # 필터링
            filtered_videos = [
                video
                for video in videos
                if channel_subscribers.get(video["channel_id"], 0) >= min_subscribers
            ]

            logger.info(
                f"구독자 수 필터 적용: {len(videos)}개 → {len(filtered_videos)}개"
            )
            return filtered_videos

        except Exception as e:
            logger.error(f"구독자 수 필터링 중 오류: {e}")
            # 오류 발생 시 원본 반환
            return videos

    def _parse_video_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """
        YouTube API 응답 → 표준 포맷 변환

        Args:
            item: YouTube API videos.list 응답 아이템

        Returns:
            표준 포맷 영상 정보
        """
        snippet = item.get("snippet", {})
        content_details = item.get("contentDetails", {})
        statistics = item.get("statistics", {})

        # ISO 8601 duration 파싱
        duration_iso = content_details.get("duration", "PT0S")
        duration_seconds = parse_iso8601_duration(duration_iso)

        # 썸네일 선택 (우선순위: maxres > high > medium > default)
        thumbnails = snippet.get("thumbnails", {})
        thumbnail_url = (
            thumbnails.get("maxres", {}).get("url")
            or thumbnails.get("high", {}).get("url")
            or thumbnails.get("medium", {}).get("url")
            or thumbnails.get("default", {}).get("url")
        )

        return {
            "video_id": item["id"],
            "title": snippet.get("title", ""),
            "description": snippet.get("description", ""),
            "channel_id": snippet.get("channelId", ""),
            "channel_title": snippet.get("channelTitle", ""),
            "published_at": snippet.get("publishedAt", ""),
            "thumbnail_url": thumbnail_url,
            "duration": duration_seconds,
            "view_count": int(statistics.get("viewCount", 0)),
            "like_count": int(statistics.get("likeCount", 0)),
            "comment_count": int(statistics.get("commentCount", 0)),
            "tags": snippet.get("tags", []),
            "category_id": snippet.get("categoryId", ""),
        }
