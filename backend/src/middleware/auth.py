"""
Authentication middleware for ClipPilot API
Handles JWT verification and user injection into requests
"""

from typing import Optional
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from ..core.supabase import get_supabase
from ..models.user import User
from ..core.database import get_db


security = HTTPBearer()


class AuthMiddleware:
    """Middleware for handling authentication"""

    def __init__(self):
        self.supabase = get_supabase()

    async def verify_token(
        self, credentials: HTTPAuthorizationCredentials = Depends(security)
    ) -> dict:
        """
        Verify JWT token and extract user info

        Args:
            credentials: HTTP Bearer credentials

        Returns:
            User info dict from token

        Raises:
            HTTPException: If token is invalid or expired
        """
        if not credentials:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "error": {
                        "code": "UNAUTHORIZED",
                        "message": "인증이 필요합니다",
                    }
                },
            )

        token = credentials.credentials

        try:
            # Verify token with Supabase
            user_info = await self.supabase.verify_token(token)

            if not user_info:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail={
                        "error": {
                            "code": "INVALID_TOKEN",
                            "message": "유효하지 않은 인증 토큰입니다",
                        }
                    },
                )

            return user_info

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "error": {
                        "code": "TOKEN_EXPIRED",
                        "message": "인증 토큰이 만료되었습니다",
                    }
                },
            )


# Global auth middleware instance
auth_middleware = AuthMiddleware()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """
    Get current authenticated user from JWT token

    This is the main dependency for protected endpoints.
    Injects the authenticated User model into the request.

    Args:
        credentials: HTTP Bearer credentials
        db: Database session

    Returns:
        User model instance

    Raises:
        HTTPException: If authentication fails or user not found
    """
    # Verify token
    user_info = await auth_middleware.verify_token(credentials)

    # Get user from database
    user_id = UUID(user_info["id"])
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "NOT_FOUND",
                    "message": "사용자를 찾을 수 없습니다",
                }
            },
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": {
                    "code": "FORBIDDEN",
                    "message": "비활성화된 계정입니다",
                }
            },
        )

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Get current active user (convenience wrapper)

    Args:
        current_user: Current authenticated user

    Returns:
        User model instance

    Raises:
        HTTPException: If user is not active
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": {
                    "code": "FORBIDDEN",
                    "message": "비활성화된 계정입니다",
                }
            },
        )

    return current_user


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(
        HTTPBearer(auto_error=False)
    ),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """
    Get current user if authenticated, None otherwise

    Useful for endpoints that work both authenticated and unauthenticated

    Args:
        credentials: Optional HTTP Bearer credentials
        db: Database session

    Returns:
        User model instance if authenticated, None otherwise
    """
    if not credentials:
        return None

    try:
        user_info = await auth_middleware.verify_token(credentials)
        user_id = UUID(user_info["id"])
        user = db.query(User).filter(User.id == user_id).first()
        return user if user and user.is_active else None
    except Exception:
        return None
