"""YouTube API 라우터"""

from typing import Optional
from datetime import datetime
import logging

from fastapi import APIRouter, Depends, Query, HTTPException, status
from slowapi import Limiter
from slowapi.util import get_remote_address

from src.api.v1.schemas.youtube import (
    SearchQuery,
    YouTubeSearchResponse,
    YouTubeSearchResult,
    VideoDetail,
)
from src.core.youtube.search_service import YouTubeSearchService
from src.core.youtube.exceptions import YouTubeAPIError, QuotaExceededError
from src.core.cache import CacheService
from src.middleware.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/youtube", tags=["YouTube"])
limiter = Limiter(key_func=get_remote_address)


# Dependency: YouTubeSearchService 인스턴스
def get_youtube_service() -> YouTubeSearchService:
    """YouTube 검색 서비스 의존성"""
    return YouTubeSearchService()


# Dependency: CacheService 인스턴스
def get_cache_service() -> CacheService:
    """캐시 서비스 의존성"""
    return CacheService()


@router.get(
    "/search",
    response_model=YouTubeSearchResponse,
    summary="YouTube 영상 검색",
    description="키워드로 YouTube 영상을 검색하고 기본 정보를 반환합니다.",
)
@limiter.limit("10/minute")
async def search_youtube_videos(
    query: str = Query(..., min_length=1, max_length=500, description="검색 키워드"),
    max_results: int = Query(25, ge=25, le=50, description="최대 결과 수 (25~50)"),
    region_code: Optional[str] = Query(
        None, min_length=2, max_length=2, description="국가 코드 (KR, JP, US 등)"
    ),
    published_after: Optional[datetime] = Query(None, description="업로드 시작 날짜"),
    published_before: Optional[datetime] = Query(None, description="업로드 종료 날짜"),
    video_duration: Optional[str] = Query(
        None, description="영상 길이 (short, medium, long, any)"
    ),
    order: str = Query(
        "relevance",
        description="정렬 기준 (relevance, date, viewCount, rating, title)",
    ),
    min_view_count: Optional[int] = Query(None, ge=0, description="최소 조회수"),
    current_user: dict = Depends(get_current_user),
    youtube_service: YouTubeSearchService = Depends(get_youtube_service),
    cache_service: CacheService = Depends(get_cache_service),
):
    """
    YouTube 영상 검색 API

    - **query**: 검색 키워드 (필수)
    - **max_results**: 최대 결과 수 (25~50, 기본값: 25)
    - **region_code**: 국가 코드 (예: KR, JP, US)
    - **published_after**: 업로드 시작 날짜
    - **published_before**: 업로드 종료 날짜
    - **video_duration**: 영상 길이 (short, medium, long, any)
    - **order**: 정렬 기준 (relevance, date, viewCount, rating, title)
    - **min_view_count**: 최소 조회수 필터

    Rate Limit: 10 req/min
    Cache: 15분 TTL
    """
    try:
        # 캐시 키 생성
        cache_key = f"youtube:search:{query}:{max_results}:{region_code}:{video_duration}:{order}"

        # 캐시 확인
        cached_result = await cache_service.get(cache_key)
        if cached_result:
            logger.info(f"캐시된 검색 결과 반환: query={query}")
            return cached_result

        # YouTube API 검색
        videos = await youtube_service.search_videos(
            query=query,
            max_results=max_results,
            region_code=region_code,
            published_after=published_after,
            published_before=published_before,
            video_duration=video_duration,
            order=order,
        )

        # 클라이언트 사이드 필터링 (최소 조회수)
        if min_view_count:
            videos = [v for v in videos if v.get("view_count", 0) >= min_view_count]

        # 응답 구성
        response = YouTubeSearchResponse(
            results=[YouTubeSearchResult(**video) for video in videos],
            total_results=len(videos),
            query=query,
        )

        # 캐시 저장 (15분 TTL)
        await cache_service.set(cache_key, response.model_dump(), ttl=900)

        logger.info(
            f"YouTube 검색 성공: query={query}, results={len(videos)}, user_id={current_user['id']}"
        )
        return response

    except QuotaExceededError as e:
        logger.error(f"YouTube API 할당량 초과: {e}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="YouTube API 할당량이 초과되었습니다. 잠시 후 다시 시도해주세요.",
        )
    except YouTubeAPIError as e:
        logger.error(f"YouTube API 오류: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"YouTube 검색 중 오류가 발생했습니다: {str(e)}",
        )
    except Exception as e:
        logger.error(f"예상치 못한 오류 발생: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="검색 중 오류가 발생했습니다.",
        )


@router.get(
    "/videos/{video_id}",
    response_model=VideoDetail,
    summary="YouTube 영상 상세 정보 조회",
    description="특정 YouTube 영상의 상세 정보를 반환합니다.",
)
@limiter.limit("30/minute")
async def get_video_details(
    video_id: str,
    current_user: dict = Depends(get_current_user),
    youtube_service: YouTubeSearchService = Depends(get_youtube_service),
    cache_service: CacheService = Depends(get_cache_service),
):
    """
    YouTube 영상 상세 정보 조회 API

    - **video_id**: YouTube 영상 ID (필수)

    Rate Limit: 30 req/min
    Cache: 15분 TTL
    """
    try:
        # 캐시 키 생성
        cache_key = f"youtube:video:{video_id}"

        # 캐시 확인
        cached_result = await cache_service.get(cache_key)
        if cached_result:
            logger.info(f"캐시된 영상 정보 반환: video_id={video_id}")
            return cached_result

        # YouTube API 조회
        videos = await youtube_service.get_video_details([video_id])

        if not videos:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="영상을 찾을 수 없습니다.",
            )

        video_detail = VideoDetail(**videos[0])

        # 캐시 저장 (15분 TTL)
        await cache_service.set(cache_key, video_detail.model_dump(), ttl=900)

        logger.info(
            f"YouTube 영상 정보 조회 성공: video_id={video_id}, user_id={current_user['id']}"
        )
        return video_detail

    except YouTubeAPIError as e:
        logger.error(f"YouTube API 오류: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"영상 정보 조회 중 오류가 발생했습니다: {str(e)}",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"예상치 못한 오류 발생: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="영상 정보 조회 중 오류가 발생했습니다.",
        )
