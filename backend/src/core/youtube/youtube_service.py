"""
YouTube OAuth integration service.

Handles OAuth flow, token storage/refresh, and channel persistence.
"""

from __future__ import annotations

import base64
import hmac
import json
import os
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Iterable, List
from uuid import UUID
from urllib.parse import urlencode

import httpx
from sqlalchemy.orm import Session

from ...models import Channel, User
from ...core.security import TokenEncryptor, EncryptionError


class YouTubeServiceError(Exception):
    """Base class for YouTube service errors."""


class InvalidOAuthStateError(YouTubeServiceError):
    """Raised when OAuth state validation fails."""


class TokenExchangeError(YouTubeServiceError):
    """Raised when exchanging authorization code for tokens fails."""


class TokenRefreshError(YouTubeServiceError):
    """Raised when refreshing access tokens fails."""


class ChannelOwnershipError(YouTubeServiceError):
    """Raised when attempting to connect a channel owned by another user."""


class YouTubeService:
    """Service for managing YouTube OAuth flows and channel persistence."""

    AUTH_BASE_URL = "https://accounts.google.com/o/oauth2/v2/auth"
    TOKEN_URL = "https://oauth2.googleapis.com/token"
    CHANNELS_API_URL = "https://www.googleapis.com/youtube/v3/channels"
    DEFAULT_SCOPES = [
        "https://www.googleapis.com/auth/youtube.upload",
        "https://www.googleapis.com/auth/youtube.readonly",
        "https://www.googleapis.com/auth/youtube.force-ssl",
    ]
    STATE_TTL_SECONDS = 600  # 10 minutes

    def __init__(self, db: Session):
        self.db = db
        self.client_id = os.getenv("GOOGLE_CLIENT_ID")
        self.client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
        self.redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")

        if not all([self.client_id, self.client_secret, self.redirect_uri]):
            raise YouTubeServiceError(
                "GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI must be set"
            )

        self.scopes: List[str] = self._load_scopes()
        self.encryptor = TokenEncryptor()

        self.state_secret = (
            os.getenv("YOUTUBE_OAUTH_STATE_SECRET")
            or os.getenv(TokenEncryptor.TOKEN_SECRET_ENV)
            or os.getenv(TokenEncryptor.TOKEN_SECRET_FALLBACK_ENV)
        )

        if not self.state_secret:
            raise YouTubeServiceError(
                "YOUTUBE_OAUTH_STATE_SECRET (or token secret) must be configured"
            )

        self.success_redirect = os.getenv(
            "YOUTUBE_OAUTH_SUCCESS_REDIRECT",
            "/dashboard/settings/channels?connected=1",
        )
        self.error_redirect = os.getenv(
            "YOUTUBE_OAUTH_ERROR_REDIRECT",
            "/dashboard/settings/channels?error=oauth_failed",
        )

    def _load_scopes(self) -> List[str]:
        """Load scopes from environment or fallback to defaults."""
        scopes_env = os.getenv("GOOGLE_OAUTH_SCOPES")
        if scopes_env:
            return [scope.strip() for scope in scopes_env.split(",") if scope.strip()]
        return self.DEFAULT_SCOPES

    def generate_state(self, user_id: UUID) -> str:
        """
        Generate an encoded OAuth state parameter containing the user id.

        Args:
            user_id: Initiating user id.

        Returns:
            Encoded state string.
        """
        payload = json.dumps(
            {"user_id": str(user_id), "ts": int(time.time())},
            separators=(",", ":"),
        ).encode("utf-8")

        signature = hmac.new(
            self.state_secret.encode("utf-8"),
            payload,
            digestmod="sha256",
        ).digest()

        return base64.urlsafe_b64encode(payload + signature).decode("utf-8")

    def validate_state(self, state: str) -> UUID:
        """
        Validate the OAuth state and return the embedded user id.

        Raises:
            InvalidOAuthStateError if validation fails.
        """
        try:
            decoded = base64.urlsafe_b64decode(state.encode("utf-8"))
        except (ValueError, TypeError) as exc:
            raise InvalidOAuthStateError("Invalid OAuth state encoding") from exc

        if len(decoded) <= 32:
            raise InvalidOAuthStateError("OAuth state payload is too short")

        payload_bytes, signature = decoded[:-32], decoded[-32:]
        expected = hmac.new(
            self.state_secret.encode("utf-8"),
            payload_bytes,
            digestmod="sha256",
        ).digest()

        if not hmac.compare_digest(signature, expected):
            raise InvalidOAuthStateError("OAuth state signature mismatch")

        try:
            payload = json.loads(payload_bytes.decode("utf-8"))
        except json.JSONDecodeError as exc:
            raise InvalidOAuthStateError("OAuth state payload is not valid JSON") from exc

        timestamp = payload.get("ts")
        if not isinstance(timestamp, int) or time.time() - timestamp > self.STATE_TTL_SECONDS:
            raise InvalidOAuthStateError("OAuth state has expired")

        user_id = payload.get("user_id")
        if not isinstance(user_id, str):
            raise InvalidOAuthStateError("OAuth state missing user_id")

        try:
            return UUID(user_id)
        except ValueError as exc:
            raise InvalidOAuthStateError("OAuth state contains invalid user_id") from exc

    def get_authorization_url(self, user_id: UUID) -> str:
        """Build the Google OAuth authorization URL."""
        state = self.generate_state(user_id)
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "scope": " ".join(self.scopes),
            "access_type": "offline",
            "include_granted_scopes": "true",
            "prompt": "consent",
            "state": state,
        }
        return f"{self.AUTH_BASE_URL}?{urlencode(params)}"

    async def exchange_code_for_tokens(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for tokens."""
        data = {
            "code": code,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "redirect_uri": self.redirect_uri,
            "grant_type": "authorization_code",
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.post(self.TOKEN_URL, data=data)
            except httpx.HTTPError as exc:
                raise TokenExchangeError("Failed to reach Google token endpoint") from exc

        if response.status_code != 200:
            detail = response.text
            raise TokenExchangeError(f"Token exchange failed: {detail}")

        return response.json()

    async def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh access token using a refresh token."""
        data = {
            "refresh_token": refresh_token,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "grant_type": "refresh_token",
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.post(self.TOKEN_URL, data=data)
            except httpx.HTTPError as exc:
                raise TokenRefreshError("Failed to reach Google token endpoint") from exc

        if response.status_code != 200:
            detail = response.text
            raise TokenRefreshError(f"Token refresh failed: {detail}")

        return response.json()

    async def fetch_channel_profile(self, access_token: str) -> Dict[str, Any]:
        """Fetch the authenticated user's channel profile."""
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json",
        }
        params = {
            "part": "id,snippet",
            "mine": "true",
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(
                    self.CHANNELS_API_URL,
                    headers=headers,
                    params=params,
                )
            except httpx.HTTPError as exc:
                raise YouTubeServiceError("Failed to fetch YouTube channel profile") from exc

        if response.status_code != 200:
            detail = response.text
            raise YouTubeServiceError(f"YouTube API error: {detail}")

        data = response.json()
        items = data.get("items") or []
        if not items:
            raise YouTubeServiceError("No YouTube channel found for the authenticated user")

        channel = items[0]
        snippet = channel.get("snippet", {})
        thumbnails = snippet.get("thumbnails", {})
        default_thumb = thumbnails.get("high") or thumbnails.get("medium") or thumbnails.get("default")

        return {
            "yt_channel_id": channel.get("id"),
            "channel_name": snippet.get("title"),
            "channel_thumbnail": (default_thumb or {}).get("url"),
        }

    async def link_channel(self, user: User, code: str) -> Channel:
        """
        Exchange authorization code, fetch channel info, and persist the channel.

        Returns:
            Channel instance.
        """
        token_response = await self.exchange_code_for_tokens(code)
        access_token = token_response.get("access_token")
        refresh_token = token_response.get("refresh_token")
        expires_in = int(token_response.get("expires_in", 3600))

        if not access_token:
            raise TokenExchangeError("Token response missing access_token")

        channel_profile = await self.fetch_channel_profile(access_token)
        yt_channel_id = channel_profile.get("yt_channel_id")

        if not yt_channel_id:
            raise YouTubeServiceError("Unable to determine YouTube channel ID")

        expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
        scopes = self._parse_scopes(token_response.get("scope"))

        channel = (
            self.db.query(Channel)
            .filter(Channel.yt_channel_id == yt_channel_id)
            .first()
        )

        if channel and channel.user_id != user.id:
            raise ChannelOwnershipError("이 채널은 다른 계정에 이미 연결되어 있습니다")

        token_payload = {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": token_response.get("token_type", "Bearer"),
            "scope": scopes,
            "expires_in": expires_in,
            "issued_at": datetime.now(timezone.utc).isoformat(),
        }

        if channel and not refresh_token:
            # Some refresh flows may omit refresh_token; preserve existing one.
            try:
                existing = self.decrypt_token_meta(channel)
                token_payload["refresh_token"] = existing.get("refresh_token")
            except EncryptionError:
                pass

        encrypted_meta = self.encryptor.encrypt(token_payload)

        if channel:
            channel.user_id = user.id
            channel.channel_name = channel_profile.get("channel_name") or channel.channel_name
            channel.channel_thumbnail = channel_profile.get("channel_thumbnail")
            channel.access_token_meta = encrypted_meta
            channel.token_expires_at = expires_at
            channel.is_active = True
        else:
            channel = Channel(
                user_id=user.id,
                yt_channel_id=yt_channel_id,
                channel_name=channel_profile.get("channel_name") or "YouTube Channel",
                channel_thumbnail=channel_profile.get("channel_thumbnail"),
                access_token_meta=encrypted_meta,
                token_expires_at=expires_at,
                is_active=True,
            )
            self.db.add(channel)

        self.db.commit()
        self.db.refresh(channel)
        return channel

    async def ensure_valid_channel(self, channel: Channel) -> Channel:
        """
        Ensure channel has a non-expired token. Refresh automatically when possible.
        """
        if not channel.is_active:
            return channel

        if not channel.is_token_expired():
            return channel

        try:
            meta = self.decrypt_token_meta(channel)
        except EncryptionError:
            channel.mark_inactive()
            self.db.add(channel)
            self.db.commit()
            return channel

        refresh_token = meta.get("refresh_token")
        if not refresh_token:
            channel.mark_inactive()
            self.db.add(channel)
            self.db.commit()
            return channel

        refreshed = await self.refresh_access_token(refresh_token)
        new_access_token = refreshed.get("access_token")
        new_expires_in = int(refreshed.get("expires_in", meta.get("expires_in", 3600)))

        if not new_access_token:
            channel.mark_inactive()
            self.db.add(channel)
            self.db.commit()
            return channel

        meta.update(
            {
                "access_token": new_access_token,
                "expires_in": new_expires_in,
                "scope": self._parse_scopes(refreshed.get("scope")),
                "token_type": refreshed.get("token_type", meta.get("token_type", "Bearer")),
                "issued_at": datetime.now(timezone.utc).isoformat(),
            }
        )

        channel.access_token_meta = self.encryptor.encrypt(meta)
        channel.token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=new_expires_in)
        channel.is_active = True

        self.db.add(channel)
        self.db.commit()
        self.db.refresh(channel)
        return channel

    def list_channels(self, user: User) -> List[Channel]:
        """List channels owned by the specified user."""
        return (
            self.db.query(Channel)
            .filter(Channel.user_id == user.id)
            .order_by(Channel.created_at.desc())
            .all()
        )

    def delete_channel(self, user: User, channel_id: UUID) -> None:
        """Delete a channel connection."""
        channel = (
            self.db.query(Channel)
            .filter(Channel.id == channel_id, Channel.user_id == user.id)
            .first()
        )

        if channel:
            self.db.delete(channel)
            self.db.commit()

    def decrypt_token_meta(self, channel: Channel) -> Dict[str, Any]:
        """Decrypt token metadata for a channel."""
        return self.encryptor.decrypt(channel.access_token_meta)

    @staticmethod
    def channel_requires_reauth(channel: Channel) -> bool:
        """Check whether the channel requires re-authentication."""
        return not channel.is_active or channel.is_token_expired()

    @staticmethod
    def _parse_scopes(scope_value: Any) -> List[str]:
        """Normalize scope data into a list."""
        if isinstance(scope_value, str):
            return [scope for scope in scope_value.split() if scope]
        if isinstance(scope_value, Iterable):
            return [str(scope) for scope in scope_value]
        return []
