"""YouTube API 라우터"""

from typing import Optional
from datetime import datetime
import logging

from fastapi import (
    APIRouter,
    Depends,
    Header,
    HTTPException,
    Query,
    Request,
    status,
)
from slowapi import Limiter
from slowapi.util import get_remote_address

from src.api.v1.schemas.youtube import (
    SearchQuery,
    YouTubeSearchResponse,
    YouTubeSearchResult,
    VideoDetail,
    CaptionListResponse,
    Caption,
    CommentListResponse,
    Comment,
    ChannelDetail,
    TranscriptResponse,
    TranscriptSegment,
    AvailableTranscriptsResponse,
    AvailableTranscript,
)
from src.core.youtube.search_service import YouTubeSearchService
from src.core.youtube.transcript_service import TranscriptService
from src.core.youtube.exceptions import YouTubeAPIError, QuotaExceededError
from src.core.cache import CacheService
from src.middleware.auth import get_current_user
from src.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/youtube", tags=["YouTube"])
limiter = Limiter(key_func=get_remote_address)


# Dependency: YouTubeSearchService 인스턴스
def get_youtube_service(
    youtube_api_key: str | None = Header(None, alias="X-YouTube-API-Key")
) -> YouTubeSearchService:
    """YouTube 검색 서비스 의존성"""
    try:
        return YouTubeSearchService(api_key=youtube_api_key)
    except YouTubeAPIError as e:
        # 사용자 친화적인 메시지로 반환
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


# Dependency: CacheService 인스턴스
def get_cache_service() -> CacheService:
    """캐시 서비스 의존성"""
    return CacheService()


@router.get(
    "/search",
    response_model=YouTubeSearchResponse,
    response_model_by_alias=True,
    summary="YouTube 영상 검색",
    description="키워드로 YouTube 영상을 검색하고 기본 정보를 반환합니다.",
)
@limiter.limit("10/minute")
async def search_youtube_videos(
    request: Request,
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
    min_subscriber_count: Optional[int] = Query(
        None, ge=0, description="최소 구독자 수"
    ),
    current_user: User = Depends(get_current_user),
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
    - **min_subscriber_count**: 최소 구독자 수 필터

    Rate Limit: 10 req/min
    Cache: 15분 TTL
    """
    try:
        # 캐시 키 생성 (모든 필터 파라미터 포함)
        cache_key = (
            f"youtube:search:{query}:{max_results}:{region_code}:"
            f"{published_after}:{published_before}:{video_duration}:{order}:"
            f"{min_view_count}:{min_subscriber_count}"
        )

        # 캐시 확인
        cached_result = cache_service.get(cache_key)
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
            min_subscriber_count=min_subscriber_count,
        )

        # 클라이언트 사이드 필터링 (최소 조회수)
        if min_view_count:
            videos = [v for v in videos if v.get("view_count", 0) >= min_view_count]

        # 응답 구성
        response = YouTubeSearchResponse(
            videos=[YouTubeSearchResult(**video) for video in videos],
            total_results=len(videos),
            query=query,
        )

        # 캐시 저장 (15분 TTL)
        cache_service.set(cache_key, response.model_dump(by_alias=True), ttl=900)

        logger.info(
            "YouTube 검색 성공: query=%s, results=%s, user_id=%s",
            query,
            len(videos),
            getattr(current_user, "id", None),
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
    response_model_by_alias=True,
    summary="YouTube 영상 상세 정보 조회",
    description="특정 YouTube 영상의 상세 정보를 반환합니다.",
)
@limiter.limit("30/minute")
async def get_video_details(
    request: Request,
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
        cached_result = cache_service.get(cache_key)
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
        cache_service.set(cache_key, video_detail.model_dump(by_alias=True), ttl=900)

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


@router.get(
    "/videos/{video_id}/captions",
    response_model=CaptionListResponse,
    response_model_by_alias=True,
    summary="YouTube 영상 자막 목록 조회",
    description="특정 YouTube 영상의 자막 트랙 목록을 반환합니다.",
)
@limiter.limit("30/minute")
async def get_video_captions(
    request: Request,
    video_id: str,
    current_user: dict = Depends(get_current_user),
    youtube_service: YouTubeSearchService = Depends(get_youtube_service),
    cache_service: CacheService = Depends(get_cache_service),
):
    """
    YouTube 영상 자막 목록 조회 API

    - **video_id**: YouTube 영상 ID (필수)

    Rate Limit: 30 req/min
    Cache: 1시간 TTL
    """
    try:
        # 캐시 키 생성
        cache_key = f"youtube:captions:{video_id}"

        # 캐시 확인
        cached_result = cache_service.get(cache_key)
        if cached_result:
            logger.info(f"캐시된 자막 정보 반환: video_id={video_id}")
            return cached_result

        # YouTube API 조회
        captions = await youtube_service.get_video_captions(video_id)

        response = CaptionListResponse(
            video_id=video_id,
            captions=[Caption(**caption) for caption in captions],
        )

        # 캐시 저장 (1시간 TTL)
        cache_service.set(cache_key, response.model_dump(by_alias=True), ttl=3600)

        logger.info(
            f"YouTube 자막 정보 조회 성공: video_id={video_id}, captions={len(captions)}"
        )
        return response

    except YouTubeAPIError as e:
        logger.error(f"YouTube API 오류: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"자막 정보 조회 중 오류가 발생했습니다: {str(e)}",
        )
    except Exception as e:
        logger.error(f"예상치 못한 오류 발생: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="자막 정보 조회 중 오류가 발생했습니다.",
        )


@router.get(
    "/videos/{video_id}/comments",
    response_model=CommentListResponse,
    response_model_by_alias=True,
    summary="YouTube 영상 댓글 조회",
    description="특정 YouTube 영상의 댓글 목록을 반환합니다.",
)
@limiter.limit("30/minute")
async def get_video_comments(
    request: Request,
    video_id: str,
    max_results: int = Query(20, ge=10, le=100, description="최대 결과 수 (10~100)"),
    current_user: dict = Depends(get_current_user),
    youtube_service: YouTubeSearchService = Depends(get_youtube_service),
    cache_service: CacheService = Depends(get_cache_service),
):
    """
    YouTube 영상 댓글 조회 API

    - **video_id**: YouTube 영상 ID (필수)
    - **max_results**: 최대 결과 수 (10~100, 기본값: 20)

    Rate Limit: 30 req/min
    Cache: 15분 TTL
    """
    try:
        # 캐시 키 생성
        cache_key = f"youtube:comments:{video_id}:{max_results}"

        # 캐시 확인
        cached_result = cache_service.get(cache_key)
        if cached_result:
            logger.info(f"캐시된 댓글 정보 반환: video_id={video_id}")
            return cached_result

        # YouTube API 조회
        comments = await youtube_service.get_video_comments(video_id, max_results)

        response = CommentListResponse(
            video_id=video_id,
            comments=[Comment(**comment) for comment in comments],
            total_comments=len(comments),
        )

        # 캐시 저장 (15분 TTL)
        cache_service.set(cache_key, response.model_dump(by_alias=True), ttl=900)

        logger.info(
            f"YouTube 댓글 조회 성공: video_id={video_id}, comments={len(comments)}"
        )
        return response

    except YouTubeAPIError as e:
        logger.error(f"YouTube API 오류: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"댓글 정보 조회 중 오류가 발생했습니다: {str(e)}",
        )
    except Exception as e:
        logger.error(f"예상치 못한 오류 발생: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="댓글 정보 조회 중 오류가 발생했습니다.",
        )


@router.get(
    "/channels/{channel_id}",
    response_model=ChannelDetail,
    response_model_by_alias=True,
    summary="YouTube 채널 상세 정보 조회",
    description="특정 YouTube 채널의 상세 정보를 반환합니다.",
)
@limiter.limit("30/minute")
async def get_channel_details(
    request: Request,
    channel_id: str,
    current_user: dict = Depends(get_current_user),
    youtube_service: YouTubeSearchService = Depends(get_youtube_service),
    cache_service: CacheService = Depends(get_cache_service),
):
    """
    YouTube 채널 상세 정보 조회 API

    - **channel_id**: YouTube 채널 ID (필수)

    Rate Limit: 30 req/min
    Cache: 1시간 TTL
    """
    try:
        # 캐시 키 생성
        cache_key = f"youtube:channel:{channel_id}"

        # 캐시 확인
        cached_result = cache_service.get(cache_key)
        if cached_result:
            logger.info(f"캐시된 채널 정보 반환: channel_id={channel_id}")
            return cached_result

        # YouTube API 조회
        channel = await youtube_service.get_channel_details(channel_id)

        response = ChannelDetail(**channel)

        # 캐시 저장 (1시간 TTL)
        cache_service.set(cache_key, response.model_dump(by_alias=True), ttl=3600)

        logger.info(f"YouTube 채널 정보 조회 성공: channel_id={channel_id}")
        return response

    except YouTubeAPIError as e:
        logger.error(f"YouTube API 오류: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"채널 정보 조회 중 오류가 발생했습니다: {str(e)}",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"예상치 못한 오류 발생: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="채널 정보 조회 중 오류가 발생했습니다.",
        )


@router.get(
    "/videos/{video_id}/transcript",
    response_model=TranscriptResponse,
    response_model_by_alias=True,
    summary="YouTube 영상 자막 다운로드",
    description="특정 YouTube 영상의 자막 텍스트를 반환합니다.",
)
@limiter.limit("30/minute")
async def get_video_transcript(
    request: Request,
    video_id: str,
    languages: Optional[str] = Query(None, description="선호 언어 (쉼표로 구분, 예: ko,en)"),
    current_user: dict = Depends(get_current_user),
    cache_service: CacheService = Depends(get_cache_service),
):
    """
    YouTube 영상 자막 다운로드 API

    - **video_id**: YouTube 영상 ID (필수)
    - **languages**: 선호 언어 목록 (예: ko,en)

    Rate Limit: 30 req/min
    Cache: 1시간 TTL
    """
    try:
        # 언어 목록 파싱
        language_list = None
        if languages:
            language_list = [lang.strip() for lang in languages.split(",")]

        # 캐시 키 생성
        cache_key = f"youtube:transcript:{video_id}:{languages or 'default'}"

        # 캐시 확인
        cached_result = cache_service.get(cache_key)
        if cached_result:
            logger.info(f"캐시된 자막 반환: video_id={video_id}")
            return cached_result

        # 자막 가져오기
        transcript_segments = await TranscriptService.get_transcript(
            video_id, language_list
        )
        full_text = await TranscriptService.get_transcript_text(
            video_id, language_list
        )

        # 실제 사용된 언어 추출 (첫 번째 세그먼트가 있는 경우)
        detected_language = language_list[0] if language_list else "en"

        response = TranscriptResponse(
            video_id=video_id,
            language=detected_language,
            segments=[TranscriptSegment(**seg) for seg in transcript_segments],
            full_text=full_text,
        )

        # 캐시 저장 (1시간 TTL)
        cache_service.set(cache_key, response.model_dump(by_alias=True), ttl=3600)

        logger.info(
            f"자막 다운로드 성공: video_id={video_id}, segments={len(transcript_segments)}"
        )
        return response

    except YouTubeAPIError as e:
        logger.error(f"자막 다운로드 오류: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"예상치 못한 오류 발생: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="자막 다운로드 중 오류가 발생했습니다.",
        )


@router.get(
    "/videos/{video_id}/transcripts/available",
    response_model=AvailableTranscriptsResponse,
    response_model_by_alias=True,
    summary="사용 가능한 자막 목록 조회",
    description="특정 YouTube 영상의 사용 가능한 자막 목록을 반환합니다.",
)
@limiter.limit("30/minute")
async def get_available_transcripts(
    request: Request,
    video_id: str,
    current_user: dict = Depends(get_current_user),
    cache_service: CacheService = Depends(get_cache_service),
):
    """
    사용 가능한 자막 목록 조회 API

    - **video_id**: YouTube 영상 ID (필수)

    Rate Limit: 30 req/min
    Cache: 1시간 TTL
    """
    try:
        # 캐시 키 생성
        cache_key = f"youtube:transcripts:available:{video_id}"

        # 캐시 확인
        cached_result = cache_service.get(cache_key)
        if cached_result:
            logger.info(f"캐시된 자막 목록 반환: video_id={video_id}")
            return cached_result

        # 사용 가능한 자막 목록 조회
        transcripts = await TranscriptService.get_available_transcripts(video_id)

        response = AvailableTranscriptsResponse(
            video_id=video_id,
            transcripts=[AvailableTranscript(**t) for t in transcripts],
        )

        # 캐시 저장 (1시간 TTL)
        cache_service.set(cache_key, response.model_dump(by_alias=True), ttl=3600)

        logger.info(
            f"자막 목록 조회 성공: video_id={video_id}, count={len(transcripts)}"
        )
        return response

    except YouTubeAPIError as e:
        logger.error(f"자막 목록 조회 오류: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"예상치 못한 오류 발생: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="자막 목록 조회 중 오류가 발생했습니다.",
        )
