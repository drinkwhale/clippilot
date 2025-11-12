"""
QuotaService 단위 테스트

테스트 범위 (Phase 5 US1):
- T064: Quota Service 테스트
  - 플랜별 할당량 확인 (FR-008)
  - 사용량 카운트
  - 한도 초과 감지
  - 80% 경고 (FR-033)
  - 월간 리셋 날짜 계산
"""

import pytest
from datetime import datetime, timedelta
from uuid import uuid4
from unittest.mock import MagicMock, Mock

from src.services.quota_service import QuotaService, get_quota_service
from src.models.user import User, PlanType
from src.models.job import Job, JobStatus
from src.core.exceptions import QuotaExceededError


@pytest.fixture
def mock_db():
    """Mock database session"""
    return MagicMock()


@pytest.fixture
def quota_service(mock_db):
    """QuotaService instance with mocked DB"""
    return QuotaService(mock_db)


class TestCheckQuota:
    """check_quota() 메서드 테스트"""

    def test_check_quota_free_plan_no_usage(self, quota_service, mock_db):
        """
        FREE 플랜 사용량 0 테스트 (FR-008)

        Given: FREE 플랜 사용자, 사용량 0
        When: check_quota() 호출
        Then:
          - quota_limit: 20
          - quota_used: 0
          - quota_remaining: 20
          - is_exceeded: False
        """
        # Given
        user_id = uuid4()
        user = User(
            id=user_id,
            email="free@example.com",
            plan=PlanType.FREE
        )

        # Mock: User 조회
        mock_db.execute.return_value.scalar_one_or_none.return_value = user

        # Mock: Job 카운트 = 0
        def mock_execute_side_effect(stmt):
            mock_result = Mock()
            # 첫 번째 호출: User 조회
            if hasattr(stmt, 'whereclause') and 'users.id' in str(stmt):
                mock_result.scalar_one_or_none.return_value = user
            # 두 번째 호출: Job 카운트
            else:
                mock_result.scalar_one.return_value = 0
            return mock_result

        mock_db.execute.side_effect = mock_execute_side_effect

        # When
        result = quota_service.check_quota(user_id)

        # Then
        assert result["plan"] == "free"
        assert result["quota_limit"] == 20
        assert result["quota_used"] == 0
        assert result["quota_remaining"] == 20
        assert result["is_exceeded"] is False
        assert "quota_reset_at" in result

    def test_check_quota_pro_plan_partial_usage(self, quota_service, mock_db):
        """
        PRO 플랜 부분 사용 테스트

        Given: PRO 플랜 사용자, 사용량 250/500
        When: check_quota() 호출
        Then:
          - quota_limit: 500
          - quota_used: 250
          - quota_remaining: 250
          - is_exceeded: False
        """
        # Given
        user_id = uuid4()
        user = User(
            id=user_id,
            email="pro@example.com",
            plan=PlanType.PRO
        )

        # Mock: User 조회 및 Job 카운트
        def mock_execute_side_effect(stmt):
            mock_result = Mock()
            if hasattr(stmt, 'whereclause') and 'users.id' in str(stmt):
                mock_result.scalar_one_or_none.return_value = user
            else:
                mock_result.scalar_one.return_value = 250
            return mock_result

        mock_db.execute.side_effect = mock_execute_side_effect

        # When
        result = quota_service.check_quota(user_id)

        # Then
        assert result["plan"] == "pro"
        assert result["quota_limit"] == 500
        assert result["quota_used"] == 250
        assert result["quota_remaining"] == 250
        assert result["is_exceeded"] is False

    def test_check_quota_agency_plan_full_usage(self, quota_service, mock_db):
        """
        AGENCY 플랜 한도 초과 테스트

        Given: AGENCY 플랜 사용자, 사용량 2000/2000
        When: check_quota() 호출
        Then:
          - quota_limit: 2000
          - quota_used: 2000
          - quota_remaining: 0
          - is_exceeded: True
        """
        # Given
        user_id = uuid4()
        user = User(
            id=user_id,
            email="agency@example.com",
            plan=PlanType.AGENCY
        )

        # Mock
        def mock_execute_side_effect(stmt):
            mock_result = Mock()
            if hasattr(stmt, 'whereclause') and 'users.id' in str(stmt):
                mock_result.scalar_one_or_none.return_value = user
            else:
                mock_result.scalar_one.return_value = 2000
            return mock_result

        mock_db.execute.side_effect = mock_execute_side_effect

        # When
        result = quota_service.check_quota(user_id)

        # Then
        assert result["plan"] == "agency"
        assert result["quota_limit"] == 2000
        assert result["quota_used"] == 2000
        assert result["quota_remaining"] == 0
        assert result["is_exceeded"] is True

    def test_check_quota_reset_date_calculation(self, quota_service, mock_db):
        """
        할당량 리셋 날짜 계산 테스트

        Given: 현재 월의 중간
        When: check_quota() 호출
        Then: quota_reset_at이 다음 달 1일
        """
        # Given
        user_id = uuid4()
        user = User(
            id=user_id,
            email="test@example.com",
            plan=PlanType.FREE
        )

        # Mock
        def mock_execute_side_effect(stmt):
            mock_result = Mock()
            if hasattr(stmt, 'whereclause') and 'users.id' in str(stmt):
                mock_result.scalar_one_or_none.return_value = user
            else:
                mock_result.scalar_one.return_value = 5
            return mock_result

        mock_db.execute.side_effect = mock_execute_side_effect

        # When
        result = quota_service.check_quota(user_id)

        # Then
        reset_date = datetime.fromisoformat(result["quota_reset_at"])
        now = datetime.utcnow()

        # 다음 달 1일이어야 함
        if now.month == 12:
            expected_month = 1
            expected_year = now.year + 1
        else:
            expected_month = now.month + 1
            expected_year = now.year

        assert reset_date.day == 1
        assert reset_date.month == expected_month
        assert reset_date.year == expected_year


class TestValidateQuota:
    """validate_quota() 메서드 테스트"""

    def test_validate_quota_success(self, quota_service, mock_db):
        """
        할당량 검증 성공 테스트

        Given: 사용량 10/20
        When: validate_quota() 호출
        Then: 예외 없음
        """
        # Given
        user_id = uuid4()
        user = User(
            id=user_id,
            email="test@example.com",
            plan=PlanType.FREE
        )

        # Mock
        def mock_execute_side_effect(stmt):
            mock_result = Mock()
            if hasattr(stmt, 'whereclause') and 'users.id' in str(stmt):
                mock_result.scalar_one_or_none.return_value = user
            else:
                mock_result.scalar_one.return_value = 10
            return mock_result

        mock_db.execute.side_effect = mock_execute_side_effect

        # When & Then - 예외 없음
        quota_service.validate_quota(user_id)

    def test_validate_quota_exceeded(self, quota_service, mock_db):
        """
        할당량 초과 검증 테스트

        Given: 사용량 20/20 (초과)
        When: validate_quota() 호출
        Then: QuotaExceededError 발생
        """
        # Given
        user_id = uuid4()
        user = User(
            id=user_id,
            email="test@example.com",
            plan=PlanType.FREE
        )

        # Mock
        def mock_execute_side_effect(stmt):
            mock_result = Mock()
            if hasattr(stmt, 'whereclause') and 'users.id' in str(stmt):
                mock_result.scalar_one_or_none.return_value = user
            else:
                mock_result.scalar_one.return_value = 20
            return mock_result

        mock_db.execute.side_effect = mock_execute_side_effect

        # When & Then
        with pytest.raises(QuotaExceededError) as exc_info:
            quota_service.validate_quota(user_id)

        assert exc_info.value.quota_limit == 20
        assert exc_info.value.quota_used == 20

    def test_validate_quota_80_percent_warning(self, quota_service, mock_db):
        """
        80% 사용 시 경고 로그 테스트 (FR-033)

        Given: 사용량 16/20 (80%)
        When: validate_quota() 호출
        Then: 예외 없음, 경고 로그 발생
        """
        # Given
        user_id = uuid4()
        user = User(
            id=user_id,
            email="test@example.com",
            plan=PlanType.FREE
        )

        # Mock
        def mock_execute_side_effect(stmt):
            mock_result = Mock()
            if hasattr(stmt, 'whereclause') and 'users.id' in str(stmt):
                mock_result.scalar_one_or_none.return_value = user
            else:
                mock_result.scalar_one.return_value = 16  # 80%
            return mock_result

        mock_db.execute.side_effect = mock_execute_side_effect

        # When - 예외 없음
        quota_service.validate_quota(user_id)

        # Note: 로그는 실제 실행 시 확인 (logger.warning 호출)


class TestUsagePercentage:
    """사용량 퍼센트 계산 테스트"""

    def test_get_usage_percentage_zero(self, quota_service, mock_db):
        """
        사용량 0% 테스트

        Given: 사용량 0/20
        When: get_usage_percentage() 호출
        Then: 0.0 반환
        """
        # Given
        user_id = uuid4()
        user = User(
            id=user_id,
            email="test@example.com",
            plan=PlanType.FREE
        )

        # Mock
        def mock_execute_side_effect(stmt):
            mock_result = Mock()
            if hasattr(stmt, 'whereclause') and 'users.id' in str(stmt):
                mock_result.scalar_one_or_none.return_value = user
            else:
                mock_result.scalar_one.return_value = 0
            return mock_result

        mock_db.execute.side_effect = mock_execute_side_effect

        # When
        result = quota_service.get_usage_percentage(user_id)

        # Then
        assert result == 0.0

    def test_get_usage_percentage_50(self, quota_service, mock_db):
        """
        사용량 50% 테스트

        Given: 사용량 10/20
        When: get_usage_percentage() 호출
        Then: 50.0 반환
        """
        # Given
        user_id = uuid4()
        user = User(
            id=user_id,
            email="test@example.com",
            plan=PlanType.FREE
        )

        # Mock
        def mock_execute_side_effect(stmt):
            mock_result = Mock()
            if hasattr(stmt, 'whereclause') and 'users.id' in str(stmt):
                mock_result.scalar_one_or_none.return_value = user
            else:
                mock_result.scalar_one.return_value = 10
            return mock_result

        mock_db.execute.side_effect = mock_execute_side_effect

        # When
        result = quota_service.get_usage_percentage(user_id)

        # Then
        assert result == 50.0

    def test_get_usage_percentage_100(self, quota_service, mock_db):
        """
        사용량 100% 테스트

        Given: 사용량 20/20
        When: get_usage_percentage() 호출
        Then: 100.0 반환
        """
        # Given
        user_id = uuid4()
        user = User(
            id=user_id,
            email="test@example.com",
            plan=PlanType.FREE
        )

        # Mock
        def mock_execute_side_effect(stmt):
            mock_result = Mock()
            if hasattr(stmt, 'whereclause') and 'users.id' in str(stmt):
                mock_result.scalar_one_or_none.return_value = user
            else:
                mock_result.scalar_one.return_value = 20
            return mock_result

        mock_db.execute.side_effect = mock_execute_side_effect

        # When
        result = quota_service.get_usage_percentage(user_id)

        # Then
        assert result == 100.0


class TestQuotaWarnings:
    """할당량 경고 테스트"""

    def test_should_show_quota_warning_below_80(self, quota_service, mock_db):
        """
        80% 미만 경고 표시 안 함

        Given: 사용량 15/20 (75%)
        When: should_show_quota_warning() 호출
        Then: False 반환
        """
        # Given
        user_id = uuid4()
        user = User(
            id=user_id,
            email="test@example.com",
            plan=PlanType.FREE
        )

        # Mock
        def mock_execute_side_effect(stmt):
            mock_result = Mock()
            if hasattr(stmt, 'whereclause') and 'users.id' in str(stmt):
                mock_result.scalar_one_or_none.return_value = user
            else:
                mock_result.scalar_one.return_value = 15  # 75%
            return mock_result

        mock_db.execute.side_effect = mock_execute_side_effect

        # When
        result = quota_service.should_show_quota_warning(user_id)

        # Then
        assert result is False

    def test_should_show_quota_warning_above_80(self, quota_service, mock_db):
        """
        80% 이상 경고 표시 (FR-033)

        Given: 사용량 16/20 (80%)
        When: should_show_quota_warning() 호출
        Then: True 반환
        """
        # Given
        user_id = uuid4()
        user = User(
            id=user_id,
            email="test@example.com",
            plan=PlanType.FREE
        )

        # Mock
        def mock_execute_side_effect(stmt):
            mock_result = Mock()
            if hasattr(stmt, 'whereclause') and 'users.id' in str(stmt):
                mock_result.scalar_one_or_none.return_value = user
            else:
                mock_result.scalar_one.return_value = 16  # 80%
            return mock_result

        mock_db.execute.side_effect = mock_execute_side_effect

        # When
        result = quota_service.should_show_quota_warning(user_id)

        # Then
        assert result is True

    def test_should_show_upgrade_prompt_below_100(self, quota_service, mock_db):
        """
        100% 미만 업그레이드 프롬프트 안 함

        Given: 사용량 19/20 (95%)
        When: should_show_upgrade_prompt() 호출
        Then: False 반환
        """
        # Given
        user_id = uuid4()
        user = User(
            id=user_id,
            email="test@example.com",
            plan=PlanType.FREE
        )

        # Mock
        def mock_execute_side_effect(stmt):
            mock_result = Mock()
            if hasattr(stmt, 'whereclause') and 'users.id' in str(stmt):
                mock_result.scalar_one_or_none.return_value = user
            else:
                mock_result.scalar_one.return_value = 19  # 95%
            return mock_result

        mock_db.execute.side_effect = mock_execute_side_effect

        # When
        result = quota_service.should_show_upgrade_prompt(user_id)

        # Then
        assert result is False

    def test_should_show_upgrade_prompt_at_100(self, quota_service, mock_db):
        """
        100% 도달 시 업그레이드 프롬프트 표시

        Given: 사용량 20/20 (100%)
        When: should_show_upgrade_prompt() 호출
        Then: True 반환
        """
        # Given
        user_id = uuid4()
        user = User(
            id=user_id,
            email="test@example.com",
            plan=PlanType.FREE
        )

        # Mock
        def mock_execute_side_effect(stmt):
            mock_result = Mock()
            if hasattr(stmt, 'whereclause') and 'users.id' in str(stmt):
                mock_result.scalar_one_or_none.return_value = user
            else:
                mock_result.scalar_one.return_value = 20  # 100%
            return mock_result

        mock_db.execute.side_effect = mock_execute_side_effect

        # When
        result = quota_service.should_show_upgrade_prompt(user_id)

        # Then
        assert result is True


class TestPlanLimits:
    """플랜별 할당량 한도 테스트 (FR-008)"""

    def test_quota_limits_constant(self):
        """
        QUOTA_LIMITS 상수 검증

        Given: QuotaService.QUOTA_LIMITS
        When: 각 플랜 확인
        Then:
          - FREE: 20
          - PRO: 500
          - AGENCY: 2000
        """
        # Then
        assert QuotaService.QUOTA_LIMITS[PlanType.FREE] == 20
        assert QuotaService.QUOTA_LIMITS[PlanType.PRO] == 500
        assert QuotaService.QUOTA_LIMITS[PlanType.AGENCY] == 2000


class TestServiceFactory:
    """서비스 팩토리 함수 테스트"""

    def test_get_quota_service(self, mock_db):
        """
        get_quota_service() 팩토리 함수 테스트

        Given: DB 세션
        When: get_quota_service() 호출
        Then: QuotaService 인스턴스 반환
        """
        # When
        service = get_quota_service(mock_db)

        # Then
        assert isinstance(service, QuotaService)
        assert service.db == mock_db


class TestErrorHandling:
    """에러 처리 테스트"""

    def test_user_not_found_error(self, quota_service, mock_db):
        """
        존재하지 않는 사용자 에러 테스트

        Given: 존재하지 않는 user_id
        When: check_quota() 호출
        Then: ValueError 발생
        """
        # Given
        user_id = uuid4()

        # Mock: User not found
        mock_db.execute.return_value.scalar_one_or_none.return_value = None

        # When & Then
        with pytest.raises(ValueError) as exc_info:
            quota_service.check_quota(user_id)

        assert "User not found" in str(exc_info.value)
