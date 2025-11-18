"""
Rate Limiting 미들웨어

slowapi를 사용하여 API 요청 속도를 제한합니다.
YouTube 검색 API: 10 req/min (FR-003)
기타 API: 60 req/min (NFR-017)
"""

from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import JSONResponse
from src.config import settings
import logging

logger = logging.getLogger(__name__)


def get_user_identifier(request: Request) -> str:
    """
    사용자 식별자 반환 (인증된 사용자 ID 또는 IP 주소)

    Args:
        request: FastAPI Request 객체

    Returns:
        str: 사용자 식별자
    """
    # request.state에서 사용자 ID 추출 시도 (auth middleware에서 설정)
    if hasattr(request.state, "user_id"):
        return f"user:{request.state.user_id}"

    # Authorization 헤더에서 사용자 ID 추출 시도
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        return f"token:{token[:20]}"

    # 인증되지 않은 경우 IP 주소 사용
    return f"ip:{get_remote_address(request)}"


# Limiter 인스턴스 생성
limiter = Limiter(
    key_func=get_user_identifier,
    default_limits=["60/minute"],  # 기본 제한: 분당 60 요청
    storage_uri=settings.REDIS_URL,
    strategy="fixed-window",
)


async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """
    Rate Limit 초과 에러 핸들러

    Args:
        request: FastAPI Request 객체
        exc: RateLimitExceeded 예외

    Returns:
        JSONResponse: 에러 응답
    """
    logger.warning(
        f"Rate limit exceeded for {get_user_identifier(request)}: {exc.detail}"
    )

    return JSONResponse(
        status_code=429,
        content={
            "error": {
                "code": "RATE_LIMIT_EXCEEDED",
                "message": "요청 횟수가 제한을 초과했습니다. 잠시 후 다시 시도해주세요.",
                "detail": exc.detail,
            }
        },
        headers={
            "Retry-After": str(exc.retry_after) if hasattr(exc, 'retry_after') else "60",
            "X-RateLimit-Limit": request.headers.get("X-RateLimit-Limit", "60"),
            "X-RateLimit-Remaining": "0",
        },
    )


def get_limiter() -> Limiter:
    """
    Limiter 인스턴스 반환 (의존성 주입용)

    Returns:
        Limiter: Rate limiter
    """
    return limiter
