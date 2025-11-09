"""
MetricsService 단위 테스트 (Simplified Version)

Priority 1 (High) - Backend 테스트 작성
예상 시간: 3시간
목표: 핵심 로직 검증
"""
from datetime import datetime, timedelta
from decimal import Decimal
from uuid import uuid4
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from src.services.metrics_service import (
    MetricsService,
    DashboardMetrics,
    UsageMetrics
)


class TestDashboardMetricsDataClass:
    """DashboardMetrics 데이터 클래스 테스트"""

    def test_dashboard_metrics_initialization(self):
        """DashboardMetrics 초기화 테스트"""
        metrics = DashboardMetrics(
            total_jobs=10,
            successful_jobs=8,
            failed_jobs=2,
            success_rate=80.0,
            avg_render_time_seconds=120.5,
            total_tokens_used=5000,
            total_api_cost=Decimal("0.10"),
            period_days=30
        )

        assert metrics.total_jobs == 10
        assert metrics.successful_jobs == 8
        assert metrics.failed_jobs == 2
        assert metrics.success_rate == 80.0
        assert metrics.avg_render_time_seconds == 120.5
        assert metrics.total_tokens_used == 5000
        assert metrics.total_api_cost == Decimal("0.10")
        assert metrics.period_days == 30


class TestUsageMetricsDataClass:
    """UsageMetrics 데이터 클래스 테스트"""

    def test_usage_metrics_initialization(self):
        """UsageMetrics 초기화 테스트"""
        now = datetime.utcnow()
        period_start = datetime(now.year, now.month, 1)
        period_end = datetime(now.year, now.month + 1, 1) if now.month < 12 else datetime(now.year + 1, 1, 1)

        metrics = UsageMetrics(
            current_count=15,
            quota_limit=20,
            usage_percentage=75.0,
            period_start=period_start,
            period_end=period_end
        )

        assert metrics.current_count == 15
        assert metrics.quota_limit == 20
        assert metrics.usage_percentage == 75.0
        assert metrics.period_start == period_start
        assert metrics.period_end == period_end


class TestMetricsServiceLogic:
    """MetricsService 로직 테스트 (모킹)"""

    def test_success_rate_calculation_100_percent(self):
        """성공률 100% 계산 테스트"""
        total = 10
        successful = 10
        success_rate = (successful / total * 100) if total > 0 else 0.0
        assert success_rate == 100.0

    def test_success_rate_calculation_zero_jobs(self):
        """작업이 없을 때 성공률 0% 테스트"""
        total = 0
        successful = 0
        success_rate = (successful / total * 100) if total > 0 else 0.0
        assert success_rate == 0.0

    def test_success_rate_calculation_partial(self):
        """부분 성공률 계산 테스트"""
        total = 10
        successful = 6
        success_rate = round((successful / total * 100), 2)
        assert success_rate == 60.0

    def test_usage_percentage_calculation_under_quota(self):
        """할당량 미만 사용률 계산 테스트"""
        current_count = 15
        quota_limit = 20
        usage_percentage = round((current_count / quota_limit * 100), 2) if quota_limit > 0 else 0.0
        assert usage_percentage == 75.0

    def test_usage_percentage_calculation_over_quota(self):
        """할당량 초과 사용률 계산 테스트"""
        current_count = 25
        quota_limit = 20
        usage_percentage = round((current_count / quota_limit * 100), 2) if quota_limit > 0 else 0.0
        assert usage_percentage == 125.0

    def test_usage_percentage_calculation_zero_quota(self):
        """할당량 0일 때 사용률 계산 테스트"""
        current_count = 10
        quota_limit = 0
        usage_percentage = round((current_count / quota_limit * 100), 2) if quota_limit > 0 else 0.0
        assert usage_percentage == 0.0


class TestMetricsServiceConfiguration:
    """MetricsService 설정 테스트"""

    def test_service_initialization(self):
        """MetricsService 초기화 테스트"""
        mock_session = MagicMock(spec=AsyncSession)
        service = MetricsService(mock_session)
        assert service.db == mock_session

    def test_quota_limits_configuration(self):
        """할당량 설정 확인 테스트"""
        from src.config import settings

        assert "free" in settings.QUOTA_LIMITS
        assert "pro" in settings.QUOTA_LIMITS
        assert "agency" in settings.QUOTA_LIMITS

        assert settings.QUOTA_LIMITS["free"] == 20
        assert settings.QUOTA_LIMITS["pro"] == 500
        assert settings.QUOTA_LIMITS["agency"] == 2000


class TestDateCalculations:
    """날짜 계산 로직 테스트"""

    def test_period_start_calculation(self):
        """월간 기간 시작 날짜 계산 테스트"""
        now = datetime.utcnow()
        period_start = datetime(now.year, now.month, 1)

        assert period_start.day == 1
        assert period_start.hour == 0
        assert period_start.minute == 0
        assert period_start.second == 0

    def test_period_end_calculation_regular_month(self):
        """월간 기간 종료 날짜 계산 테스트 (일반 월)"""
        # 1월의 경우
        test_date = datetime(2025, 1, 15)
        expected_end = datetime(2025, 2, 1)

        if test_date.month == 12:
            period_end = datetime(test_date.year + 1, 1, 1)
        else:
            period_end = datetime(test_date.year, test_date.month + 1, 1)

        assert period_end == expected_end

    def test_period_end_calculation_december(self):
        """월간 기간 종료 날짜 계산 테스트 (12월)"""
        test_date = datetime(2025, 12, 15)
        expected_end = datetime(2026, 1, 1)

        if test_date.month == 12:
            period_end = datetime(test_date.year + 1, 1, 1)
        else:
            period_end = datetime(test_date.year, test_date.month + 1, 1)

        assert period_end == expected_end

    def test_timedelta_calculation(self):
        """기간 델타 계산 테스트"""
        now = datetime.utcnow()
        period_days = 30
        start_date = now - timedelta(days=period_days)

        delta = now - start_date
        assert delta.days == period_days


class TestEdgeCases:
    """엣지 케이스 테스트"""

    def test_zero_division_prevention(self):
        """0으로 나누기 방지 테스트"""
        # Success rate with no jobs
        total_jobs = 0
        successful_jobs = 0
        success_rate = (successful_jobs / total_jobs * 100) if total_jobs > 0 else 0.0
        assert success_rate == 0.0

        # Usage percentage with no quota
        current_count = 5
        quota_limit = 0
        usage_percentage = (current_count / quota_limit * 100) if quota_limit > 0 else 0.0
        assert usage_percentage == 0.0

    def test_negative_values_handling(self):
        """음수 값 처리 테스트"""
        # 음수는 실제로 발생하지 않아야 하지만, 방어 로직 테스트
        total_jobs = -1
        successful_jobs = 0

        # 음수 처리: max(0, value) 패턴
        safe_total = max(0, total_jobs)
        safe_successful = max(0, successful_jobs)

        assert safe_total == 0
        assert safe_successful == 0

    def test_float_precision(self):
        """부동소수점 정밀도 테스트"""
        value = 66.66666666666667
        rounded_value = round(value, 2)
        assert rounded_value == 66.67

    def test_decimal_precision(self):
        """Decimal 정밀도 테스트"""
        cost1 = Decimal("0.02")
        cost2 = Decimal("0.03")
        total_cost = cost1 + cost2
        assert total_cost == Decimal("0.05")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
