"""YouTube API 스키마 정의"""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, validator


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

    class Config:
        json_schema_extra = {
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


class YouTubeSearchResponse(BaseModel):
    """YouTube 검색 응답 스키마"""

    results: List[YouTubeSearchResult] = Field(..., description="검색 결과 목록")
    total_results: int = Field(..., description="총 결과 수")
    query: str = Field(..., description="검색 쿼리")

    class Config:
        json_schema_extra = {
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

    class Config:
        json_schema_extra = {
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
