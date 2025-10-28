"""
Redis connection pool for ClipPilot backend
Used for caching, rate limiting, and Celery message broker
"""

import os
from typing import Any, Optional

import redis.asyncio as aioredis
from redis import Redis


class RedisClient:
    """Wrapper for Redis with connection pooling"""

    def __init__(self):
        """Initialize Redis client"""
        self.url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

        # Parse connection parameters
        self.host = os.getenv("REDIS_HOST", "localhost")
        self.port = int(os.getenv("REDIS_PORT", "6379"))
        self.db = int(os.getenv("REDIS_DB", "0"))
        self.password = os.getenv("REDIS_PASSWORD")

        # Connection pool settings
        self.max_connections = int(os.getenv("REDIS_MAX_CONNECTIONS", "10"))

        # Synchronous client (for Celery)
        self._sync_client: Optional[Redis] = None

        # Asynchronous client (for FastAPI)
        self._async_client: Optional[aioredis.Redis] = None

    @property
    def sync(self) -> Redis:
        """Get synchronous Redis client"""
        if self._sync_client is None:
            self._sync_client = Redis(
                host=self.host,
                port=self.port,
                db=self.db,
                password=self.password,
                decode_responses=True,
                max_connections=self.max_connections,
            )

        return self._sync_client

    async def get_async(self) -> aioredis.Redis:
        """Get asynchronous Redis client"""
        if self._async_client is None:
            self._async_client = aioredis.from_url(
                self.url,
                decode_responses=True,
                max_connections=self.max_connections,
            )

        return self._async_client

    async def close(self):
        """Close Redis connections"""
        if self._async_client:
            await self._async_client.close()

        if self._sync_client:
            self._sync_client.close()

    # Cache helpers
    async def get_cache(self, key: str) -> Optional[str]:
        """
        Get cached value

        Args:
            key: Cache key

        Returns:
            Cached value or None
        """
        client = await self.get_async()
        return await client.get(key)

    async def set_cache(
        self,
        key: str,
        value: str,
        ttl: int = 3600,
    ) -> bool:
        """
        Set cache value

        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds (default: 1 hour)

        Returns:
            True if successful
        """
        client = await self.get_async()
        return await client.setex(key, ttl, value)

    async def delete_cache(self, key: str) -> int:
        """
        Delete cached value

        Args:
            key: Cache key

        Returns:
            Number of keys deleted
        """
        client = await self.get_async()
        return await client.delete(key)

    async def delete_pattern(self, pattern: str) -> int:
        """
        Delete all keys matching pattern

        Args:
            pattern: Key pattern (e.g., "user:123:*")

        Returns:
            Number of keys deleted
        """
        client = await self.get_async()
        keys = await client.keys(pattern)

        if keys:
            return await client.delete(*keys)

        return 0

    # Rate limiting helpers
    async def check_rate_limit(
        self,
        key: str,
        limit: int,
        window: int,
    ) -> tuple[bool, int, int]:
        """
        Check rate limit using sliding window

        Args:
            key: Rate limit key (e.g., "ratelimit:user:123")
            limit: Maximum requests allowed
            window: Time window in seconds

        Returns:
            Tuple of (allowed, current_count, remaining)
        """
        client = await self.get_async()

        # Increment counter
        count = await client.incr(key)

        # Set expiry on first request
        if count == 1:
            await client.expire(key, window)

        remaining = max(0, limit - count)
        allowed = count <= limit

        return allowed, count, remaining

    async def reset_rate_limit(self, key: str) -> bool:
        """
        Reset rate limit counter

        Args:
            key: Rate limit key

        Returns:
            True if deleted
        """
        client = await self.get_async()
        deleted = await client.delete(key)
        return deleted > 0

    # Queue helpers (for Celery integration)
    def push_to_queue(
        self,
        queue_name: str,
        data: Any,
    ) -> int:
        """
        Push data to Redis queue

        Args:
            queue_name: Queue name
            data: Data to push

        Returns:
            New queue length
        """
        return self.sync.rpush(queue_name, data)

    def pop_from_queue(
        self,
        queue_name: str,
        timeout: int = 0,
    ) -> Optional[str]:
        """
        Pop data from Redis queue (blocking)

        Args:
            queue_name: Queue name
            timeout: Block timeout in seconds (0 = infinite)

        Returns:
            Data or None
        """
        result = self.sync.blpop(queue_name, timeout=timeout)
        return result[1] if result else None

    def get_queue_length(self, queue_name: str) -> int:
        """
        Get queue length

        Args:
            queue_name: Queue name

        Returns:
            Number of items in queue
        """
        return self.sync.llen(queue_name)


# Global Redis client instance
_redis_client: Optional[RedisClient] = None


def get_redis() -> RedisClient:
    """
    Get or create global Redis client instance

    Returns:
        RedisClient instance
    """
    global _redis_client

    if _redis_client is None:
        _redis_client = RedisClient()

    return _redis_client
