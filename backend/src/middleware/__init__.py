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
from .rate_limit import RateLimitMiddleware

__all__ = [
    # Middleware
    "LoggingMiddleware",
    "RateLimitMiddleware",
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
