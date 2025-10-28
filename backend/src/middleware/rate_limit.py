"""
Rate limiting middleware for ClipPilot API
Implements per-user rate limiting: 60 requests per minute (NFR-017)
"""

from typing import Optional

from fastapi import HTTPException, Request, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from src.core.redis_client import get_redis


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware using Redis
    Limits: 60 requests per minute per user
    """

    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.window_seconds = 60  # 1 minute window

    async def dispatch(self, request: Request, call_next) -> Response:
        """
        Process request with rate limiting

        Args:
            request: FastAPI request
            call_next: Next middleware in chain

        Returns:
            Response

        Raises:
            HTTPException: 429 if rate limit exceeded
        """
        # Skip rate limiting for health check and docs
        if request.url.path in ["/", "/health", "/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)

        # Get user identifier
        user_id = self._get_user_id(request)

        if not user_id:
            # No user ID, skip rate limiting (handled by auth middleware)
            return await call_next(request)

        # Check rate limit
        redis_client = get_redis()
        key = f"ratelimit:{user_id}"

        allowed, current, remaining = await redis_client.check_rate_limit(
            key=key,
            limit=self.requests_per_minute,
            window=self.window_seconds,
        )

        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": "요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.",
                        "details": {
                            "limit": self.requests_per_minute,
                            "window": "1 minute",
                            "current": current,
                        },
                    }
                },
            )

        # Process request
        response = await call_next(request)

        # Add rate limit headers
        response.headers["X-RateLimit-Limit"] = str(self.requests_per_minute)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Window"] = str(self.window_seconds)

        return response

    def _get_user_id(self, request: Request) -> Optional[str]:
        """
        Extract user ID from request

        Args:
            request: FastAPI request

        Returns:
            User ID or None
        """
        # Try to get user ID from request state (set by auth middleware)
        if hasattr(request.state, "user_id"):
            return request.state.user_id

        # Fallback to IP address for unauthenticated requests
        if request.client and request.client.host:
            return f"ip:{request.client.host}"

        return None
