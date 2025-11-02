"""
Templates API endpoints for ClipPilot
Handles template CRUD operations
"""

from typing import List
from uuid import UUID
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.database import get_async_db
from ...middleware.auth import get_current_user
from ...models.user import User
from ...schemas.template import (
    TemplateCreate,
    TemplateUpdate,
    TemplateResponse,
    TemplateListResponse
)
from ...services.template_service import TemplateService
from ...core.exceptions import ResourceNotFoundError, ValidationError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/templates", tags=["templates"])


@router.get("", response_model=TemplateListResponse)
async def get_templates(
    include_system: bool = True,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Get user templates (사용자 + 시스템 기본, FR-031)

    Args:
        include_system: 시스템 기본 템플릿 포함 여부

    Returns:
        TemplateListResponse: 템플릿 목록
    """
    try:
        template_service = TemplateService(db)

        templates = await template_service.get_user_templates(
            user_id=current_user.id,
            include_system=include_system
        )

        return TemplateListResponse(
            templates=[TemplateResponse.model_validate(t) for t in templates],
            total=len(templates)
        )

    except Exception as e:
        logger.error(f"Failed to get templates: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"code": "INTERNAL_ERROR", "message": "템플릿 목록 조회에 실패했습니다"}}
        )


@router.post("", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(
    template_data: TemplateCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Create a new template (FR-007, FR-032)

    Args:
        template_data: 템플릿 생성 데이터

    Returns:
        TemplateResponse: 생성된 템플릿
    """
    try:
        template_service = TemplateService(db)

        # 템플릿 이름 중복 체크 (선택적)
        existing_templates = await template_service.get_user_templates(
            user_id=current_user.id,
            include_system=False
        )
        if any(t.name == template_data.name for t in existing_templates):
            raise ValidationError(
                message="동일한 이름의 템플릿이 이미 존재합니다",
                details={"name": template_data.name}
            )

        template = await template_service.create_template(
            user_id=current_user.id,
            template_data=template_data
        )

        return TemplateResponse.model_validate(template)

    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "VALIDATION_ERROR", "message": e.message, "details": e.details}}
        )
    except Exception as e:
        logger.error(f"Failed to create template: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"code": "INTERNAL_ERROR", "message": "템플릿 생성에 실패했습니다"}}
        )


@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(
    template_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Get template by ID

    Args:
        template_id: 템플릿 ID

    Returns:
        TemplateResponse: 템플릿 정보
    """
    try:
        template_service = TemplateService(db)

        template = await template_service.get_template_by_id(
            template_id=template_id,
            user_id=current_user.id
        )

        if not template:
            raise ResourceNotFoundError(
                message="템플릿을 찾을 수 없습니다",
                details={"template_id": str(template_id)}
            )

        return TemplateResponse.model_validate(template)

    except ResourceNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": e.message, "details": e.details}}
        )
    except Exception as e:
        logger.error(f"Failed to get template: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"code": "INTERNAL_ERROR", "message": "템플릿 조회에 실패했습니다"}}
        )


@router.put("/{template_id}", response_model=TemplateResponse)
async def update_template(
    template_id: UUID,
    template_data: TemplateUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Update template (FR-007)

    Args:
        template_id: 템플릿 ID
        template_data: 수정 데이터

    Returns:
        TemplateResponse: 수정된 템플릿
    """
    try:
        template_service = TemplateService(db)

        template = await template_service.update_template(
            template_id=template_id,
            user_id=current_user.id,
            template_data=template_data
        )

        if not template:
            raise ResourceNotFoundError(
                message="템플릿을 찾을 수 없거나 수정 권한이 없습니다",
                details={"template_id": str(template_id)}
            )

        return TemplateResponse.model_validate(template)

    except ResourceNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": e.message, "details": e.details}}
        )
    except Exception as e:
        logger.error(f"Failed to update template: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"code": "INTERNAL_ERROR", "message": "템플릿 수정에 실패했습니다"}}
        )


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Delete template (FR-007)

    Args:
        template_id: 템플릿 ID

    Returns:
        None
    """
    try:
        template_service = TemplateService(db)

        deleted = await template_service.delete_template(
            template_id=template_id,
            user_id=current_user.id
        )

        if not deleted:
            raise ResourceNotFoundError(
                message="템플릿을 찾을 수 없거나 삭제 권한이 없습니다",
                details={"template_id": str(template_id)}
            )

        return None

    except ResourceNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": e.message, "details": e.details}}
        )
    except Exception as e:
        logger.error(f"Failed to delete template: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"code": "INTERNAL_ERROR", "message": "템플릿 삭제에 실패했습니다"}}
        )
