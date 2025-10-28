"""
Logging middleware for ClipPilot API
Logs all API requests and responses with structured logging
"""

import json
import logging
import time
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

# Configure logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger("clippilot.api")


class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Logging middleware for structured request/response logging
    """

    async def dispatch(
        self,
        request: Request,
        call_next: Callable,
    ) -> Response:
        """
        Log request and response

        Args:
            request: FastAPI request
            call_next: Next middleware in chain

        Returns:
            Response
        """
        # Generate request ID
        request_id = self._generate_request_id()

        # Start timer
        start_time = time.time()

        # Extract request info
        request_info = {
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "query_params": dict(request.query_params),
            "client_host": request.client.host if request.client else None,
            "user_agent": request.headers.get("user-agent"),
        }

        # Add user ID if available
        if hasattr(request.state, "user_id"):
            request_info["user_id"] = request.state.user_id

        # Log request
        logger.info(
            f"Request started: {request.method} {request.url.path}",
            extra=request_info,
        )

        # Process request
        try:
            response = await call_next(request)

            # Calculate duration
            duration_ms = (time.time() - start_time) * 1000

            # Log response
            response_info = {
                **request_info,
                "status_code": response.status_code,
                "duration_ms": round(duration_ms, 2),
            }

            logger.info(
                f"Request completed: {request.method} {request.url.path} "
                f"[{response.status_code}] ({duration_ms:.2f}ms)",
                extra=response_info,
            )

            # Add custom headers
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Response-Time"] = f"{duration_ms:.2f}ms"

            return response

        except Exception as exc:
            # Calculate duration
            duration_ms = (time.time() - start_time) * 1000

            # Log error
            error_info = {
                **request_info,
                "error": str(exc),
                "error_type": type(exc).__name__,
                "duration_ms": round(duration_ms, 2),
            }

            logger.error(
                f"Request failed: {request.method} {request.url.path} "
                f"[{type(exc).__name__}] ({duration_ms:.2f}ms)",
                extra=error_info,
                exc_info=True,
            )

            # Re-raise exception to be handled by error handler middleware
            raise

    def _generate_request_id(self) -> str:
        """
        Generate unique request ID

        Returns:
            Request ID string
        """
        import uuid

        return str(uuid.uuid4())


# Structured logging helper
def log_event(
    event_type: str,
    message: str,
    level: str = "info",
    **kwargs,
):
    """
    Log structured event

    Args:
        event_type: Event type (e.g., "job_created", "payment_received")
        message: Human-readable message
        level: Log level (debug, info, warning, error, critical)
        **kwargs: Additional structured data
    """
    log_data = {
        "event_type": event_type,
        "message": message,
        **kwargs,
    }

    log_func = getattr(logger, level.lower(), logger.info)
    log_func(message, extra=log_data)


# Security logging
def log_security_event(
    event_type: str,
    message: str,
    user_id: str = None,
    ip_address: str = None,
    **kwargs,
):
    """
    Log security-related event

    Args:
        event_type: Security event type (e.g., "auth_failed", "token_expired")
        message: Human-readable message
        user_id: User ID involved
        ip_address: Client IP address
        **kwargs: Additional structured data
    """
    security_logger = logging.getLogger("clippilot.security")

    log_data = {
        "event_type": event_type,
        "user_id": user_id,
        "ip_address": ip_address,
        **kwargs,
    }

    security_logger.warning(message, extra=log_data)
