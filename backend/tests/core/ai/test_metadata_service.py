"""
MetadataService 단위 테스트

테스트 범위 (Phase 5 US1):
- T063: Metadata Generation 테스트
  - 제목 생성 (최대 50자) (FR-016)
  - 설명 생성 (최대 200자)
  - 태그 생성 (3-10개)
  - 검증 및 정제 (특수문자 제거, 기본값)
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch

from src.core.ai.metadata_service import MetadataService, get_metadata_service
from src.core.exceptions import ContentGenerationError


@pytest.fixture
def mock_openai_client():
    """Mock OpenAI client"""
    client = AsyncMock()
    client.generate_metadata = AsyncMock(return_value={
        "title": "AI 기술의 미래",
        "description": "인공지능 기술이 우리 삶에 미치는 영향과 앞으로의 전망에 대해 알아봅니다.",
        "tags": ["AI", "인공지능", "기술", "미래", "혁신"],
        "tokens_in": 150,
        "tokens_out": 80,
    })
    client.estimate_cost = AsyncMock(return_value=0.003)
    return client


@pytest.fixture
def metadata_service(mock_openai_client):
    """MetadataService instance with mocked OpenAI"""
    with patch('src.core.ai.metadata_service.get_openai_client', return_value=mock_openai_client):
        service = MetadataService()
        return service


class TestMetadataGeneration:
    """메타데이터 생성 테스트"""

    @pytest.mark.asyncio
    async def test_generate_metadata_success(self, metadata_service, mock_openai_client):
        """
        메타데이터 생성 성공 테스트 (FR-016)

        Given: 유효한 스크립트와 프롬프트
        When: generate_metadata() 호출
        Then:
          - 제목, 설명, 태그 반환
          - 토큰 및 비용 정보 반환
        """
        # Given
        script = "AI 기술은 빠르게 발전하고 있습니다.\n우리 삶을 변화시키고 있습니다."
        prompt = "AI 기술 소개"

        # When
        result = await metadata_service.generate_metadata(
            script=script,
            prompt=prompt
        )

        # Then
        assert result["title"] == "AI 기술의 미래"
        assert result["description"] == "인공지능 기술이 우리 삶에 미치는 영향과 앞으로의 전망에 대해 알아봅니다."
        assert result["tags"] == ["AI", "인공지능", "기술", "미래", "혁신"]
        assert result["tokens_in"] == 150
        assert result["tokens_out"] == 80
        assert result["api_cost"] == 0.003

        # OpenAI client 호출 확인
        mock_openai_client.generate_metadata.assert_called_once_with(
            script=script,
            prompt=prompt
        )


class TestTitleValidation:
    """제목 검증 테스트"""

    @pytest.mark.asyncio
    async def test_title_truncation(self, metadata_service, mock_openai_client):
        """
        제목 길이 제한 테스트 (최대 50자)

        Given: 50자를 초과하는 제목
        When: generate_metadata() 호출
        Then: 47자 + "..." 으로 자름
        """
        # Given
        mock_openai_client.generate_metadata.return_value = {
            "title": "A" * 60,  # 60자 제목
            "description": "설명",
            "tags": ["태그1", "태그2", "태그3"],
            "tokens_in": 100,
            "tokens_out": 50,
        }

        # When
        result = await metadata_service.generate_metadata(
            script="테스트 스크립트",
            prompt="테스트"
        )

        # Then
        assert len(result["title"]) == 50
        assert result["title"].endswith("...")

    @pytest.mark.asyncio
    async def test_title_empty_default(self, metadata_service, mock_openai_client):
        """
        빈 제목 기본값 테스트

        Given: 빈 제목
        When: generate_metadata() 호출
        Then: "클립파일럿 AI 생성 영상" 기본값 사용
        """
        # Given
        mock_openai_client.generate_metadata.return_value = {
            "title": "",
            "description": "설명",
            "tags": ["태그1", "태그2", "태그3"],
            "tokens_in": 100,
            "tokens_out": 50,
        }

        # When
        result = await metadata_service.generate_metadata(
            script="테스트",
            prompt="테스트"
        )

        # Then
        assert result["title"] == "클립파일럿 AI 생성 영상"

    @pytest.mark.asyncio
    async def test_title_special_characters_removed(self, metadata_service, mock_openai_client):
        """
        제목 특수문자 제거 테스트

        Given: 특수문자 포함 제목 (|, <, >)
        When: generate_metadata() 호출
        Then: 특수문자 제거 또는 치환
        """
        # Given
        mock_openai_client.generate_metadata.return_value = {
            "title": "AI 기술 | 미래 <혁신>",
            "description": "설명",
            "tags": ["태그1", "태그2", "태그3"],
            "tokens_in": 100,
            "tokens_out": 50,
        }

        # When
        result = await metadata_service.generate_metadata(
            script="테스트",
            prompt="테스트"
        )

        # Then
        # | → -, < > → 제거
        assert "|" not in result["title"]
        assert "<" not in result["title"]
        assert ">" not in result["title"]
        assert "AI 기술 - 미래 혁신" in result["title"]


class TestDescriptionValidation:
    """설명 검증 테스트"""

    @pytest.mark.asyncio
    async def test_description_truncation(self, metadata_service, mock_openai_client):
        """
        설명 길이 제한 테스트 (최대 200자)

        Given: 200자를 초과하는 설명
        When: generate_metadata() 호출
        Then: 197자 + "..." 으로 자름
        """
        # Given
        mock_openai_client.generate_metadata.return_value = {
            "title": "제목",
            "description": "A" * 250,  # 250자 설명
            "tags": ["태그1", "태그2", "태그3"],
            "tokens_in": 100,
            "tokens_out": 50,
        }

        # When
        result = await metadata_service.generate_metadata(
            script="테스트",
            prompt="테스트"
        )

        # Then
        assert len(result["description"]) == 200
        assert result["description"].endswith("...")

    @pytest.mark.asyncio
    async def test_description_empty_default(self, metadata_service, mock_openai_client):
        """
        빈 설명 기본값 테스트

        Given: 빈 설명
        When: generate_metadata() 호출
        Then: "클립파일럿 AI로 자동 생성된 영상입니다." 기본값 사용
        """
        # Given
        mock_openai_client.generate_metadata.return_value = {
            "title": "제목",
            "description": "",
            "tags": ["태그1", "태그2", "태그3"],
            "tokens_in": 100,
            "tokens_out": 50,
        }

        # When
        result = await metadata_service.generate_metadata(
            script="테스트",
            prompt="테스트"
        )

        # Then
        assert result["description"] == "클립파일럿 AI로 자동 생성된 영상입니다."


class TestTagsValidation:
    """태그 검증 테스트"""

    @pytest.mark.asyncio
    async def test_tags_within_limit(self, metadata_service, mock_openai_client):
        """
        태그 개수 제한 테스트 (최대 10개)

        Given: 15개 태그
        When: generate_metadata() 호출
        Then: 처음 10개만 사용
        """
        # Given
        mock_openai_client.generate_metadata.return_value = {
            "title": "제목",
            "description": "설명",
            "tags": [f"태그{i}" for i in range(1, 16)],  # 15개
            "tokens_in": 100,
            "tokens_out": 50,
        }

        # When
        result = await metadata_service.generate_metadata(
            script="테스트",
            prompt="테스트"
        )

        # Then
        assert len(result["tags"]) == 10

    @pytest.mark.asyncio
    async def test_tags_minimum_count(self, metadata_service, mock_openai_client):
        """
        태그 최소 개수 테스트 (최소 3개)

        Given: 1개 태그
        When: generate_metadata() 호출
        Then: 기본 태그로 3개 채움
        """
        # Given
        mock_openai_client.generate_metadata.return_value = {
            "title": "제목",
            "description": "설명",
            "tags": ["태그1"],  # 1개만
            "tokens_in": 100,
            "tokens_out": 50,
        }

        # When
        result = await metadata_service.generate_metadata(
            script="테스트",
            prompt="테스트"
        )

        # Then
        assert len(result["tags"]) >= 3
        assert "태그1" in result["tags"]
        # 기본 태그 추가됨
        assert any(tag in result["tags"] for tag in ["숏폼", "AI", "자동생성"])

    @pytest.mark.asyncio
    async def test_tags_empty_gets_defaults(self, metadata_service, mock_openai_client):
        """
        빈 태그 기본값 테스트

        Given: 빈 태그 리스트
        When: generate_metadata() 호출
        Then: 기본 태그 3개 사용
        """
        # Given
        mock_openai_client.generate_metadata.return_value = {
            "title": "제목",
            "description": "설명",
            "tags": [],
            "tokens_in": 100,
            "tokens_out": 50,
        }

        # When
        result = await metadata_service.generate_metadata(
            script="테스트",
            prompt="테스트"
        )

        # Then
        assert len(result["tags"]) == 3
        assert "숏폼" in result["tags"]
        assert "AI" in result["tags"]
        assert "자동생성" in result["tags"]

    @pytest.mark.asyncio
    async def test_tags_deduplication(self, metadata_service, mock_openai_client):
        """
        태그 중복 제거 테스트

        Given: 중복된 태그 (대소문자 무시)
        When: generate_metadata() 호출
        Then: 중복 제거
        """
        # Given
        mock_openai_client.generate_metadata.return_value = {
            "title": "제목",
            "description": "설명",
            "tags": ["AI", "ai", "Ai", "인공지능", "AI"],  # 중복
            "tokens_in": 100,
            "tokens_out": 50,
        }

        # When
        result = await metadata_service.generate_metadata(
            script="테스트",
            prompt="테스트"
        )

        # Then
        # AI는 한 번만 나타나야 함
        ai_count = sum(1 for tag in result["tags"] if tag.lower() == "ai")
        assert ai_count == 1
        assert "인공지능" in result["tags"]

    @pytest.mark.asyncio
    async def test_tags_truncation_per_tag(self, metadata_service, mock_openai_client):
        """
        각 태그 길이 제한 테스트 (최대 30자)

        Given: 30자를 초과하는 태그
        When: generate_metadata() 호출
        Then: 각 태그를 30자로 자름
        """
        # Given
        mock_openai_client.generate_metadata.return_value = {
            "title": "제목",
            "description": "설명",
            "tags": ["A" * 50, "B" * 40, "정상태그"],
            "tokens_in": 100,
            "tokens_out": 50,
        }

        # When
        result = await metadata_service.generate_metadata(
            script="테스트",
            prompt="테스트"
        )

        # Then
        for tag in result["tags"]:
            assert len(tag) <= 30


class TestErrorHandling:
    """에러 처리 테스트"""

    @pytest.mark.asyncio
    async def test_openai_api_failure(self, metadata_service, mock_openai_client):
        """
        OpenAI API 실패 처리 테스트

        Given: OpenAI API 호출 실패
        When: generate_metadata() 호출
        Then: ContentGenerationError 발생
        """
        # Given
        mock_openai_client.generate_metadata.side_effect = Exception("OpenAI error")

        # When & Then
        with pytest.raises(ContentGenerationError) as exc_info:
            await metadata_service.generate_metadata(
                script="테스트",
                prompt="테스트"
            )

        assert "메타데이터 생성 중 오류" in str(exc_info.value)


class TestServiceSingleton:
    """서비스 싱글톤 테스트"""

    def test_get_metadata_service_singleton(self):
        """
        get_metadata_service()가 싱글톤 인스턴스를 반환하는지 확인

        Given: 두 번 get_metadata_service() 호출
        When: 반환된 인스턴스 비교
        Then: 동일한 인스턴스
        """
        # When
        service1 = get_metadata_service()
        service2 = get_metadata_service()

        # Then
        assert service1 is service2


class TestValidationHelpers:
    """검증 헬퍼 메서드 테스트"""

    def test_validate_title(self):
        """
        _validate_title() 직접 테스트

        Given: 다양한 제목 입력
        When: _validate_title() 호출
        Then: 적절히 정제
        """
        # Given
        service = MetadataService()

        # Empty title → default
        assert service._validate_title("") == "클립파일럿 AI 생성 영상"

        # Whitespace → stripped
        assert service._validate_title("  제목  ") == "제목"

        # Special characters → removed/replaced
        title = service._validate_title("제목 | 부제목 <테스트>")
        assert "|" not in title or "-" in title
        assert "<" not in title
        assert ">" not in title

        # Long title → truncated
        long_title = "A" * 60
        result = service._validate_title(long_title)
        assert len(result) == 50
        assert result.endswith("...")

    def test_validate_description(self):
        """
        _validate_description() 직접 테스트

        Given: 다양한 설명 입력
        When: _validate_description() 호출
        Then: 적절히 정제
        """
        # Given
        service = MetadataService()

        # Empty description → default
        assert service._validate_description("") == "클립파일럿 AI로 자동 생성된 영상입니다."

        # Whitespace → stripped
        assert service._validate_description("  설명  ") == "설명"

        # Long description → truncated
        long_desc = "A" * 250
        result = service._validate_description(long_desc)
        assert len(result) == 200
        assert result.endswith("...")

    def test_validate_tags(self):
        """
        _validate_tags() 직접 테스트

        Given: 다양한 태그 입력
        When: _validate_tags() 호출
        Then: 적절히 정제
        """
        # Given
        service = MetadataService()

        # Empty tags → default 3 tags
        result = service._validate_tags([])
        assert len(result) == 3
        assert all(tag in result for tag in ["숏폼", "AI", "자동생성"])

        # Duplicates → removed
        result = service._validate_tags(["AI", "ai", "Ai", "태그"])
        ai_count = sum(1 for tag in result if tag.lower() == "ai")
        assert ai_count == 1

        # Too many → limited to 10
        result = service._validate_tags([f"태그{i}" for i in range(20)])
        assert len(result) == 10

        # Too few → filled with defaults
        result = service._validate_tags(["태그1"])
        assert len(result) >= 3
        assert "태그1" in result

        # Whitespace → stripped
        result = service._validate_tags(["  태그  ", "  "])
        assert "태그" in result
        assert "  " not in result
