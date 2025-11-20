"""암호화 유틸리티 - API 키 암호화/복호화"""
import os
from cryptography.fernet import Fernet
from typing import Optional


class EncryptionService:
    """API 키 암호화/복호화 서비스"""

    def __init__(self):
        # 환경변수에서 암호화 키 가져오기
        encryption_key = os.getenv("ENCRYPTION_KEY")
        if not encryption_key:
            # 개발 환경에서는 기본 키 사용 (프로덕션에서는 반드시 설정 필요)
            raise ValueError("ENCRYPTION_KEY environment variable is required")

        # Fernet 키는 base64로 인코딩된 32바이트 키여야 함
        self.cipher = Fernet(encryption_key.encode())

    def encrypt(self, plaintext: str) -> str:
        """평문 API 키를 암호화"""
        if not plaintext:
            raise ValueError("Plaintext cannot be empty")

        encrypted_bytes = self.cipher.encrypt(plaintext.encode())
        return encrypted_bytes.decode()

    def decrypt(self, ciphertext: str) -> str:
        """암호화된 API 키를 복호화"""
        if not ciphertext:
            raise ValueError("Ciphertext cannot be empty")

        decrypted_bytes = self.cipher.decrypt(ciphertext.encode())
        return decrypted_bytes.decode()


# 싱글톤 인스턴스
_encryption_service: Optional[EncryptionService] = None


def get_encryption_service() -> EncryptionService:
    """암호화 서비스 싱글톤 인스턴스 반환"""
    global _encryption_service
    if _encryption_service is None:
        _encryption_service = EncryptionService()
    return _encryption_service
