"""
YouTube channel management endpoints.
"""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...core.youtube import (
    ChannelOwnershipError,
    InvalidOAuthStateError,
    TokenExchangeError,
    TokenRefreshError,
    YouTubeService,
    YouTubeServiceError,
)
from ...middleware.auth import get_current_active_user
from ...models import Channel, User
from ...schemas import ChannelResponse, ErrorCode


router = APIRouter(prefix="/channels", tags=["channels"])


def _serialize_channel(channel: Channel) -> ChannelResponse:
    """Convert Channel ORM model to response schema."""
    return ChannelResponse.model_validate(
        {
            "id": channel.id,
            "user_id": channel.user_id,
            "yt_channel_id": channel.yt_channel_id,
            "channel_name": channel.channel_name,
            "channel_thumbnail": channel.channel_thumbnail,
            "token_expires_at": channel.token_expires_at,
            "is_active": channel.is_active,
            "created_at": channel.created_at,
            "updated_at": channel.updated_at,
            "requires_reauth": YouTubeService.channel_requires_reauth(channel),
        }
    )


@router.get(
    "/oauth/youtube",
    status_code=status.HTTP_302_FOUND,
    summary="YouTube OAuth 시작 (FR-012)",
    description="Google OAuth 인증 페이지로 리디렉션합니다.",
)
async def start_youtube_oauth(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> RedirectResponse | JSONResponse:
    """Start Google OAuth flow for YouTube channel linking."""
    service = YouTubeService(db)
    authorization_url = service.get_authorization_url(current_user.id)
    accept_header = request.headers.get("accept", "")

    if "application/json" in accept_header:
        return JSONResponse(
            {"authorization_url": authorization_url},
            status_code=status.HTTP_200_OK,
        )

    return RedirectResponse(url=authorization_url, status_code=status.HTTP_302_FOUND)


@router.get(
    "/oauth/youtube/callback",
    status_code=status.HTTP_302_FOUND,
    summary="YouTube OAuth 콜백 (FR-012)",
    description="OAuth 인증 완료 후 채널 정보를 저장합니다.",
)
async def youtube_oauth_callback(
    code: str | None = None,
    state: str | None = None,
    db: Session = Depends(get_db),
) -> RedirectResponse:
    """Handle Google OAuth callback."""
    service = YouTubeService(db)

    if not code or not state:
        return RedirectResponse(service.error_redirect, status_code=status.HTTP_302_FOUND)

    try:
        user_id = service.validate_state(state)
    except InvalidOAuthStateError:
        return RedirectResponse(service.error_redirect, status_code=status.HTTP_302_FOUND)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return RedirectResponse(service.error_redirect, status_code=status.HTTP_302_FOUND)

    try:
        await service.link_channel(user, code)
    except ChannelOwnershipError:
        return RedirectResponse(
            f"{service.error_redirect}&reason=ownership",
            status_code=status.HTTP_302_FOUND,
        )
    except (TokenExchangeError, YouTubeServiceError):
        return RedirectResponse(
            f"{service.error_redirect}&reason=token",
            status_code=status.HTTP_302_FOUND,
        )

    return RedirectResponse(service.success_redirect, status_code=status.HTTP_302_FOUND)


@router.get(
    "",
    response_model=list[ChannelResponse],
    summary="연결된 채널 목록 조회",
    description="현재 사용자 계정에 연결된 YouTube 채널을 반환합니다.",
)
async def list_channels(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> list[ChannelResponse]:
    """List current user's channels. Automatically refresh tokens when possible."""
    service = YouTubeService(db)
    channels = service.list_channels(current_user)

    refreshed: list[Channel] = []
    for channel in channels:
        try:
            channel = await service.ensure_valid_channel(channel)
        except TokenRefreshError:
            channel.mark_inactive()
            db.add(channel)
            db.commit()
        refreshed.append(channel)

    return [_serialize_channel(channel) for channel in refreshed]


@router.delete(
    "/{channel_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="채널 연결 해제",
    description="지정된 채널 연결을 삭제합니다.",
)
async def delete_channel(
    channel_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Response:
    """Delete a channel connection."""
    channel = (
        db.query(Channel)
        .filter(Channel.id == channel_id, Channel.user_id == current_user.id)
        .first()
    )

    if not channel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": ErrorCode.NOT_FOUND,
                    "message": "채널을 찾을 수 없습니다.",
                }
            },
        )

    service = YouTubeService(db)
    service.delete_channel(current_user, channel_id)

    return Response(status_code=status.HTTP_204_NO_CONTENT)
