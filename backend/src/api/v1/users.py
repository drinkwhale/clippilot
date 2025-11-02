"""
User management API endpoints for ClipPilot
Handles user profile, onboarding status, and account management
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.middleware.auth import get_current_user
from src.models.user import User
from src.schemas.user import (
    OnboardingStatusResponse,
    OnboardingUpdateRequest,
    UserResponse,
)

router = APIRouter(prefix="/users", tags=["users"])


@router.get(
    "/me/onboarding",
    response_model=OnboardingStatusResponse,
    summary="온보딩 상태 확인",
    description="현재 사용자의 온보딩 완료 여부를 확인합니다 (FR-037)",
)
async def get_onboarding_status(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> OnboardingStatusResponse:
    """
    현재 사용자의 온보딩 상태를 조회합니다.

    Returns:
        OnboardingStatusResponse: 온보딩 완료 여부 및 사용자 정보
    """
    return OnboardingStatusResponse(
        onboarding_completed=current_user.onboarding_completed,
        user=UserResponse(
            id=current_user.id,
            email=current_user.email,
            plan=current_user.plan.value,
            oauth_provider=current_user.oauth_provider.value,
            is_active=current_user.is_active,
            email_verified=current_user.email_verified,
            last_login_at=current_user.last_login_at,
            onboarding_completed=current_user.onboarding_completed,
            created_at=current_user.created_at,
            updated_at=current_user.updated_at,
        ),
    )


@router.put(
    "/me/onboarding",
    response_model=OnboardingStatusResponse,
    summary="온보딩 완료 처리",
    description="사용자의 온보딩 완료 상태를 업데이트합니다 (FR-037, FR-038)",
)
async def update_onboarding_status(
    request: OnboardingUpdateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> OnboardingStatusResponse:
    """
    사용자의 온보딩 완료 상태를 업데이트합니다.

    Args:
        request: 온보딩 완료 여부 요청 데이터
        current_user: 현재 인증된 사용자
        db: 데이터베이스 세션

    Returns:
        OnboardingStatusResponse: 업데이트된 온보딩 상태 및 사용자 정보
    """
    # 온보딩 상태 업데이트
    current_user.onboarding_completed = request.onboarding_completed

    # 데이터베이스 커밋
    await db.commit()
    await db.refresh(current_user)

    return OnboardingStatusResponse(
        onboarding_completed=current_user.onboarding_completed,
        user=UserResponse(
            id=current_user.id,
            email=current_user.email,
            plan=current_user.plan.value,
            oauth_provider=current_user.oauth_provider.value,
            is_active=current_user.is_active,
            email_verified=current_user.email_verified,
            last_login_at=current_user.last_login_at,
            onboarding_completed=current_user.onboarding_completed,
            created_at=current_user.created_at,
            updated_at=current_user.updated_at,
        ),
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="현재 사용자 정보 조회",
    description="현재 인증된 사용자의 프로필 정보를 조회합니다",
)
async def get_current_user_profile(
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserResponse:
    """
    현재 사용자의 프로필 정보를 조회합니다.

    Returns:
        UserResponse: 사용자 프로필 정보
    """
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        plan=current_user.plan.value,
        oauth_provider=current_user.oauth_provider.value,
        is_active=current_user.is_active,
        email_verified=current_user.email_verified,
        last_login_at=current_user.last_login_at,
        onboarding_completed=current_user.onboarding_completed,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
    )
