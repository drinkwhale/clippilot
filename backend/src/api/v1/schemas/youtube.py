"""YouTube API 스키마 정의"""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, validator, ConfigDict


def to_camel(string: str) -> str:
    """snake_case를 camelCase로 변환"""
    components = string.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])


class SearchQuery(BaseModel):
    """YouTube 검색 쿼리 스키마"""

    query: str = Field(..., min_length=1, max_length=500, description="검색 키워드")
    max_results: int = Field(
        25, ge=25, le=50, description="최대 결과 수 (25~50)"
    )
    region_code: Optional[str] = Field(
        None, min_length=2, max_length=2, description="국가 코드 (KR, JP, US 등)"
    )
    published_after: Optional[datetime] = Field(None, description="업로드 시작 날짜")
    published_before: Optional[datetime] = Field(None, description="업로드 종료 날짜")
    video_duration: Optional[str] = Field(
        None, description="영상 길이 (short, medium, long, any)"
    )
    order: str = Field(
        "relevance",
        description="정렬 기준 (relevance, date, viewCount, rating, title)",
    )
    min_view_count: Optional[int] = Field(None, ge=0, description="최소 조회수")
    min_subscribers: Optional[int] = Field(None, ge=0, description="최소 구독자 수")

    @validator("video_duration")
    def validate_video_duration(cls, v):
        """영상 길이 필터 검증"""
        if v and v not in ["short", "medium", "long", "any"]:
            raise ValueError(
                "video_duration은 short, medium, long, any 중 하나여야 합니다."
            )
        return v

    @validator("order")
    def validate_order(cls, v):
        """정렬 기준 검증"""
        valid_orders = ["relevance", "date", "viewCount", "rating", "title"]
        if v not in valid_orders:
            raise ValueError(f"order는 {', '.join(valid_orders)} 중 하나여야 합니다.")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "query": "React Tutorial",
                "max_results": 25,
                "region_code": "KR",
                "video_duration": "medium",
                "order": "viewCount",
            }
        }


class YouTubeSearchResult(BaseModel):
    """YouTube 검색 결과 스키마"""

    video_id: str = Field(..., description="YouTube 영상 ID")
    title: str = Field(..., description="영상 제목")
    description: str = Field(..., description="영상 설명")
    channel_id: str = Field(..., description="채널 ID")
    channel_title: str = Field(..., description="채널 이름")
    published_at: str = Field(..., description="게시 날짜 (ISO 8601)")
    thumbnail_url: Optional[str] = Field(None, description="썸네일 URL")
    duration: int = Field(..., description="영상 길이 (초)")
    view_count: int = Field(..., description="조회수")
    like_count: int = Field(..., description="좋아요 수")
    comment_count: int = Field(..., description="댓글 수")
    tags: List[str] = Field(default_factory=list, description="태그 목록")
    category_id: str = Field(..., description="카테고리 ID")
    subscriber_count: Optional[int] = Field(
        None, description="채널 구독자 수", alias="subscriberCount"
    )
    channel_total_videos: Optional[int] = Field(
        None, description="채널 총 영상 수", alias="channelTotalVideos"
    )
    channel_total_views: Optional[int] = Field(
        None, description="채널 누적 조회수", alias="channelTotalViews"
    )
    performance_ratio: Optional[float] = Field(
        None, description="성과도 배율 (영상 조회수 / 채널 평균 조회수)", alias="performanceRatio"
    )
    channel_contribution: Optional[float] = Field(
        None,
        description="채널 기여도 (영상 조회수 / 채널 누적 조회수 * 100)",
        alias="channelContribution",
    )
    cii: Optional[float] = Field(None, description="Channel Influence Index (선택)")

    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=to_camel,
        json_schema_extra={
            "example": {
                "video_id": "dQw4w9WgXcQ",
                "title": "Rick Astley - Never Gonna Give You Up",
                "description": "Official Music Video",
                "channel_id": "UCuAXFkgsw1L7xaCfnd5JJOw",
                "channel_title": "Rick Astley",
                "published_at": "2009-10-25T06:57:33Z",
                "thumbnail_url": "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
                "duration": 212,
                "view_count": 1000000000,
                "like_count": 10000000,
                "comment_count": 500000,
                "tags": ["Rick Astley", "Never Gonna Give You Up"],
                "category_id": "10",
                "subscriber_count": 3000000,
                "channel_total_videos": 150,
                "channel_total_views": 5000000000,
                "performance_ratio": 1.5,
                "channel_contribution": 20.0,
            }
        }
    )


class YouTubeSearchResponse(BaseModel):
    """YouTube 검색 응답 스키마"""

    videos: List[YouTubeSearchResult] = Field(..., description="검색 결과 목록", alias="results")
    total_results: int = Field(..., description="총 결과 수")
    query: str = Field(..., description="검색 쿼리")

    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=to_camel,
        json_schema_extra={
            "example": {
                "results": [
                    {
                        "video_id": "dQw4w9WgXcQ",
                        "title": "Rick Astley - Never Gonna Give You Up",
                        "description": "Official Music Video",
                        "channel_id": "UCuAXFkgsw1L7xaCfnd5JJOw",
                        "channel_title": "Rick Astley",
                        "published_at": "2009-10-25T06:57:33Z",
                        "thumbnail_url": "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
                        "duration": 212,
                        "view_count": 1000000000,
                        "like_count": 10000000,
                        "comment_count": 500000,
                        "tags": ["Rick Astley", "Never Gonna Give You Up"],
                        "category_id": "10",
                    }
                ],
                "total_results": 1,
                "query": "Rick Astley",
            }
        }
    )


class VideoDetail(BaseModel):
    """YouTube 영상 상세 정보 스키마"""

    video_id: str = Field(..., description="YouTube 영상 ID")
    title: str = Field(..., description="영상 제목")
    description: str = Field(..., description="영상 설명")
    channel_id: str = Field(..., description="채널 ID")
    channel_title: str = Field(..., description="채널 이름")
    published_at: str = Field(..., description="게시 날짜 (ISO 8601)")
    thumbnail_url: Optional[str] = Field(None, description="썸네일 URL")
    duration: int = Field(..., description="영상 길이 (초)")
    view_count: int = Field(..., description="조회수")
    like_count: int = Field(..., description="좋아요 수")
    comment_count: int = Field(..., description="댓글 수")
    tags: List[str] = Field(default_factory=list, description="태그 목록")
    category_id: str = Field(..., description="카테고리 ID")
    subscriber_count: Optional[int] = Field(None, description="채널 구독자 수")
    channel_total_videos: Optional[int] = Field(None, description="채널 총 영상 수")
    channel_total_views: Optional[int] = Field(None, description="채널 누적 조회수")
    performance_ratio: Optional[float] = Field(None, description="성과도 배율 (영상 조회수 / 채널 평균 조회수)")
    channel_contribution: Optional[float] = Field(None, description="채널 기여도 (영상 조회수 / 채널 누적 조회수 * 100)")

    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=to_camel,
        json_schema_extra={
            "example": {
                "video_id": "dQw4w9WgXcQ",
                "title": "Rick Astley - Never Gonna Give You Up",
                "description": "Official Music Video",
                "channel_id": "UCuAXFkgsw1L7xaCfnd5JJOw",
                "channel_title": "Rick Astley",
                "published_at": "2009-10-25T06:57:33Z",
                "thumbnail_url": "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
                "duration": 212,
                "view_count": 1000000000,
                "like_count": 10000000,
                "comment_count": 500000,
                "tags": ["Rick Astley", "Never Gonna Give You Up"],
                "category_id": "10",
            }
        }
    )


class Caption(BaseModel):
    """YouTube 자막 정보 스키마"""

    id: str = Field(..., description="자막 트랙 ID")
    language: str = Field(..., description="언어 코드 (ko, en 등)")
    name: str = Field(..., description="자막 이름")
    track_kind: str = Field(..., description="트랙 종류 (standard, ASR 등)")
    is_auto_synced: bool = Field(..., description="자동 생성 여부")

    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=to_camel,
    )


class CaptionListResponse(BaseModel):
    """YouTube 자막 목록 응답 스키마"""

    video_id: str = Field(..., description="YouTube 영상 ID")
    captions: List[Caption] = Field(..., description="자막 트랙 목록")

    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=to_camel,
    )


class Comment(BaseModel):
    """YouTube 댓글 정보 스키마"""

    comment_id: str = Field(..., description="댓글 ID")
    author: str = Field(..., description="작성자 이름")
    author_channel_id: str = Field(..., description="작성자 채널 ID")
    text: str = Field(..., description="댓글 내용")
    like_count: int = Field(..., description="좋아요 수")
    published_at: str = Field(..., description="작성 날짜 (ISO 8601)")
    reply_count: int = Field(..., description="답글 수")

    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=to_camel,
    )


class CommentListResponse(BaseModel):
    """YouTube 댓글 목록 응답 스키마"""

    video_id: str = Field(..., description="YouTube 영상 ID")
    comments: List[Comment] = Field(..., description="댓글 목록")
    total_comments: int = Field(..., description="총 댓글 수")

    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=to_camel,
    )


class ChannelDetail(BaseModel):
    """YouTube 채널 상세 정보 스키마"""

    channel_id: str = Field(..., description="채널 ID")
    title: str = Field(..., description="채널 이름")
    description: str = Field(..., description="채널 설명")
    custom_url: Optional[str] = Field(None, description="커스텀 URL")
    published_at: str = Field(..., description="채널 생성 날짜 (ISO 8601)")
    thumbnail_url: Optional[str] = Field(None, description="프로필 이미지 URL")
    subscriber_count: int = Field(..., description="구독자 수")
    video_count: int = Field(..., description="총 영상 수")
    view_count: int = Field(..., description="누적 조회수")
    keywords: Optional[str] = Field(None, description="채널 키워드")
    country: Optional[str] = Field(None, description="국가")

    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=to_camel,
    )


class TranscriptSegment(BaseModel):
    """YouTube 자막 세그먼트 스키마"""

    text: str = Field(..., description="자막 텍스트")
    start: float = Field(..., description="시작 시간 (초)")
    duration: float = Field(..., description="지속 시간 (초)")

    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=to_camel,
    )


class TranscriptResponse(BaseModel):
    """YouTube 자막 응답 스키마"""

    video_id: str = Field(..., description="YouTube 영상 ID")
    language: str = Field(..., description="자막 언어")
    segments: List[TranscriptSegment] = Field(..., description="자막 세그먼트 목록")
    full_text: str = Field(..., description="전체 자막 텍스트")

    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=to_camel,
    )


class AvailableTranscript(BaseModel):
    """사용 가능한 자막 정보 스키마"""

    language: str = Field(..., description="언어 이름")
    language_code: str = Field(..., description="언어 코드")
    is_generated: bool = Field(..., description="자동 생성 여부")

    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=to_camel,
    )


class AvailableTranscriptsResponse(BaseModel):
    """사용 가능한 자막 목록 응답 스키마"""

    video_id: str = Field(..., description="YouTube 영상 ID")
    transcripts: List[AvailableTranscript] = Field(..., description="자막 목록")

    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=to_camel,
    )
