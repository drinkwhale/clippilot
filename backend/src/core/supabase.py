"""
Supabase client wrapper for ClipPilot backend
Provides unified interface for Supabase Auth, Database, and Storage
"""

import os
from typing import Any, Optional
from uuid import UUID

from supabase import Client, create_client


class SupabaseClient:
    """Wrapper for Supabase client with helper methods"""

    def __init__(self):
        """Initialize Supabase client"""
        self.url = os.getenv("SUPABASE_URL")
        self.service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        self.anon_key = os.getenv("SUPABASE_ANON_KEY")

        if not all([self.url, self.service_key]):
            raise ValueError(
                "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
            )

        # Service role client (bypasses RLS)
        self._service_client: Client = create_client(self.url, self.service_key)

        # Anonymous client (respects RLS)
        self._anon_client: Optional[Client] = None
        if self.anon_key:
            self._anon_client = create_client(self.url, self.anon_key)

    @property
    def service(self) -> Client:
        """Get service role client (admin access)"""
        return self._service_client

    @property
    def anon(self) -> Client:
        """Get anonymous client (respects RLS)"""
        if not self._anon_client:
            raise ValueError("SUPABASE_ANON_KEY not configured")
        return self._anon_client

    def get_user_client(self, access_token: str) -> Client:
        """
        Get client with user authentication

        Args:
            access_token: User's JWT access token

        Returns:
            Authenticated Supabase client
        """
        if not self.anon_key:
            raise ValueError("SUPABASE_ANON_KEY not configured")

        client = create_client(self.url, self.anon_key)
        client.auth.set_session(access_token, access_token)
        return client

    async def verify_token(self, token: str) -> Optional[dict[str, Any]]:
        """
        Verify JWT token and extract user info

        Args:
            token: JWT access token

        Returns:
            User info dict if valid, None if invalid
        """
        try:
            response = self.service.auth.get_user(token)
            if response and response.user:
                return {
                    "id": response.user.id,
                    "email": response.user.email,
                    "role": response.user.role,
                }
            return None
        except Exception:
            return None

    # Storage helpers
    def upload_file(
        self,
        bucket: str,
        path: str,
        file_data: bytes,
        content_type: str = "application/octet-stream",
    ) -> str:
        """
        Upload file to Supabase Storage

        Args:
            bucket: Storage bucket name
            path: File path within bucket
            file_data: File binary data
            content_type: MIME type

        Returns:
            Public URL of uploaded file
        """
        self.service.storage.from_(bucket).upload(
            path,
            file_data,
            {"content-type": content_type}
        )

        return self.get_public_url(bucket, path)

    def get_public_url(self, bucket: str, path: str) -> str:
        """
        Get public URL for file

        Args:
            bucket: Storage bucket name
            path: File path within bucket

        Returns:
            Public URL
        """
        return self.service.storage.from_(bucket).get_public_url(path)

    def delete_file(self, bucket: str, path: str) -> None:
        """
        Delete file from storage

        Args:
            bucket: Storage bucket name
            path: File path within bucket
        """
        self.service.storage.from_(bucket).remove([path])

    # Database helpers
    def get_user_by_id(self, user_id: UUID) -> Optional[dict[str, Any]]:
        """
        Get user by ID

        Args:
            user_id: User UUID

        Returns:
            User dict if found, None otherwise
        """
        response = (
            self.service.table("users")
            .select("*")
            .eq("id", str(user_id))
            .single()
            .execute()
        )

        return response.data if response.data else None

    def get_user_by_email(self, email: str) -> Optional[dict[str, Any]]:
        """
        Get user by email

        Args:
            email: User email address

        Returns:
            User dict if found, None otherwise
        """
        response = (
            self.service.table("users")
            .select("*")
            .eq("email", email.lower())
            .single()
            .execute()
        )

        return response.data if response.data else None


# Global Supabase client instance
_supabase_client: Optional[SupabaseClient] = None


def get_supabase() -> SupabaseClient:
    """
    Get or create global Supabase client instance

    Returns:
        SupabaseClient instance
    """
    global _supabase_client

    if _supabase_client is None:
        _supabase_client = SupabaseClient()

    return _supabase_client
