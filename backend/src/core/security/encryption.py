"""
Encryption helpers for sensitive OAuth tokens.

Provides a simple Fernet-based encryptor that stores encrypted payloads
as JSON-friendly dictionaries so they can be persisted in JSONB columns.
"""

from __future__ import annotations

import base64
import hashlib
import json
import os
from datetime import datetime, timezone
from typing import Any, Dict

from cryptography.fernet import Fernet, InvalidToken


class EncryptionError(Exception):
    """Raised when encryption or decryption fails."""


class TokenEncryptor:
    """
    Encrypts and decrypts sensitive token payloads using Fernet.

    The encrypted payload is returned as a dictionary:
    {
        "ciphertext": "...",  # base64 encoded string
        "algorithm": "Fernet",
        "version": 1,
        "encrypted_at": "UTC ISO timestamp"
    }
    """

    TOKEN_SECRET_ENV = "YOUTUBE_TOKEN_SECRET"
    TOKEN_SECRET_FALLBACK_ENV = "YOUTUBE_OAUTH_SECRET"

    def __init__(self, secret: str | None = None) -> None:
        secret_key = (
            secret
            or os.getenv(self.TOKEN_SECRET_ENV)
            or os.getenv(self.TOKEN_SECRET_FALLBACK_ENV)
        )

        if not secret_key:
            raise EncryptionError(
                "Token encryption secret is not configured. "
                "Set YOUTUBE_TOKEN_SECRET (or YOUTUBE_OAUTH_SECRET)."
            )

        self._fernet = self._create_fernet(secret_key)

    @staticmethod
    def _create_fernet(secret: str) -> Fernet:
        """
        Create a Fernet instance from the provided secret.

        Accepts either a valid Fernet key (base64 urlsafe encoded 32 bytes)
        or an arbitrary secret string that will be hashed to derive a key.
        """
        try:
            return Fernet(secret)
        except (ValueError, TypeError):
            hashed = hashlib.sha256(secret.encode("utf-8")).digest()
            derived = base64.urlsafe_b64encode(hashed)
            return Fernet(derived)

    def encrypt(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Encrypt a payload and return a JSON-serializable dict.

        Args:
            payload: Arbitrary dictionary to encrypt. Must be JSON serializable.

        Returns:
            Dictionary containing encrypted payload metadata.
        """
        try:
            serialized = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        except (TypeError, ValueError) as exc:
            raise EncryptionError("Payload must be JSON serializable") from exc

        ciphertext = self._fernet.encrypt(serialized).decode("utf-8")

        return {
            "ciphertext": ciphertext,
            "algorithm": "Fernet",
            "version": 1,
            "encrypted_at": datetime.now(timezone.utc).isoformat(),
        }

    def decrypt(self, encrypted_payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Decrypt a payload previously encrypted with this encryptor.

        Args:
            encrypted_payload: Dictionary returned from `encrypt`.

        Returns:
            Original dictionary payload.
        """
        ciphertext = encrypted_payload.get("ciphertext")

        if not ciphertext or not isinstance(ciphertext, str):
            raise EncryptionError("Encrypted payload is missing ciphertext")

        try:
            decrypted = self._fernet.decrypt(ciphertext.encode("utf-8"))
        except InvalidToken as exc:
            raise EncryptionError("Failed to decrypt token payload") from exc

        try:
            return json.loads(decrypted.decode("utf-8"))
        except json.JSONDecodeError as exc:
            raise EncryptionError("Decrypted payload is not valid JSON") from exc

    @staticmethod
    def mask(encrypted_payload: Dict[str, Any], keep: int = 6) -> str:
        """
        Create a masked representation of the ciphertext for logging/debugging.

        Args:
            encrypted_payload: Dictionary returned from `encrypt`.
            keep: Number of characters to keep at the start of the ciphertext.

        Returns:
            Masked string (e.g., abcd12***).
        """
        ciphertext = encrypted_payload.get("ciphertext", "")
        if not isinstance(ciphertext, str):
            return "***"

        prefix = ciphertext[:keep]
        return f"{prefix}***"
