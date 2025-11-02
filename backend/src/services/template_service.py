"""
Template service for ClipPilot
Handles business logic for template CRUD operations
"""

from typing import Optional
from uuid import UUID

from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..models.template import Template
from ..schemas.template import TemplateCreate, TemplateUpdate


class TemplateService:
    """템플릿 관리 서비스"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_template(
        self,
        user_id: UUID,
        template_data: TemplateCreate
    ) -> Template:
        """
        사용자 템플릿 생성

        Args:
            user_id: 사용자 ID
            template_data: 템플릿 생성 데이터

        Returns:
            생성된 템플릿
        """
        # brand_config_json을 dict로 변환
        brand_config_dict = template_data.brand_config_json.model_dump()

        template = Template(
            user_id=user_id,
            name=template_data.name,
            description=template_data.description,
            brand_config_json=brand_config_dict,
            is_system_default=False
        )

        self.db.add(template)
        await self.db.commit()
        await self.db.refresh(template)

        return template

    async def get_template_by_id(
        self,
        template_id: UUID,
        user_id: Optional[UUID] = None
    ) -> Optional[Template]:
        """
        템플릿 ID로 조회

        Args:
            template_id: 템플릿 ID
            user_id: 사용자 ID (권한 확인용)

        Returns:
            템플릿 또는 None
        """
        query = select(Template).where(Template.id == template_id)

        # 시스템 기본 템플릿이 아니면 소유자 확인
        if user_id:
            query = query.where(
                or_(
                    Template.user_id == user_id,
                    Template.is_system_default == True
                )
            )

        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_user_templates(
        self,
        user_id: UUID,
        include_system: bool = True
    ) -> list[Template]:
        """
        사용자 템플릿 목록 조회 (시스템 기본 템플릿 포함 가능)

        Args:
            user_id: 사용자 ID
            include_system: 시스템 기본 템플릿 포함 여부

        Returns:
            템플릿 목록
        """
        if include_system:
            # 사용자 템플릿 + 시스템 기본 템플릿
            query = select(Template).where(
                or_(
                    Template.user_id == user_id,
                    Template.is_system_default == True
                )
            ).order_by(
                Template.is_system_default.desc(),  # 시스템 템플릿 먼저
                Template.created_at.desc()
            )
        else:
            # 사용자 템플릿만
            query = select(Template).where(
                Template.user_id == user_id
            ).order_by(Template.created_at.desc())

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_system_templates(self) -> list[Template]:
        """
        시스템 기본 템플릿 목록 조회

        Returns:
            시스템 기본 템플릿 목록
        """
        query = select(Template).where(
            Template.is_system_default == True
        ).order_by(Template.created_at.asc())

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def update_template(
        self,
        template_id: UUID,
        user_id: UUID,
        template_data: TemplateUpdate
    ) -> Optional[Template]:
        """
        템플릿 수정 (사용자 소유 템플릿만)

        Args:
            template_id: 템플릿 ID
            user_id: 사용자 ID
            template_data: 수정 데이터

        Returns:
            수정된 템플릿 또는 None
        """
        # 사용자 소유 템플릿만 수정 가능
        query = select(Template).where(
            and_(
                Template.id == template_id,
                Template.user_id == user_id,
                Template.is_system_default == False
            )
        )

        result = await self.db.execute(query)
        template = result.scalar_one_or_none()

        if not template:
            return None

        # 수정 데이터 적용
        update_data = template_data.model_dump(exclude_unset=True)

        # brand_config_json을 dict로 변환
        if "brand_config_json" in update_data and update_data["brand_config_json"]:
            update_data["brand_config_json"] = update_data["brand_config_json"].model_dump()

        for key, value in update_data.items():
            setattr(template, key, value)

        await self.db.commit()
        await self.db.refresh(template)

        return template

    async def delete_template(
        self,
        template_id: UUID,
        user_id: UUID
    ) -> bool:
        """
        템플릿 삭제 (사용자 소유 템플릿만)

        Args:
            template_id: 템플릿 ID
            user_id: 사용자 ID

        Returns:
            삭제 성공 여부
        """
        # 사용자 소유 템플릿만 삭제 가능
        query = select(Template).where(
            and_(
                Template.id == template_id,
                Template.user_id == user_id,
                Template.is_system_default == False
            )
        )

        result = await self.db.execute(query)
        template = result.scalar_one_or_none()

        if not template:
            return False

        await self.db.delete(template)
        await self.db.commit()

        return True

    async def validate_template_ownership(
        self,
        template_id: UUID,
        user_id: UUID
    ) -> bool:
        """
        템플릿 소유권 검증 (시스템 템플릿도 사용 가능)

        Args:
            template_id: 템플릿 ID
            user_id: 사용자 ID

        Returns:
            사용 가능 여부
        """
        query = select(Template).where(
            and_(
                Template.id == template_id,
                or_(
                    Template.user_id == user_id,
                    Template.is_system_default == True
                )
            )
        )

        result = await self.db.execute(query)
        return result.scalar_one_or_none() is not None
