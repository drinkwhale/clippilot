"""
AlertService for ClipPilot
사용량 알림 및 배너 표시 로직
"""

from uuid import UUID
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from .metrics_service import MetricsService


class UsageAlert:
    """사용량 알림 데이터 클래스"""

    def __init__(
        self,
        should_show_banner: bool,
        should_send_email: bool,
        usage_percentage: float,
        current_count: int,
        quota_limit: int,
        message: Optional[str] = None
    ):
        self.should_show_banner = should_show_banner
        self.should_send_email = should_send_email
        self.usage_percentage = usage_percentage
        self.current_count = current_count
        self.quota_limit = quota_limit
        self.message = message


class AlertService:
    """사용량 알림 서비스"""

    # 알림 임계값
    BANNER_THRESHOLD = 80.0  # 80% 이상 시 배너 표시
    EMAIL_THRESHOLD = 100.0  # 100% 도달 시 이메일 발송

    def __init__(self, db: AsyncSession):
        self.db = db
        self.metrics_service = MetricsService(db)

    async def check_usage_alert(
        self,
        user_id: UUID
    ) -> UsageAlert:
        """
        사용량 알림 체크

        Args:
            user_id: 사용자 ID

        Returns:
            UsageAlert 객체
        """
        # 사용량 메트릭 조회
        usage = await self.metrics_service.get_usage_metrics(user_id)

        # 알림 조건 체크
        should_show_banner = usage.usage_percentage >= self.BANNER_THRESHOLD
        should_send_email = usage.usage_percentage >= self.EMAIL_THRESHOLD

        # 알림 메시지 생성
        message = None
        if usage.usage_percentage >= self.EMAIL_THRESHOLD:
            message = (
                f"이번 달 할당량 {usage.quota_limit}개를 모두 사용하셨습니다. "
                "추가 작업을 위해 플랜 업그레이드를 고려해 주세요."
            )
        elif usage.usage_percentage >= self.BANNER_THRESHOLD:
            remaining = usage.quota_limit - usage.current_count
            message = (
                f"이번 달 할당량의 {usage.usage_percentage:.0f}%를 사용하셨습니다. "
                f"남은 작업 수: {remaining}개"
            )

        return UsageAlert(
            should_show_banner=should_show_banner,
            should_send_email=should_send_email,
            usage_percentage=usage.usage_percentage,
            current_count=usage.current_count,
            quota_limit=usage.quota_limit,
            message=message
        )

    async def send_quota_exceeded_email(
        self,
        user_id: UUID,
        user_email: str
    ) -> bool:
        """
        할당량 초과 이메일 발송

        Args:
            user_id: 사용자 ID
            user_email: 사용자 이메일

        Returns:
            이메일 발송 성공 여부

        Note:
            실제 이메일 발송은 추후 SendGrid/AWS SES 등으로 구현
            현재는 로깅만 수행
        """
        usage = await self.metrics_service.get_usage_metrics(user_id)

        if usage.usage_percentage < self.EMAIL_THRESHOLD:
            return False

        # TODO: 실제 이메일 발송 로직 구현
        # - SendGrid API 또는 AWS SES 사용
        # - 템플릿 기반 이메일 생성
        # - 발송 이력 저장

        print(f"[ALERT] Quota exceeded email would be sent to {user_email}")
        print(f"  Current usage: {usage.current_count}/{usage.quota_limit}")
        print(f"  Usage percentage: {usage.usage_percentage}%")

        return True

    def get_banner_config(
        self,
        usage_percentage: float,
        current_count: int,
        quota_limit: int
    ) -> Optional[dict]:
        """
        배너 표시 설정 생성

        Args:
            usage_percentage: 사용률 (%)
            current_count: 현재 작업 수
            quota_limit: 할당량

        Returns:
            배너 설정 dict 또는 None
        """
        if usage_percentage < self.BANNER_THRESHOLD:
            return None

        remaining = quota_limit - current_count
        severity = "critical" if usage_percentage >= self.EMAIL_THRESHOLD else "warning"

        return {
            "severity": severity,
            "message": (
                f"이번 달 할당량의 {usage_percentage:.0f}%를 사용하셨습니다. "
                f"남은 작업 수: {remaining}개"
            ),
            "action_text": "플랜 업그레이드",
            "action_url": "/settings/billing",
            "show_dismiss": usage_percentage < self.EMAIL_THRESHOLD
        }
