"""
Admin API endpoints for ClipPilot
Handles OAuth configuration and other admin tasks
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.middleware.auth import get_admin_user
from src.models.oauth_config import OAuthConfig
from src.models.user import User

router = APIRouter(prefix="/admin", tags=["admin"])


class YouTubeOAuthRequest(BaseModel):
    """Request model for YouTube OAuth configuration"""

    client_id: str
    client_secret: str
    redirect_uri: str


class YouTubeOAuthResponse(BaseModel):
    """Response model for YouTube OAuth configuration"""

    id: str
    provider: str
    client_id: str
    redirect_uri: str
    is_active: bool
    created_at: str
    updated_at: str


@router.post(
    "/oauth/youtube",
    response_model=YouTubeOAuthResponse,
    summary="YouTube OAuth 설정 저장",
    description="YouTube OAuth 클라이언트 정보를 데이터베이스에 저장합니다",
)
async def save_youtube_oauth_config(
    request: YouTubeOAuthRequest,
    admin_user: Annotated[User, Depends(get_admin_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> YouTubeOAuthResponse:
    """
    Save YouTube OAuth configuration to database.

    Args:
        request: OAuth configuration data
        admin_user: Currently authenticated admin user
        db: Database session

    Returns:
        YouTubeOAuthResponse: Saved OAuth configuration

    Raises:
        HTTPException: If user is not admin or save fails
    """

    # Check if config already exists
    from sqlalchemy import select

    result = await db.execute(
        select(OAuthConfig).where(
            OAuthConfig.provider == "youtube", OAuthConfig.is_active == True
        )
    )
    existing_config = result.scalar_one_or_none()

    if existing_config:
        # Update existing config
        existing_config.client_id = request.client_id
        # TODO: Encrypt client_secret with pgcrypto
        existing_config.client_secret_encrypted = request.client_secret
        existing_config.redirect_uri = request.redirect_uri
        await db.commit()
        await db.refresh(existing_config)
        config = existing_config
    else:
        # Create new config
        config = OAuthConfig(
            provider="youtube",
            client_id=request.client_id,
            # TODO: Encrypt client_secret with pgcrypto
            client_secret_encrypted=request.client_secret,
            redirect_uri=request.redirect_uri,
            is_active=True,
        )
        db.add(config)
        await db.commit()
        await db.refresh(config)

    return YouTubeOAuthResponse(
        id=str(config.id),
        provider=config.provider,
        client_id=config.client_id,
        redirect_uri=config.redirect_uri,
        is_active=config.is_active,
        created_at=config.created_at.isoformat(),
        updated_at=config.updated_at.isoformat(),
    )


@router.get(
    "/oauth/youtube",
    response_model=YouTubeOAuthResponse,
    summary="YouTube OAuth 설정 조회",
    description="저장된 YouTube OAuth 설정을 조회합니다",
)
async def get_youtube_oauth_config(
    admin_user: Annotated[User, Depends(get_admin_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> YouTubeOAuthResponse:
    """
    Get YouTube OAuth configuration from database.

    Args:
        admin_user: Currently authenticated admin user
        db: Database session

    Returns:
        YouTubeOAuthResponse: OAuth configuration

    Raises:
        HTTPException: If config not found or user is not admin
    """
    from sqlalchemy import select

    result = await db.execute(
        select(OAuthConfig).where(
            OAuthConfig.provider == "youtube", OAuthConfig.is_active == True
        )
    )
    config = result.scalar_one_or_none()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": "OAuth 설정을 찾을 수 없습니다."}},
        )

    return YouTubeOAuthResponse(
        id=str(config.id),
        provider=config.provider,
        client_id=config.client_id,
        redirect_uri=config.redirect_uri,
        is_active=config.is_active,
        created_at=config.created_at.isoformat(),
        updated_at=config.updated_at.isoformat(),
    )
