"""
Error handler middleware for ClipPilot API
Provides standardized error responses (FR-030)
"""

import logging
import traceback
from typing import Union

from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from src.schemas.base import ErrorCode

logger = logging.getLogger("clippilot.api")


# Custom exceptions
class ClipPilotException(Exception):
    """Base exception for ClipPilot application"""

    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        details: dict = None,
    ):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(message)


class AuthenticationError(ClipPilotException):
    """Authentication failed"""

    def __init__(self, message: str = "인증에 실패했습니다"):
        super().__init__(
            code=ErrorCode.UNAUTHORIZED,
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
        )


class AuthorizationError(ClipPilotException):
    """Authorization failed"""

    def __init__(self, message: str = "권한이 없습니다"):
        super().__init__(
            code=ErrorCode.FORBIDDEN,
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
        )


class NotFoundError(ClipPilotException):
    """Resource not found"""

    def __init__(self, resource: str = "리소스"):
        super().__init__(
            code=ErrorCode.NOT_FOUND,
            message=f"{resource}를 찾을 수 없습니다",
            status_code=status.HTTP_404_NOT_FOUND,
        )


class QuotaExceededError(ClipPilotException):
    """Usage quota exceeded"""

    def __init__(
        self,
        message: str = "월간 사용 한도를 초과했습니다",
        details: dict = None,
    ):
        super().__init__(
            code=ErrorCode.QUOTA_EXCEEDED,
            message=message,
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            details=details,
        )


class ExternalAPIError(ClipPilotException):
    """External API error"""

    def __init__(
        self,
        service: str,
        message: str = None,
        details: dict = None,
    ):
        super().__init__(
            code=ErrorCode.EXTERNAL_API_ERROR,
            message=message or f"{service} API 호출에 실패했습니다",
            status_code=status.HTTP_502_BAD_GATEWAY,
            details=details,
        )


# Error handlers
async def clippilot_exception_handler(
    request: Request,
    exc: ClipPilotException,
) -> JSONResponse:
    """
    Handle ClipPilot custom exceptions

    Args:
        request: FastAPI request
        exc: ClipPilot exception

    Returns:
        JSON response with standardized error format
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
            }
        },
    )


async def http_exception_handler(
    request: Request,
    exc: StarletteHTTPException,
) -> JSONResponse:
    """
    Handle HTTP exceptions

    Args:
        request: FastAPI request
        exc: HTTP exception

    Returns:
        JSON response with standardized error format
    """
    # Map status codes to error codes
    error_code_map = {
        401: ErrorCode.UNAUTHORIZED,
        403: ErrorCode.FORBIDDEN,
        404: ErrorCode.NOT_FOUND,
        409: ErrorCode.CONFLICT,
        429: ErrorCode.QUOTA_EXCEEDED,
        500: ErrorCode.INTERNAL_ERROR,
        502: ErrorCode.EXTERNAL_API_ERROR,
        503: ErrorCode.INTERNAL_ERROR,
    }

    # Get error message
    if isinstance(exc.detail, dict) and "error" in exc.detail:
        # Already formatted error
        return JSONResponse(
            status_code=exc.status_code,
            content=exc.detail,
        )

    # Format error
    error_code = error_code_map.get(exc.status_code, ErrorCode.INTERNAL_ERROR)
    message = exc.detail if isinstance(exc.detail, str) else str(exc.detail)

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": error_code,
                "message": message,
            }
        },
    )


async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    """
    Handle request validation errors

    Args:
        request: FastAPI request
        exc: Validation error

    Returns:
        JSON response with standardized error format
    """
    # Extract validation errors
    errors = []
    for error in exc.errors():
        field = ".".join(str(loc) for loc in error["loc"][1:])  # Skip 'body'
        errors.append({
            "field": field,
            "message": error["msg"],
            "type": error["type"],
        })

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": ErrorCode.INVALID_INPUT,
                "message": "입력 값이 유효하지 않습니다",
                "details": {"errors": errors},
            }
        },
    )


async def unhandled_exception_handler(
    request: Request,
    exc: Exception,
) -> JSONResponse:
    """
    Handle unhandled exceptions

    Args:
        request: FastAPI request
        exc: Exception

    Returns:
        JSON response with standardized error format
    """
    # Log full traceback
    logger.error(
        f"Unhandled exception: {type(exc).__name__}: {str(exc)}",
        extra={
            "path": request.url.path,
            "method": request.method,
            "traceback": traceback.format_exc(),
        },
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": ErrorCode.INTERNAL_ERROR,
                "message": "서버 내부 오류가 발생했습니다",
            }
        },
    )
