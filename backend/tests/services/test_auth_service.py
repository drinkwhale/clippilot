"""
AuthService 단위 테스트

테스트 범위 (testing-strategy.md Phase 3):
- T032: AuthService 로직 테스트
  - 회원가입 성공 (FR-021, FR-022)
  - 중복 이메일 가입 방지
  - 로그인 성공
  - 잘못된 자격증명 처리
  - 비밀번호 재설정 (FR-024)
  - 3회 로그인 실패 시 15분 잠금 (FR-023)
"""

import pytest
from datetime import datetime, timedelta
from uuid import uuid4
from unittest.mock import Mock, patch, MagicMock

from src.services.auth_service import (
    AuthService,
    AuthenticationError,
    AccountLockedError,
    InvalidCredentialsError,
    AccountExistsError,
)
from src.models.user import User, PlanType, OAuthProvider
from src.models.subscription import Subscription, SubscriptionPlan, SubscriptionStatus
from src.schemas.auth import SignupRequest, LoginRequest, ResetPasswordRequest


@pytest.fixture
def mock_db():
    """Mock database session"""
    return MagicMock()


@pytest.fixture
def mock_supabase():
    """Mock Supabase client"""
    mock = MagicMock()
    # Mock service auth (admin)
    mock.service.auth.admin.create_user = MagicMock()
    mock.service.auth.admin.delete_user = MagicMock()
    mock.service.auth.admin.generate_link = MagicMock()

    # Mock anon auth (public)
    mock.anon.auth.sign_in_with_password = MagicMock()
    mock.anon.auth.reset_password_email = MagicMock()

    return mock


@pytest.fixture
def auth_service(mock_db, mock_supabase):
    """AuthService instance with mocked dependencies"""
    with patch('src.services.auth_service.get_supabase', return_value=mock_supabase):
        service = AuthService(mock_db)
        return service


class TestSignup:
    """회원가입 테스트"""

    @pytest.mark.asyncio
    async def test_signup_success(self, auth_service, mock_db, mock_supabase):
        """
        회원가입 성공 테스트 (FR-021, FR-022)

        Given: 새로운 이메일과 8자 이상 비밀번호
        When: signup() 호출
        Then:
          - User 레코드 생성
          - Free 플랜 Subscription 생성
          - Access token 반환
        """
        # Given
        signup_data = SignupRequest(
            email="test@example.com",
            password="password123"
        )

        # Mock: 기존 사용자 없음
        mock_db.query().filter().first.return_value = None

        # Mock: Supabase user creation
        mock_user_response = MagicMock()
        mock_user_response.user.id = str(uuid4())
        mock_supabase.service.auth.admin.create_user.return_value = mock_user_response

        # Mock: db.refresh to set timestamps
        def mock_refresh(user):
            user.created_at = datetime.utcnow()
            user.updated_at = datetime.utcnow()
        mock_db.refresh.side_effect = mock_refresh

        # Mock: Sign in response
        mock_session = MagicMock()
        mock_session.access_token = "test_access_token"
        mock_sign_in_response = MagicMock()
        mock_sign_in_response.session = mock_session
        mock_supabase.anon.auth.sign_in_with_password.return_value = mock_sign_in_response

        # When
        result = await auth_service.signup(signup_data)

        # Then
        assert result.access_token == "test_access_token"
        assert result.token_type == "bearer"
        assert mock_db.add.call_count == 2  # User + Subscription
        assert mock_db.commit.called

    @pytest.mark.asyncio
    async def test_signup_duplicate_email(self, auth_service, mock_db):
        """
        중복 이메일 가입 방지 테스트

        Given: 이미 존재하는 이메일
        When: signup() 호출
        Then: AccountExistsError 발생
        """
        # Given
        signup_data = SignupRequest(
            email="existing@example.com",
            password="password123"
        )

        # Mock: 기존 사용자 존재
        existing_user = User(
            id=uuid4(),
            email="existing@example.com",
            plan=PlanType.FREE,
            oauth_provider=OAuthProvider.EMAIL
        )
        mock_db.query().filter().first.return_value = existing_user

        # When & Then
        with pytest.raises(AccountExistsError) as exc_info:
            await auth_service.signup(signup_data)

        assert "이미 등록된 이메일" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_signup_supabase_creation_failure(self, auth_service, mock_db, mock_supabase):
        """
        Supabase 계정 생성 실패 처리 테스트

        Given: Supabase 계정 생성 실패
        When: signup() 호출
        Then: AuthenticationError 발생 및 롤백
        """
        # Given
        signup_data = SignupRequest(
            email="test@example.com",
            password="password123"
        )

        # Mock: 기존 사용자 없음
        mock_db.query().filter().first.return_value = None

        # Mock: Supabase creation failure
        mock_supabase.service.auth.admin.create_user.side_effect = Exception("Supabase error")

        # When & Then
        with pytest.raises(AuthenticationError) as exc_info:
            await auth_service.signup(signup_data)

        assert mock_db.rollback.called


class TestLogin:
    """로그인 테스트"""

    @pytest.mark.asyncio
    async def test_login_success(self, auth_service, mock_db, mock_supabase):
        """
        로그인 성공 테스트 (FR-023)

        Given: 유효한 이메일과 비밀번호
        When: login() 호출
        Then:
          - Access token 반환
          - login_attempts 0으로 리셋
          - last_login_at 업데이트
        """
        # Given
        login_data = LoginRequest(
            email="test@example.com",
            password="password123"
        )

        # Mock: 사용자 존재 (with all required fields)
        now = datetime.utcnow()
        user = User(
            id=uuid4(),
            email="test@example.com",
            plan=PlanType.FREE,
            oauth_provider=OAuthProvider.EMAIL,
            login_attempts=0,
            is_active=True,
            email_verified=True,
            onboarding_completed=False,
            created_at=now,
            updated_at=now
        )
        mock_db.query().filter().first.return_value = user

        # Mock: db.refresh
        mock_db.refresh.side_effect = lambda x: None

        # Mock: Supabase sign in
        mock_session = MagicMock()
        mock_session.access_token = "test_access_token"
        mock_sign_in_response = MagicMock()
        mock_sign_in_response.session = mock_session
        mock_supabase.anon.auth.sign_in_with_password.return_value = mock_sign_in_response

        # When
        result = await auth_service.login(login_data)

        # Then
        assert result.access_token == "test_access_token"
        assert user.login_attempts == 0
        assert user.last_login_at is not None
        assert mock_db.commit.called

    @pytest.mark.asyncio
    async def test_login_invalid_credentials(self, auth_service, mock_db, mock_supabase):
        """
        잘못된 자격증명 처리 테스트

        Given: 잘못된 비밀번호
        When: login() 호출
        Then:
          - InvalidCredentialsError 발생
          - login_attempts 증가
        """
        # Given
        login_data = LoginRequest(
            email="test@example.com",
            password="wrong_password"
        )

        # Mock: 사용자 존재
        user = User(
            id=uuid4(),
            email="test@example.com",
            plan=PlanType.FREE,
            oauth_provider=OAuthProvider.EMAIL,
            login_attempts=0
        )
        mock_db.query().filter().first.return_value = user

        # Mock: Supabase sign in failure
        mock_supabase.anon.auth.sign_in_with_password.side_effect = Exception("Invalid credentials")

        # When & Then
        with pytest.raises(InvalidCredentialsError):
            await auth_service.login(login_data)

        # login_attempts는 증가하지만 아직 3회 미만
        assert mock_db.commit.called

    @pytest.mark.asyncio
    async def test_login_account_lockout_after_3_attempts(self, auth_service, mock_db, mock_supabase):
        """
        3회 로그인 실패 시 15분 잠금 테스트 (FR-023)

        Given: 이미 2회 실패한 계정
        When: 3번째 실패한 로그인 시도
        Then:
          - AccountLockedError 발생
          - locked_until이 15분 후로 설정
        """
        # Given
        login_data = LoginRequest(
            email="test@example.com",
            password="wrong_password"
        )

        # Mock: 사용자 (이미 2회 실패)
        user = User(
            id=uuid4(),
            email="test@example.com",
            plan=PlanType.FREE,
            oauth_provider=OAuthProvider.EMAIL,
            login_attempts=2  # 이미 2회 실패
        )
        mock_db.query().filter().first.return_value = user

        # Mock: Supabase sign in failure
        mock_supabase.anon.auth.sign_in_with_password.side_effect = Exception("Invalid credentials")

        # When & Then
        with pytest.raises(AccountLockedError) as exc_info:
            await auth_service.login(login_data)

        # locked_until이 설정되었는지 확인
        assert user.locked_until is not None
        # 15분 후인지 확인 (약간의 시간 오차 허용)
        expected_lock_time = datetime.utcnow() + timedelta(minutes=15)
        assert abs((user.locked_until - expected_lock_time).total_seconds()) < 5

    @pytest.mark.asyncio
    async def test_login_locked_account(self, auth_service, mock_db):
        """
        잠긴 계정 로그인 시도 테스트

        Given: locked_until이 미래인 계정
        When: login() 호출
        Then: AccountLockedError 발생 (즉시)
        """
        # Given
        login_data = LoginRequest(
            email="test@example.com",
            password="password123"
        )

        # Mock: 잠긴 사용자
        locked_until = datetime.utcnow() + timedelta(minutes=10)
        user = User(
            id=uuid4(),
            email="test@example.com",
            plan=PlanType.FREE,
            oauth_provider=OAuthProvider.EMAIL,
            login_attempts=3,
            locked_until=locked_until
        )
        mock_db.query().filter().first.return_value = user

        # When & Then
        with pytest.raises(AccountLockedError) as exc_info:
            await auth_service.login(login_data)

        assert exc_info.value.locked_until == locked_until

    @pytest.mark.asyncio
    async def test_login_expired_lock_reset(self, auth_service, mock_db, mock_supabase):
        """
        만료된 잠금 자동 해제 테스트

        Given: locked_until이 과거인 계정
        When: login() 호출 (올바른 비밀번호)
        Then:
          - login_attempts 0으로 리셋
          - locked_until None으로 리셋
          - 정상 로그인 성공
        """
        # Given
        login_data = LoginRequest(
            email="test@example.com",
            password="password123"
        )

        # Mock: 잠금 만료된 사용자 (with all required fields)
        now = datetime.utcnow()
        user = User(
            id=uuid4(),
            email="test@example.com",
            plan=PlanType.FREE,
            oauth_provider=OAuthProvider.EMAIL,
            login_attempts=3,
            locked_until=datetime.utcnow() - timedelta(minutes=1),  # 과거
            is_active=True,
            email_verified=True,
            onboarding_completed=False,
            created_at=now,
            updated_at=now
        )
        mock_db.query().filter().first.return_value = user

        # Mock: db.refresh
        mock_db.refresh.side_effect = lambda x: None

        # Mock: Supabase sign in
        mock_session = MagicMock()
        mock_session.access_token = "test_access_token"
        mock_sign_in_response = MagicMock()
        mock_sign_in_response.session = mock_session
        mock_supabase.anon.auth.sign_in_with_password.return_value = mock_sign_in_response

        # When
        result = await auth_service.login(login_data)

        # Then
        assert result.access_token == "test_access_token"
        assert user.login_attempts == 0
        assert user.locked_until is None


class TestPasswordReset:
    """비밀번호 재설정 테스트"""

    @pytest.mark.asyncio
    async def test_reset_password_success(self, auth_service, mock_supabase):
        """
        비밀번호 재설정 이메일 전송 테스트 (FR-024)

        Given: 유효한 이메일
        When: reset_password() 호출
        Then: True 반환 (보안상 존재 여부 노출하지 않음)
        """
        # Given
        reset_data = ResetPasswordRequest(email="test@example.com")

        # Mock: Supabase reset email
        mock_supabase.anon.auth.reset_password_email.return_value = None

        # When
        result = await auth_service.reset_password(reset_data)

        # Then
        assert result is True
        assert mock_supabase.anon.auth.reset_password_email.called

    @pytest.mark.asyncio
    async def test_reset_password_nonexistent_email(self, auth_service, mock_supabase):
        """
        존재하지 않는 이메일에 대한 재설정 요청 테스트

        Given: 존재하지 않는 이메일
        When: reset_password() 호출
        Then: True 반환 (보안상 존재 여부 노출하지 않음)
        """
        # Given
        reset_data = ResetPasswordRequest(email="nonexistent@example.com")

        # Mock: Supabase error (user not found)
        mock_supabase.anon.auth.reset_password_email.side_effect = Exception("User not found")

        # When
        result = await auth_service.reset_password(reset_data)

        # Then - 보안상 항상 True 반환
        assert result is True


class TestAccountDeletion:
    """계정 삭제 테스트"""

    @pytest.mark.asyncio
    async def test_delete_account_success(self, auth_service, mock_db, mock_supabase):
        """
        계정 삭제 성공 테스트 (FR-025)

        Given: 유효한 비밀번호
        When: delete_account() 호출
        Then:
          - is_active = False로 설정
          - Supabase에서도 삭제
        """
        # Given
        user_id = uuid4()
        password = "password123"

        # Mock: 사용자 존재
        user = User(
            id=user_id,
            email="test@example.com",
            plan=PlanType.FREE,
            oauth_provider=OAuthProvider.EMAIL
        )
        mock_db.query().filter().first.return_value = user

        # Mock: Password verification
        mock_session = MagicMock()
        mock_sign_in_response = MagicMock()
        mock_sign_in_response.session = mock_session
        mock_supabase.anon.auth.sign_in_with_password.return_value = mock_sign_in_response

        # When
        result = await auth_service.delete_account(user_id, password)

        # Then
        assert result is True
        assert user.is_active is False
        assert mock_db.commit.called
        assert mock_supabase.service.auth.admin.delete_user.called

    @pytest.mark.asyncio
    async def test_delete_account_invalid_password(self, auth_service, mock_db, mock_supabase):
        """
        잘못된 비밀번호로 계정 삭제 시도 테스트

        Given: 잘못된 비밀번호
        When: delete_account() 호출
        Then: InvalidCredentialsError 발생
        """
        # Given
        user_id = uuid4()
        password = "wrong_password"

        # Mock: 사용자 존재
        user = User(
            id=user_id,
            email="test@example.com",
            plan=PlanType.FREE,
            oauth_provider=OAuthProvider.EMAIL
        )
        mock_db.query().filter().first.return_value = user

        # Mock: Password verification failure
        mock_supabase.anon.auth.sign_in_with_password.side_effect = Exception("Invalid password")

        # When & Then
        with pytest.raises(InvalidCredentialsError):
            await auth_service.delete_account(user_id, password)


class TestLoginAttempts:
    """로그인 시도 추적 테스트"""

    @pytest.mark.asyncio
    async def test_get_login_attempts_no_user(self, auth_service, mock_db):
        """
        존재하지 않는 사용자의 로그인 시도 조회

        Given: 존재하지 않는 이메일
        When: get_login_attempts() 호출
        Then: (0, None) 반환
        """
        # Given
        mock_db.query().filter().first.return_value = None

        # When
        attempts, locked_until = await auth_service.get_login_attempts("test@example.com")

        # Then
        assert attempts == 0
        assert locked_until is None

    @pytest.mark.asyncio
    async def test_get_login_attempts_active_lock(self, auth_service, mock_db):
        """
        잠긴 계정의 로그인 시도 조회

        Given: 잠긴 사용자
        When: get_login_attempts() 호출
        Then: (attempts, locked_until) 반환
        """
        # Given
        locked_until = datetime.utcnow() + timedelta(minutes=10)
        user = User(
            id=uuid4(),
            email="test@example.com",
            plan=PlanType.FREE,
            oauth_provider=OAuthProvider.EMAIL,
            login_attempts=3,
            locked_until=locked_until
        )
        mock_db.query().filter().first.return_value = user

        # When
        attempts, lock_time = await auth_service.get_login_attempts("test@example.com")

        # Then
        assert attempts == 3
        assert lock_time == locked_until

    @pytest.mark.asyncio
    async def test_get_login_attempts_expired_lock_cleared(self, auth_service, mock_db):
        """
        만료된 잠금 자동 해제 확인

        Given: 잠금 만료된 사용자
        When: get_login_attempts() 호출
        Then:
          - (0, None) 반환
          - DB에서 잠금 정보 삭제
        """
        # Given
        user = User(
            id=uuid4(),
            email="test@example.com",
            plan=PlanType.FREE,
            oauth_provider=OAuthProvider.EMAIL,
            login_attempts=3,
            locked_until=datetime.utcnow() - timedelta(minutes=1)  # 과거
        )
        mock_db.query().filter().first.return_value = user

        # When
        attempts, lock_time = await auth_service.get_login_attempts("test@example.com")

        # Then
        assert attempts == 0
        assert lock_time is None
        assert user.login_attempts == 0
        assert user.locked_until is None
        assert mock_db.commit.called
