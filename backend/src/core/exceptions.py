"""
Custom exceptions for ClipPilot
"""

from typing import Optional, Any


class ClipPilotError(Exception):
    """Base exception for ClipPilot"""

    def __init__(self, message: str, code: Optional[str] = None):
        """
        Initialize ClipPilot error

        Args:
            message: Error message (Korean)
            code: Error code for client identification
        """
        self.message = message
        self.code = code or self.__class__.__name__
        super().__init__(self.message)


class AuthenticationError(ClipPilotError):
    """Authentication failed"""

    def __init__(self, message: str = "인증에 실패했습니다"):
        super().__init__(message, code="AUTHENTICATION_ERROR")


class AuthorizationError(ClipPilotError):
    """Authorization failed (insufficient permissions)"""

    def __init__(self, message: str = "권한이 없습니다"):
        super().__init__(message, code="AUTHORIZATION_ERROR")


class ResourceNotFoundError(ClipPilotError):
    """Resource not found"""

    def __init__(self, message: str = "요청한 리소스를 찾을 수 없습니다"):
        super().__init__(message, code="RESOURCE_NOT_FOUND")


class ContentGenerationError(ClipPilotError):
    """Content generation failed"""

    def __init__(self, message: str = "콘텐츠 생성 중 오류가 발생했습니다"):
        super().__init__(message, code="CONTENT_GENERATION_ERROR")


class QuotaExceededError(ClipPilotError):
    """Usage quota exceeded"""

    def __init__(
        self,
        message: str = "월간 사용 한도를 초과했습니다",
        quota_limit: Optional[int] = None,
        quota_used: Optional[int] = None,
        quota_reset_at: Optional[str] = None,
    ):
        """
        Initialize quota exceeded error

        Args:
            message: Error message
            quota_limit: Monthly quota limit
            quota_used: Current usage
            quota_reset_at: When quota resets (ISO format)
        """
        super().__init__(message, code="QUOTA_EXCEEDED")
        self.quota_limit = quota_limit
        self.quota_used = quota_used
        self.quota_reset_at = quota_reset_at


class ValidationError(ClipPilotError):
    """Request validation failed"""

    def __init__(self, message: str = "요청 데이터가 유효하지 않습니다"):
        super().__init__(message, code="VALIDATION_ERROR")


class RateLimitError(ClipPilotError):
    """Rate limit exceeded"""

    def __init__(self, message: str = "요청 속도 제한을 초과했습니다", retry_after: Optional[int] = None):
        """
        Initialize rate limit error

        Args:
            message: Error message
            retry_after: Seconds until retry is allowed
        """
        super().__init__(message, code="RATE_LIMIT_ERROR")
        self.retry_after = retry_after


class ExternalAPIError(ClipPilotError):
    """External API call failed"""

    def __init__(self, message: str = "외부 API 호출 중 오류가 발생했습니다", service: Optional[str] = None):
        """
        Initialize external API error

        Args:
            message: Error message
            service: External service name (e.g., "OpenAI", "YouTube")
        """
        super().__init__(message, code="EXTERNAL_API_ERROR")
        self.service = service


class ChannelOwnershipError(ClipPilotError):
    """User does not own the channel"""

    def __init__(self, message: str = "해당 채널에 대한 권한이 없습니다"):
        super().__init__(message, code="CHANNEL_OWNERSHIP_ERROR")


class TokenExpiredError(ClipPilotError):
    """OAuth token expired"""

    def __init__(self, message: str = "인증 토큰이 만료되었습니다. 다시 인증해주세요"):
        super().__init__(message, code="TOKEN_EXPIRED_ERROR")
