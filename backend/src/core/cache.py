"""
Redis 캐시 서비스

YouTube API 응답 및 기타 데이터를 캐싱하기 위한 Redis 서비스를 제공합니다.
"""

import redis
import json
import logging
from typing import Any, Optional
from src.config import settings

logger = logging.getLogger(__name__)


class CacheService:
    """Redis 캐시 서비스"""

    def __init__(self, redis_url: str = None):
        """
        캐시 서비스 초기화

        Args:
            redis_url: Redis 연결 URL (기본값: settings.REDIS_URL)
        """
        self.redis_url = redis_url or settings.REDIS_URL
        self._client = None

    @property
    def client(self) -> redis.Redis:
        """Redis 클라이언트 인스턴스 (lazy loading)"""
        if self._client is None:
            try:
                self._client = redis.from_url(
                    self.redis_url,
                    decode_responses=True,
                    encoding='utf-8'
                )
                # 연결 테스트
                self._client.ping()
                logger.info("Redis 연결 성공")
            except redis.ConnectionError as e:
                logger.error(f"Redis 연결 실패: {str(e)}")
                raise
        return self._client

    def get(self, key: str) -> Optional[Any]:
        """
        캐시에서 값 조회

        Args:
            key: 캐시 키

        Returns:
            Optional[Any]: 캐시된 값 (없으면 None)
        """
        try:
            value = self.client.get(key)
            if value is None:
                return None

            # JSON 디코딩 시도
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                # JSON이 아닌 경우 문자열 그대로 반환
                return value
        except redis.RedisError as e:
            logger.error(f"캐시 조회 실패 (key={key}): {str(e)}")
            return None

    def set(
        self,
        key: str,
        value: Any,
        ttl: int = None
    ) -> bool:
        """
        캐시에 값 저장

        Args:
            key: 캐시 키
            value: 저장할 값
            ttl: 만료 시간 (초, None이면 만료되지 않음)

        Returns:
            bool: 저장 성공 여부
        """
        try:
            # 딕셔너리나 리스트는 JSON으로 직렬화
            if isinstance(value, (dict, list)):
                value = json.dumps(value, ensure_ascii=False)

            if ttl:
                self.client.setex(key, ttl, value)
            else:
                self.client.set(key, value)

            logger.debug(f"캐시 저장 성공 (key={key}, ttl={ttl})")
            return True
        except redis.RedisError as e:
            logger.error(f"캐시 저장 실패 (key={key}): {str(e)}")
            return False

    def delete(self, key: str) -> bool:
        """
        캐시에서 값 삭제

        Args:
            key: 캐시 키

        Returns:
            bool: 삭제 성공 여부
        """
        try:
            result = self.client.delete(key)
            logger.debug(f"캐시 삭제 (key={key}, deleted={result})")
            return result > 0
        except redis.RedisError as e:
            logger.error(f"캐시 삭제 실패 (key={key}): {str(e)}")
            return False

    def exists(self, key: str) -> bool:
        """
        캐시 키 존재 여부 확인

        Args:
            key: 캐시 키

        Returns:
            bool: 존재 여부
        """
        try:
            return self.client.exists(key) > 0
        except redis.RedisError as e:
            logger.error(f"캐시 존재 확인 실패 (key={key}): {str(e)}")
            return False

    def clear_pattern(self, pattern: str) -> int:
        """
        패턴과 일치하는 모든 캐시 키 삭제

        Args:
            pattern: 삭제할 키 패턴 (예: "youtube:search:*")

        Returns:
            int: 삭제된 키 개수
        """
        try:
            keys = self.client.keys(pattern)
            if keys:
                deleted = self.client.delete(*keys)
                logger.info(f"캐시 패턴 삭제 (pattern={pattern}, deleted={deleted})")
                return deleted
            return 0
        except redis.RedisError as e:
            logger.error(f"캐시 패턴 삭제 실패 (pattern={pattern}): {str(e)}")
            return 0


# 전역 캐시 서비스 인스턴스
cache_service = CacheService()


def get_cache_service() -> CacheService:
    """
    캐시 서비스 인스턴스 반환 (의존성 주입용)

    Returns:
        CacheService: 캐시 서비스
    """
    return cache_service
