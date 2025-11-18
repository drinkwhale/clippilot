"""
YouTube 유틸리티 함수

YouTube API 관련 유틸리티 함수를 제공합니다.
"""

import re
from datetime import timedelta
from typing import Optional
import logging

logger = logging.getLogger(__name__)


def parse_iso8601_duration(duration_str: str) -> int:
    """
    ISO 8601 duration 문자열을 초(seconds)로 변환

    YouTube API는 영상 길이를 ISO 8601 duration 형식으로 반환합니다.
    예: PT1M30S → 90초, PT1H2M10S → 3730초

    Args:
        duration_str: ISO 8601 duration 문자열 (예: PT1M30S)

    Returns:
        int: 총 초(seconds)

    Examples:
        >>> parse_iso8601_duration("PT1M30S")
        90
        >>> parse_iso8601_duration("PT1H2M10S")
        3730
        >>> parse_iso8601_duration("PT30S")
        30
        >>> parse_iso8601_duration("PT2H")
        7200
    """
    if not duration_str or not duration_str.startswith('PT'):
        logger.warning(f"Invalid ISO 8601 duration format: {duration_str}")
        return 0

    # PT 제거
    duration_str = duration_str[2:]

    # 정규식 패턴
    # H: 시간, M: 분, S: 초
    pattern = r'(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?'
    match = re.match(pattern, duration_str)

    if not match:
        logger.warning(f"Failed to parse ISO 8601 duration: PT{duration_str}")
        return 0

    hours = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    seconds = int(match.group(3) or 0)

    total_seconds = hours * 3600 + minutes * 60 + seconds

    return total_seconds


def format_duration(seconds: int) -> str:
    """
    초(seconds)를 사람이 읽기 쉬운 형식으로 변환

    Args:
        seconds: 총 초

    Returns:
        str: 포맷팅된 시간 문자열

    Examples:
        >>> format_duration(90)
        "1:30"
        >>> format_duration(3730)
        "1:02:10"
        >>> format_duration(30)
        "0:30"
    """
    if seconds < 0:
        return "0:00"

    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    secs = seconds % 60

    if hours > 0:
        return f"{hours}:{minutes:02d}:{secs:02d}"
    else:
        return f"{minutes}:{secs:02d}"


def is_shorts_video(duration_seconds: int) -> bool:
    """
    영상 길이가 쇼츠 영상 기준(60초 이하)인지 확인

    Args:
        duration_seconds: 영상 길이 (초)

    Returns:
        bool: 쇼츠 영상 여부
    """
    return duration_seconds <= 60


def parse_view_count(view_count_str: str) -> Optional[int]:
    """
    조회수 문자열을 숫자로 변환

    Args:
        view_count_str: 조회수 문자열

    Returns:
        Optional[int]: 조회수 숫자 (파싱 실패 시 None)
    """
    try:
        return int(view_count_str.replace(',', ''))
    except (ValueError, AttributeError):
        logger.warning(f"Failed to parse view count: {view_count_str}")
        return None


def format_view_count(count: int) -> str:
    """
    조회수를 사람이 읽기 쉬운 형식으로 변환

    Args:
        count: 조회수

    Returns:
        str: 포맷팅된 조회수

    Examples:
        >>> format_view_count(1234)
        "1.2K"
        >>> format_view_count(1234567)
        "1.2M"
        >>> format_view_count(123)
        "123"
    """
    if count < 1000:
        return str(count)
    elif count < 1_000_000:
        return f"{count / 1000:.1f}K"
    elif count < 1_000_000_000:
        return f"{count / 1_000_000:.1f}M"
    else:
        return f"{count / 1_000_000_000:.1f}B"


def get_video_id_from_url(url: str) -> Optional[str]:
    """
    YouTube URL에서 video ID 추출

    Args:
        url: YouTube URL

    Returns:
        Optional[str]: Video ID (추출 실패 시 None)

    Examples:
        >>> get_video_id_from_url("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
        "dQw4w9WgXcQ"
        >>> get_video_id_from_url("https://youtu.be/dQw4w9WgXcQ")
        "dQw4w9WgXcQ"
    """
    # 정규식 패턴
    patterns = [
        r'(?:youtube\.com/watch\?v=)([\w-]+)',
        r'(?:youtu\.be/)([\w-]+)',
        r'(?:youtube\.com/embed/)([\w-]+)',
    ]

    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)

    logger.warning(f"Failed to extract video ID from URL: {url}")
    return None


def build_cache_key(prefix: str, **kwargs) -> str:
    """
    캐시 키 생성 헬퍼 함수

    Args:
        prefix: 캐시 키 접두사
        **kwargs: 캐시 키에 포함할 파라미터

    Returns:
        str: 캐시 키

    Examples:
        >>> build_cache_key("youtube:search", query="react", max_results=25)
        "youtube:search:query=react:max_results=25"
    """
    key_parts = [prefix]
    for k, v in sorted(kwargs.items()):
        if v is not None:
            key_parts.append(f"{k}={v}")
    return ":".join(key_parts)
