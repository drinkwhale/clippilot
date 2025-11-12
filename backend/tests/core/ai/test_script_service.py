"""
ScriptGenerationService 단위 테스트

테스트 범위 (Phase 5 US1):
- T061: Script Generation 테스트
  - 스크립트 생성 성공 (FR-001, FR-013)
  - 비디오 길이 검증 (15, 30, 60초)
  - Tone 검증 (informative, fun, emotional)
  - 부적절한 콘텐츠 필터링 (FR-014)
  - OpenAI API 호출 및 비용 계산
"""

import pytest
from unittest.mock import Mock, patch, MagicMock, AsyncMock

from src.core.ai.script_service import ScriptGenerationService, get_script_service
from src.core.exceptions import ContentGenerationError


@pytest.fixture
def mock_openai_client():
    """Mock OpenAI client"""
    client = AsyncMock()
    client.generate_script = AsyncMock(return_value={
        "script": "테스트 스크립트 내용입니다.\n이것은 두 번째 문장입니다.\n마지막 문장입니다.",
        "tokens_in": 100,
        "tokens_out": 50,
    })
    client.estimate_cost = AsyncMock(return_value=0.0025)
    return client


@pytest.fixture
def script_service(mock_openai_client):
    """ScriptGenerationService instance with mocked OpenAI"""
    with patch('src.core.ai.script_service.get_openai_client', return_value=mock_openai_client):
        service = ScriptGenerationService()
        return service


class TestScriptGeneration:
    """스크립트 생성 테스트"""

    @pytest.mark.asyncio
    async def test_generate_script_success(self, script_service, mock_openai_client):
        """
        스크립트 생성 성공 테스트 (FR-001, FR-013)

        Given: 유효한 프롬프트와 파라미터
        When: generate_script() 호출
        Then:
          - OpenAI API 호출
          - 스크립트, 토큰, 비용 정보 반환
        """
        # Given
        prompt = "AI와 함께하는 미래"
        video_length_sec = 30
        tone = "informative"

        # When
        result = await script_service.generate_script(
            prompt=prompt,
            video_length_sec=video_length_sec,
            tone=tone
        )

        # Then
        assert result["script"] == "테스트 스크립트 내용입니다.\n이것은 두 번째 문장입니다.\n마지막 문장입니다."
        assert result["tokens_in"] == 100
        assert result["tokens_out"] == 50
        assert result["api_cost"] == 0.0025

        # OpenAI client 호출 확인
        mock_openai_client.generate_script.assert_called_once_with(
            prompt=prompt,
            video_length_sec=video_length_sec,
            tone=tone,
            additional_context=None
        )
        mock_openai_client.estimate_cost.assert_called_once_with(
            tokens_in=100,
            tokens_out=50
        )

    @pytest.mark.asyncio
    async def test_generate_script_with_additional_context(self, script_service, mock_openai_client):
        """
        추가 컨텍스트를 포함한 스크립트 생성 테스트

        Given: 프롬프트 + additional_context
        When: generate_script() 호출
        Then: additional_context가 OpenAI에 전달
        """
        # Given
        prompt = "AI 기술 소개"
        additional_context = "대상: 일반인, 전문용어 최소화"

        # When
        await script_service.generate_script(
            prompt=prompt,
            video_length_sec=30,
            tone="informative",
            additional_context=additional_context
        )

        # Then
        mock_openai_client.generate_script.assert_called_once_with(
            prompt=prompt,
            video_length_sec=30,
            tone="informative",
            additional_context=additional_context
        )

    @pytest.mark.asyncio
    async def test_generate_script_15_seconds(self, script_service):
        """
        15초 영상 스크립트 생성 테스트

        Given: video_length_sec=15
        When: generate_script() 호출
        Then: 정상 처리
        """
        # When
        result = await script_service.generate_script(
            prompt="짧은 팁",
            video_length_sec=15,
            tone="fun"
        )

        # Then
        assert result["script"] is not None

    @pytest.mark.asyncio
    async def test_generate_script_60_seconds(self, script_service):
        """
        60초 영상 스크립트 생성 테스트

        Given: video_length_sec=60
        When: generate_script() 호출
        Then: 정상 처리
        """
        # When
        result = await script_service.generate_script(
            prompt="상세한 설명",
            video_length_sec=60,
            tone="emotional"
        )

        # Then
        assert result["script"] is not None


class TestScriptValidation:
    """스크립트 검증 테스트"""

    @pytest.mark.asyncio
    async def test_invalid_video_length(self, script_service):
        """
        잘못된 비디오 길이 검증 테스트

        Given: video_length_sec=45 (허용되지 않음)
        When: generate_script() 호출
        Then: ContentGenerationError 발생
        """
        # When & Then
        with pytest.raises(ContentGenerationError) as exc_info:
            await script_service.generate_script(
                prompt="테스트",
                video_length_sec=45,  # Invalid: 15, 30, 60만 허용
                tone="informative"
            )

        assert "잘못된 요청 파라미터" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_invalid_tone(self, script_service):
        """
        잘못된 Tone 검증 테스트

        Given: tone="casual" (허용되지 않음)
        When: generate_script() 호출
        Then: ContentGenerationError 발생
        """
        # When & Then
        with pytest.raises(ContentGenerationError) as exc_info:
            await script_service.generate_script(
                prompt="테스트",
                video_length_sec=30,
                tone="casual"  # Invalid: informative, fun, emotional만 허용
            )

        assert "잘못된 요청 파라미터" in str(exc_info.value)


class TestContentFiltering:
    """콘텐츠 필터링 테스트 (FR-014)"""

    @pytest.mark.asyncio
    async def test_inappropriate_content_violence(self, script_service):
        """
        부적절한 콘텐츠 필터링 - 폭력

        Given: "폭력"이 포함된 프롬프트
        When: generate_script() 호출
        Then: ContentGenerationError 발생
        """
        # When & Then
        with pytest.raises(ContentGenerationError) as exc_info:
            await script_service.generate_script(
                prompt="폭력적인 장면을 담은 영상",
                video_length_sec=30,
                tone="informative"
            )

        assert "부적절한 콘텐츠" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_inappropriate_content_hate(self, script_service):
        """
        부적절한 콘텐츠 필터링 - 혐오

        Given: "혐오"가 포함된 프롬프트
        When: generate_script() 호출
        Then: ContentGenerationError 발생
        """
        # When & Then
        with pytest.raises(ContentGenerationError) as exc_info:
            await script_service.generate_script(
                prompt="특정 집단에 대한 혐오 발언",
                video_length_sec=30,
                tone="informative"
            )

        assert "부적절한 콘텐츠" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_inappropriate_content_adult(self, script_service):
        """
        부적절한 콘텐츠 필터링 - 성인

        Given: "성인"이 포함된 프롬프트
        When: generate_script() 호출
        Then: ContentGenerationError 발생
        """
        # When & Then
        with pytest.raises(ContentGenerationError) as exc_info:
            await script_service.generate_script(
                prompt="성인용 콘텐츠 제작",
                video_length_sec=30,
                tone="fun"
            )

        assert "부적절한 콘텐츠" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_clean_content_passes(self, script_service):
        """
        적절한 콘텐츠는 통과

        Given: 부적절한 키워드가 없는 프롬프트
        When: generate_script() 호출
        Then: 정상 처리
        """
        # When
        result = await script_service.generate_script(
            prompt="건강한 생활 습관 소개",
            video_length_sec=30,
            tone="informative"
        )

        # Then
        assert result["script"] is not None


class TestErrorHandling:
    """에러 처리 테스트"""

    @pytest.mark.asyncio
    async def test_openai_api_failure(self, script_service, mock_openai_client):
        """
        OpenAI API 실패 처리 테스트

        Given: OpenAI API 호출 실패
        When: generate_script() 호출
        Then: ContentGenerationError 발생
        """
        # Given
        mock_openai_client.generate_script.side_effect = Exception("OpenAI API error")

        # When & Then
        with pytest.raises(ContentGenerationError) as exc_info:
            await script_service.generate_script(
                prompt="테스트",
                video_length_sec=30,
                tone="informative"
            )

        assert "스크립트 생성 중 오류" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_cost_estimation_failure(self, script_service, mock_openai_client):
        """
        비용 추정 실패 처리 테스트

        Given: estimate_cost() 실패
        When: generate_script() 호출
        Then: ContentGenerationError 발생
        """
        # Given
        mock_openai_client.estimate_cost.side_effect = Exception("Cost estimation error")

        # When & Then
        with pytest.raises(ContentGenerationError):
            await script_service.generate_script(
                prompt="테스트",
                video_length_sec=30,
                tone="informative"
            )


class TestServiceSingleton:
    """서비스 싱글톤 테스트"""

    def test_get_script_service_singleton(self):
        """
        get_script_service()가 싱글톤 인스턴스를 반환하는지 확인

        Given: 두 번 get_script_service() 호출
        When: 반환된 인스턴스 비교
        Then: 동일한 인스턴스
        """
        # When
        service1 = get_script_service()
        service2 = get_script_service()

        # Then
        assert service1 is service2


class TestInappropriateContentDetection:
    """_contains_inappropriate_content() 메서드 테스트"""

    def test_contains_inappropriate_content_true(self):
        """
        부적절한 콘텐츠 감지 - True

        Given: 금지 키워드 포함 텍스트
        When: _contains_inappropriate_content() 호출
        Then: True 반환
        """
        # Given
        service = ScriptGenerationService()

        # When & Then
        assert service._contains_inappropriate_content("이것은 폭력적인 내용입니다") is True
        assert service._contains_inappropriate_content("혐오 발언 포함") is True
        assert service._contains_inappropriate_content("성인 콘텐츠") is True
        assert service._contains_inappropriate_content("도박 사이트 홍보") is True
        assert service._contains_inappropriate_content("마약 관련") is True

    def test_contains_inappropriate_content_false(self):
        """
        부적절한 콘텐츠 감지 - False

        Given: 적절한 텍스트
        When: _contains_inappropriate_content() 호출
        Then: False 반환
        """
        # Given
        service = ScriptGenerationService()

        # When & Then
        assert service._contains_inappropriate_content("건강한 생활 습관") is False
        assert service._contains_inappropriate_content("AI 기술 소개") is False
        assert service._contains_inappropriate_content("여행 추천") is False

    def test_contains_inappropriate_content_case_insensitive(self):
        """
        대소문자 구분 없이 감지

        Given: 대문자로 작성된 금지 키워드
        When: _contains_inappropriate_content() 호출
        Then: True 반환
        """
        # Given
        service = ScriptGenerationService()

        # When & Then
        assert service._contains_inappropriate_content("폭력적인") is True
        assert service._contains_inappropriate_content("혐오스러운") is True
