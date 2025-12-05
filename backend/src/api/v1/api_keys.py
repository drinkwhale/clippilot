"""API Keys 관리 엔드포인트"""
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field

from src.core.database import get_db
from src.middleware.auth import get_current_user
from src.models.api_key import APIKey
from src.core.encryption import get_encryption_service


router = APIRouter(prefix="/api-keys", tags=["api-keys"])


# Pydantic 스키마
class APIKeyCreate(BaseModel):
    """API 키 생성 요청"""
    service_name: str = Field(..., description="서비스 이름 (youtube, openai, pexels)")
    api_key: str = Field(..., description="API 키 평문")


class APIKeyResponse(BaseModel):
    """API 키 응답 (암호화된 키는 노출하지 않음)"""
    id: str
    service_name: str
    created_at: datetime
    updated_at: datetime
    last_used_at: datetime | None

    class Config:
        from_attributes = True


class APIKeyWithSecret(APIKeyResponse):
    """API 키 응답 (복호화된 키 포함 - 생성 직후에만 반환)"""
    api_key: str


@router.get("", response_model=List[APIKeyResponse])
async def list_api_keys(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    현재 사용자의 모든 API 키 목록 조회

    - 암호화된 키 값은 반환하지 않음 (보안)
    """
    result = await db.execute(
        select(APIKey).where(APIKey.user_id == current_user.id)
    )
    api_keys = result.scalars().all()

    return [
        APIKeyResponse(
            id=str(key.id),
            service_name=key.service_name,
            created_at=key.created_at,
            updated_at=key.updated_at,
            last_used_at=key.last_used_at
        )
        for key in api_keys
    ]


@router.get("/{service_name}", response_model=APIKeyResponse)
async def get_api_key(
    service_name: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    특정 서비스의 API 키 조회

    - service_name: youtube, openai, pexels 등
    """
    result = await db.execute(
        select(APIKey).where(
            APIKey.user_id == current_user.id,
            APIKey.service_name == service_name
        )
    )
    api_key = result.scalar_one_or_none()

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{service_name} API 키를 찾을 수 없습니다."
        )

    return APIKeyResponse(
        id=str(api_key.id),
        service_name=api_key.service_name,
        created_at=api_key.created_at,
        updated_at=api_key.updated_at,
        last_used_at=api_key.last_used_at
    )


@router.post("", response_model=APIKeyWithSecret, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    payload: APIKeyCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    새 API 키 생성 또는 기존 키 업데이트

    - 이미 해당 서비스 키가 존재하면 업데이트
    - 생성 직후에만 복호화된 키를 반환 (이후 조회 불가)
    """
    encryption_service = get_encryption_service()

    # 기존 키 확인
    result = await db.execute(
        select(APIKey).where(
            APIKey.user_id == current_user.id,
            APIKey.service_name == payload.service_name
        )
    )
    existing_key = result.scalar_one_or_none()

    # API 키 암호화
    encrypted_key = encryption_service.encrypt(payload.api_key)

    if existing_key:
        # 기존 키 업데이트
        existing_key.api_key_encrypted = encrypted_key
        existing_key.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(existing_key)

        return APIKeyWithSecret(
            id=str(existing_key.id),
            service_name=existing_key.service_name,
            api_key=payload.api_key,  # 평문 반환 (생성 직후에만)
            created_at=existing_key.created_at,
            updated_at=existing_key.updated_at,
            last_used_at=existing_key.last_used_at
        )
    else:
        # 새 키 생성
        new_key = APIKey(
            user_id=current_user.id,
            service_name=payload.service_name,
            api_key_encrypted=encrypted_key
        )
        db.add(new_key)
        await db.commit()
        await db.refresh(new_key)

        return APIKeyWithSecret(
            id=str(new_key.id),
            service_name=new_key.service_name,
            api_key=payload.api_key,  # 평문 반환 (생성 직후에만)
            created_at=new_key.created_at,
            updated_at=new_key.updated_at,
            last_used_at=new_key.last_used_at
        )


@router.delete("/{service_name}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_api_key(
    service_name: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    API 키 삭제

    - service_name: youtube, openai, pexels 등
    """
    result = await db.execute(
        select(APIKey).where(
            APIKey.user_id == current_user.id,
            APIKey.service_name == service_name
        )
    )
    api_key = result.scalar_one_or_none()

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{service_name} API 키를 찾을 수 없습니다."
        )

    await db.delete(api_key)
    await db.commit()

    return None


@router.get("/{service_name}/decrypt", response_model=APIKeyWithSecret)
async def decrypt_api_key(
    service_name: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    API 키 복호화 (내부 서비스 사용)

    - 프론트엔드에서는 호출하지 않음
    - 백엔드 서비스 간 통신에서만 사용
    """
    result = await db.execute(
        select(APIKey).where(
            APIKey.user_id == current_user.id,
            APIKey.service_name == service_name
        )
    )
    api_key = result.scalar_one_or_none()

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{service_name} API 키를 찾을 수 없습니다."
        )

    encryption_service = get_encryption_service()
    decrypted_key = encryption_service.decrypt(api_key.api_key_encrypted)

    # last_used_at 업데이트
    api_key.last_used_at = datetime.utcnow()
    await db.commit()

    return APIKeyWithSecret(
        id=str(api_key.id),
        service_name=api_key.service_name,
        api_key=decrypted_key,
        created_at=api_key.created_at,
        updated_at=api_key.updated_at,
        last_used_at=api_key.last_used_at
    )
