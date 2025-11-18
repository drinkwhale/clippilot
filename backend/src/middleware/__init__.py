"""Middleware for ClipPilot API"""

from .error_handler import (
    AuthenticationError,
    AuthorizationError,
    ClipPilotException,
    ExternalAPIError,
    NotFoundError,
    QuotaExceededError,
    clippilot_exception_handler,
    http_exception_handler,
    unhandled_exception_handler,
    validation_exception_handler,
)
from .logging import LoggingMiddleware, log_event, log_security_event
from .rate_limit import limiter, rate_limit_exceeded_handler, get_limiter

__all__ = [
    # Middleware
    "LoggingMiddleware",
    "limiter",
    "rate_limit_exceeded_handler",
    "get_limiter",
    # Exceptions
    "ClipPilotException",
    "AuthenticationError",
    "AuthorizationError",
    "NotFoundError",
    "QuotaExceededError",
    "ExternalAPIError",
    # Handlers
    "clippilot_exception_handler",
    "http_exception_handler",
    "validation_exception_handler",
    "unhandled_exception_handler",
    # Logging
    "log_event",
    "log_security_event",
]
