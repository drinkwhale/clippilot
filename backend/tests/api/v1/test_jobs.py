"""
Jobs API 통합 테스트

테스트 범위 (Phase 5 US1):
- T065: Job API 테스트
  - POST /api/v1/jobs - 작업 생성 (FR-001)
  - GET /api/v1/jobs - 작업 목록 조회 (FR-010)
  - GET /api/v1/jobs/{id} - 작업 상세 조회 (FR-020)
  - PATCH /api/v1/jobs/{id} - 작업 수정 (FR-019)
  - POST /api/v1/jobs/{id}/retry - 재시도 (FR-011, FR-029)
  - GET /api/v1/jobs/{id}/download - 다운로드 (FR-029)
  - Quota 검증 (FR-008)
  - Template 권한 검증
"""

import pytest
from uuid import uuid4, UUID
from datetime import datetime
from unittest.mock import Mock, MagicMock, patch
from fastapi import status

from src.models.user import User, PlanType, OAuthProvider
from src.models.job import Job, JobStatus
from src.models.template import Template
from src.schemas.job import JobCreate, JobUpdate


@pytest.fixture
def mock_current_user():
    """Mock authenticated user"""
    user = User(
        id=uuid4(),
        email="test@example.com",
        plan=PlanType.FREE,
        oauth_provider=OAuthProvider.EMAIL,
        is_active=True,
        email_verified=True,
        onboarding_completed=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    return user


@pytest.fixture
def mock_db_session():
    """Mock database session"""
    return MagicMock()


@pytest.fixture
def mock_quota_service():
    """Mock quota service"""
    with patch('src.api.v1.jobs.get_quota_service') as mock_get_quota:
        mock_service = MagicMock()
        mock_service.validate_quota = MagicMock()
        mock_get_quota.return_value = mock_service
        yield mock_service


class TestCreateJob:
    """작업 생성 API 테스트"""

    def test_create_job_success(
        self,
        client,
        mock_current_user,
        mock_db_session,
        mock_quota_service
    ):
        """
        작업 생성 성공 테스트 (FR-001)

        Given: 유효한 프롬프트, Quota OK
        When: POST /api/v1/jobs
        Then:
          - 201 Created
          - Job 객체 반환
          - status: queued
        """
        # Given
        job_data = {
            "prompt": "AI 기술 소개 영상",
            "template_id": None
        }

        # Mock: DB session
        with patch('src.api.v1.jobs.get_db', return_value=mock_db_session):
            # Mock: get_current_user
            with patch('src.api.v1.jobs.get_current_user', return_value=mock_current_user):
                # Mock: Quota validation OK
                mock_quota_service.validate_quota.return_value = None

                # Mock: Job creation
                created_job = Job(
                    id=uuid4(),
                    user_id=mock_current_user.id,
                    template_id=None,
                    prompt=job_data["prompt"],
                    status=JobStatus.QUEUED,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                mock_db_session.add = MagicMock()
                mock_db_session.commit = MagicMock()
                mock_db_session.refresh = MagicMock(side_effect=lambda x: setattr(x, 'id', created_job.id))

                # When
                response = client.post("/api/v1/jobs", json=job_data)

                # Then
                assert response.status_code == status.HTTP_201_CREATED
                data = response.json()
                assert data["prompt"] == job_data["prompt"]
                assert data["status"] == "queued"
                assert "id" in data

    def test_create_job_quota_exceeded(
        self,
        client,
        mock_current_user,
        mock_db_session,
        mock_quota_service
    ):
        """
        할당량 초과 시 작업 생성 실패 테스트 (FR-008)

        Given: Quota 초과
        When: POST /api/v1/jobs
        Then: 429 Too Many Requests
        """
        # Given
        job_data = {
            "prompt": "테스트 프롬프트",
            "template_id": None
        }

        # Mock: Quota exceeded
        from src.core.exceptions import QuotaExceededError
        mock_quota_service.validate_quota.side_effect = QuotaExceededError(
            message="월간 생성 한도(20회)를 초과했습니다.",
            quota_limit=20,
            quota_used=20,
            quota_reset_at="2025-12-01T00:00:00"
        )

        with patch('src.api.v1.jobs.get_db', return_value=mock_db_session):
            with patch('src.api.v1.jobs.get_current_user', return_value=mock_current_user):
                # When
                response = client.post("/api/v1/jobs", json=job_data)

                # Then
                assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS
                data = response.json()
                assert "quota_limit" in data
                assert data["quota_limit"] == 20

    def test_create_job_with_template(
        self,
        client,
        mock_current_user,
        mock_db_session,
        mock_quota_service
    ):
        """
        템플릿 사용 작업 생성 테스트

        Given: 유효한 template_id
        When: POST /api/v1/jobs
        Then: 템플릿 적용된 작업 생성
        """
        # Given
        template_id = uuid4()
        job_data = {
            "prompt": "테스트",
            "template_id": str(template_id)
        }

        # Mock: Template 존재
        template = Template(
            id=template_id,
            user_id=mock_current_user.id,
            name="기본 템플릿",
            is_system_default=False
        )

        with patch('src.api.v1.jobs.get_db', return_value=mock_db_session):
            with patch('src.api.v1.jobs.get_current_user', return_value=mock_current_user):
                # Mock: Template 조회
                def mock_execute(stmt):
                    mock_result = Mock()
                    mock_result.scalar_one_or_none.return_value = template
                    return mock_result

                mock_db_session.execute = mock_execute
                mock_quota_service.validate_quota.return_value = None

                # When
                response = client.post("/api/v1/jobs", json=job_data)

                # Then
                assert response.status_code == status.HTTP_201_CREATED
                data = response.json()
                assert data["template_id"] == str(template_id)

    def test_create_job_invalid_template(
        self,
        client,
        mock_current_user,
        mock_db_session,
        mock_quota_service
    ):
        """
        존재하지 않는 템플릿 작업 생성 실패 테스트

        Given: 존재하지 않는 template_id
        When: POST /api/v1/jobs
        Then: 400 Bad Request
        """
        # Given
        job_data = {
            "prompt": "테스트",
            "template_id": str(uuid4())  # 존재하지 않음
        }

        with patch('src.api.v1.jobs.get_db', return_value=mock_db_session):
            with patch('src.api.v1.jobs.get_current_user', return_value=mock_current_user):
                # Mock: Template not found
                mock_db_session.execute.return_value.scalar_one_or_none.return_value = None

                # When
                response = client.post("/api/v1/jobs", json=job_data)

                # Then
                assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestListJobs:
    """작업 목록 조회 API 테스트"""

    def test_list_jobs_success(
        self,
        client,
        mock_current_user,
        mock_db_session
    ):
        """
        작업 목록 조회 성공 테스트 (FR-010)

        Given: 사용자가 생성한 3개 작업
        When: GET /api/v1/jobs
        Then: 작업 목록 반환 (페이지네이션)
        """
        # Given
        jobs = [
            Job(
                id=uuid4(),
                user_id=mock_current_user.id,
                prompt=f"프롬프트 {i}",
                status=JobStatus.QUEUED,
                created_at=datetime.utcnow()
            )
            for i in range(3)
        ]

        with patch('src.api.v1.jobs.get_db', return_value=mock_db_session):
            with patch('src.api.v1.jobs.get_current_user', return_value=mock_current_user):
                # Mock: DB query
                def mock_execute(stmt):
                    mock_result = Mock()
                    # Count query
                    if 'count' in str(stmt).lower():
                        mock_result.scalar_one.return_value = len(jobs)
                    else:
                        mock_result.scalars.return_value.all.return_value = jobs
                    return mock_result

                mock_db_session.execute = mock_execute

                # When
                response = client.get("/api/v1/jobs")

                # Then
                assert response.status_code == status.HTTP_200_OK
                data = response.json()
                assert data["total"] == 3
                assert len(data["jobs"]) == 3
                assert data["page"] == 1
                assert data["page_size"] == 20

    def test_list_jobs_with_status_filter(
        self,
        client,
        mock_current_user,
        mock_db_session
    ):
        """
        상태 필터링 작업 목록 조회 테스트

        Given: 다양한 상태의 작업들
        When: GET /api/v1/jobs?status_filter=done
        Then: done 상태 작업만 반환
        """
        # Given
        done_jobs = [
            Job(
                id=uuid4(),
                user_id=mock_current_user.id,
                prompt="완료된 작업",
                status=JobStatus.DONE,
                created_at=datetime.utcnow()
            )
        ]

        with patch('src.api.v1.jobs.get_db', return_value=mock_db_session):
            with patch('src.api.v1.jobs.get_current_user', return_value=mock_current_user):
                def mock_execute(stmt):
                    mock_result = Mock()
                    if 'count' in str(stmt).lower():
                        mock_result.scalar_one.return_value = len(done_jobs)
                    else:
                        mock_result.scalars.return_value.all.return_value = done_jobs
                    return mock_result

                mock_db_session.execute = mock_execute

                # When
                response = client.get("/api/v1/jobs?status_filter=done")

                # Then
                assert response.status_code == status.HTTP_200_OK
                data = response.json()
                assert data["total"] == 1
                assert data["jobs"][0]["status"] == "done"

    def test_list_jobs_pagination(
        self,
        client,
        mock_current_user,
        mock_db_session
    ):
        """
        페이지네이션 테스트

        Given: 50개 작업
        When: GET /api/v1/jobs?page=2&page_size=20
        Then: 2페이지 (21-40번) 작업 반환
        """
        # Given
        jobs_page2 = [
            Job(
                id=uuid4(),
                user_id=mock_current_user.id,
                prompt=f"작업 {i}",
                status=JobStatus.QUEUED,
                created_at=datetime.utcnow()
            )
            for i in range(21, 41)
        ]

        with patch('src.api.v1.jobs.get_db', return_value=mock_db_session):
            with patch('src.api.v1.jobs.get_current_user', return_value=mock_current_user):
                def mock_execute(stmt):
                    mock_result = Mock()
                    if 'count' in str(stmt).lower():
                        mock_result.scalar_one.return_value = 50
                    else:
                        mock_result.scalars.return_value.all.return_value = jobs_page2
                    return mock_result

                mock_db_session.execute = mock_execute

                # When
                response = client.get("/api/v1/jobs?page=2&page_size=20")

                # Then
                assert response.status_code == status.HTTP_200_OK
                data = response.json()
                assert data["total"] == 50
                assert data["page"] == 2
                assert len(data["jobs"]) == 20


class TestGetJob:
    """작업 상세 조회 API 테스트"""

    def test_get_job_success(
        self,
        client,
        mock_current_user,
        mock_db_session
    ):
        """
        작업 상세 조회 성공 테스트 (FR-020)

        Given: 유효한 job_id
        When: GET /api/v1/jobs/{job_id}
        Then: Job 상세 정보 반환
        """
        # Given
        job_id = uuid4()
        job = Job(
            id=job_id,
            user_id=mock_current_user.id,
            prompt="테스트 프롬프트",
            status=JobStatus.DONE,
            script="테스트 스크립트",
            created_at=datetime.utcnow()
        )

        with patch('src.api.v1.jobs.get_db', return_value=mock_db_session):
            with patch('src.api.v1.jobs.get_current_user', return_value=mock_current_user):
                mock_db_session.execute.return_value.scalar_one_or_none.return_value = job

                # When
                response = client.get(f"/api/v1/jobs/{job_id}")

                # Then
                assert response.status_code == status.HTTP_200_OK
                data = response.json()
                assert data["id"] == str(job_id)
                assert data["prompt"] == "테스트 프롬프트"
                assert data["status"] == "done"

    def test_get_job_not_found(
        self,
        client,
        mock_current_user,
        mock_db_session
    ):
        """
        존재하지 않는 작업 조회 테스트

        Given: 존재하지 않는 job_id
        When: GET /api/v1/jobs/{job_id}
        Then: 404 Not Found
        """
        # Given
        job_id = uuid4()

        with patch('src.api.v1.jobs.get_db', return_value=mock_db_session):
            with patch('src.api.v1.jobs.get_current_user', return_value=mock_current_user):
                mock_db_session.execute.return_value.scalar_one_or_none.return_value = None

                # When
                response = client.get(f"/api/v1/jobs/{job_id}")

                # Then
                assert response.status_code == status.HTTP_404_NOT_FOUND


class TestUpdateJob:
    """작업 수정 API 테스트"""

    def test_update_job_script(
        self,
        client,
        mock_current_user,
        mock_db_session
    ):
        """
        스크립트 수정 테스트 (FR-019)

        Given: 생성된 작업
        When: PATCH /api/v1/jobs/{job_id} (script 수정)
        Then: 스크립트 업데이트
        """
        # Given
        job_id = uuid4()
        job = Job(
            id=job_id,
            user_id=mock_current_user.id,
            prompt="원본 프롬프트",
            script="원본 스크립트",
            status=JobStatus.GENERATING,
            created_at=datetime.utcnow()
        )

        update_data = {
            "script": "수정된 스크립트"
        }

        with patch('src.api.v1.jobs.get_db', return_value=mock_db_session):
            with patch('src.api.v1.jobs.get_current_user', return_value=mock_current_user):
                mock_db_session.execute.return_value.scalar_one_or_none.return_value = job
                mock_db_session.commit = MagicMock()
                mock_db_session.refresh = MagicMock()

                # When
                response = client.patch(f"/api/v1/jobs/{job_id}", json=update_data)

                # Then
                assert response.status_code == status.HTTP_200_OK
                assert job.script == "수정된 스크립트"

    def test_update_job_metadata(
        self,
        client,
        mock_current_user,
        mock_db_session
    ):
        """
        메타데이터 수정 테스트

        Given: 생성된 작업
        When: PATCH /api/v1/jobs/{job_id} (metadata_json 수정)
        Then: 메타데이터 업데이트
        """
        # Given
        job_id = uuid4()
        job = Job(
            id=job_id,
            user_id=mock_current_user.id,
            prompt="프롬프트",
            metadata_json={"title": "원본 제목"},
            status=JobStatus.GENERATING,
            created_at=datetime.utcnow()
        )

        update_data = {
            "metadata_json": {"title": "수정된 제목", "description": "새 설명"}
        }

        with patch('src.api.v1.jobs.get_db', return_value=mock_db_session):
            with patch('src.api.v1.jobs.get_current_user', return_value=mock_current_user):
                mock_db_session.execute.return_value.scalar_one_or_none.return_value = job
                mock_db_session.commit = MagicMock()
                mock_db_session.refresh = MagicMock()

                # When
                response = client.patch(f"/api/v1/jobs/{job_id}", json=update_data)

                # Then
                assert response.status_code == status.HTTP_200_OK
                assert job.metadata_json["title"] == "수정된 제목"


class TestRetryJob:
    """작업 재시도 API 테스트"""

    def test_retry_job_success(
        self,
        client,
        mock_current_user,
        mock_db_session
    ):
        """
        작업 재시도 성공 테스트 (FR-011, FR-029)

        Given: FAILED 상태 작업, retry_count < 3
        When: POST /api/v1/jobs/{job_id}/retry
        Then:
          - retry_count 증가
          - status 변경 (queued)
        """
        # Given
        job_id = uuid4()
        job = Job(
            id=job_id,
            user_id=mock_current_user.id,
            prompt="프롬프트",
            status=JobStatus.FAILED,
            error_message="OpenAI API error",
            retry_count=0,
            created_at=datetime.utcnow()
        )

        with patch('src.api.v1.jobs.get_db', return_value=mock_db_session):
            with patch('src.api.v1.jobs.get_current_user', return_value=mock_current_user):
                mock_db_session.execute.return_value.scalar_one_or_none.return_value = job
                mock_db_session.commit = MagicMock()
                mock_db_session.refresh = MagicMock()

                # Mock: Worker tasks
                with patch('src.api.v1.jobs.generate_content'):
                    # When
                    response = client.post(f"/api/v1/jobs/{job_id}/retry")

                    # Then
                    assert response.status_code == status.HTTP_200_OK
                    assert job.retry_count == 1
                    assert job.error_message is None

    def test_retry_job_max_retries_exceeded(
        self,
        client,
        mock_current_user,
        mock_db_session
    ):
        """
        최대 재시도 횟수 초과 테스트 (FR-011: 최대 3회)

        Given: retry_count = 3 (최대 도달)
        When: POST /api/v1/jobs/{job_id}/retry
        Then: 400 Bad Request (재시도 횟수 초과)
        """
        # Given
        job_id = uuid4()
        job = Job(
            id=job_id,
            user_id=mock_current_user.id,
            prompt="프롬프트",
            status=JobStatus.FAILED,
            retry_count=3,  # 최대
            created_at=datetime.utcnow()
        )

        with patch('src.api.v1.jobs.get_db', return_value=mock_db_session):
            with patch('src.api.v1.jobs.get_current_user', return_value=mock_current_user):
                mock_db_session.execute.return_value.scalar_one_or_none.return_value = job

                # When
                response = client.post(f"/api/v1/jobs/{job_id}/retry")

                # Then
                assert response.status_code == status.HTTP_400_BAD_REQUEST
                data = response.json()
                assert "재시도 횟수가 초과" in data["detail"]["error"]["message"]

    def test_retry_job_not_failed_status(
        self,
        client,
        mock_current_user,
        mock_db_session
    ):
        """
        FAILED 상태가 아닌 작업 재시도 실패 테스트

        Given: QUEUED 상태 작업
        When: POST /api/v1/jobs/{job_id}/retry
        Then: 400 Bad Request (실패한 작업만 재시도 가능)
        """
        # Given
        job_id = uuid4()
        job = Job(
            id=job_id,
            user_id=mock_current_user.id,
            prompt="프롬프트",
            status=JobStatus.QUEUED,  # Not FAILED
            retry_count=0,
            created_at=datetime.utcnow()
        )

        with patch('src.api.v1.jobs.get_db', return_value=mock_db_session):
            with patch('src.api.v1.jobs.get_current_user', return_value=mock_current_user):
                mock_db_session.execute.return_value.scalar_one_or_none.return_value = job

                # When
                response = client.post(f"/api/v1/jobs/{job_id}/retry")

                # Then
                assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestDownloadJobVideo:
    """작업 영상 다운로드 API 테스트"""

    def test_download_job_success(
        self,
        client,
        mock_current_user,
        mock_db_session
    ):
        """
        영상 다운로드 성공 테스트 (FR-029)

        Given: DONE 상태 작업 with video_url
        When: GET /api/v1/jobs/{job_id}/download
        Then: Supabase Storage URL로 리디렉트
        """
        # Given
        job_id = uuid4()
        video_url = "https://supabase.co/storage/videos/test.mp4"
        job = Job(
            id=job_id,
            user_id=mock_current_user.id,
            prompt="프롬프트",
            status=JobStatus.DONE,
            video_url=video_url,
            created_at=datetime.utcnow()
        )

        with patch('src.api.v1.jobs.get_db', return_value=mock_db_session):
            with patch('src.api.v1.jobs.get_current_user', return_value=mock_current_user):
                mock_db_session.execute.return_value.scalar_one_or_none.return_value = job

                # When
                response = client.get(f"/api/v1/jobs/{job_id}/download", follow_redirects=False)

                # Then
                assert response.status_code == status.HTTP_307_TEMPORARY_REDIRECT
                assert response.headers["location"] == video_url

    def test_download_job_no_video(
        self,
        client,
        mock_current_user,
        mock_db_session
    ):
        """
        영상이 없는 작업 다운로드 실패 테스트

        Given: video_url이 None인 작업
        When: GET /api/v1/jobs/{job_id}/download
        Then: 400 Bad Request
        """
        # Given
        job_id = uuid4()
        job = Job(
            id=job_id,
            user_id=mock_current_user.id,
            prompt="프롬프트",
            status=JobStatus.GENERATING,
            video_url=None,  # 영상 없음
            created_at=datetime.utcnow()
        )

        with patch('src.api.v1.jobs.get_db', return_value=mock_db_session):
            with patch('src.api.v1.jobs.get_current_user', return_value=mock_current_user):
                mock_db_session.execute.return_value.scalar_one_or_none.return_value = job

                # When
                response = client.get(f"/api/v1/jobs/{job_id}/download")

                # Then
                assert response.status_code == status.HTTP_400_BAD_REQUEST
