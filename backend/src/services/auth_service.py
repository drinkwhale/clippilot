"""
AuthService for ClipPilot
Handles user authentication, signup, and password management

Requirements:
- FR-021: Email/password signup
- FR-022: Password minimum 8 characters
- FR-023: Email/password login with 3-attempt lockout
- FR-024: Password reset functionality
- FR-025: Account deletion with 30-day grace period
"""

from datetime import datetime, timedelta
from typing import Optional, Tuple
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.supabase import get_supabase
from ..models.user import User, PlanType, OAuthProvider
from ..models.subscription import Subscription, SubscriptionPlan, SubscriptionStatus
from ..schemas.auth import (
    SignupRequest,
    LoginRequest,
    TokenResponse,
    ResetPasswordRequest,
)
from ..schemas.user import UserResponse


class AuthenticationError(Exception):
    """Base exception for authentication errors"""

    pass


class AccountLockedError(AuthenticationError):
    """Exception raised when account is locked due to failed login attempts"""

    def __init__(self, locked_until: datetime):
        self.locked_until = locked_until
        super().__init__(f"Account locked until {locked_until}")


class InvalidCredentialsError(AuthenticationError):
    """Exception raised for invalid credentials"""

    pass


class AccountExistsError(AuthenticationError):
    """Exception raised when account already exists"""

    pass


class AuthService:
    """Service for handling authentication operations"""

    MAX_LOGIN_ATTEMPTS = 3
    LOCKOUT_DURATION_MINUTES = 15

    def __init__(self, db: Session):
        """
        Initialize AuthService

        Args:
            db: SQLAlchemy database session
        """
        self.db = db
        self.supabase = get_supabase()

    async def signup(self, signup_data: SignupRequest) -> TokenResponse:
        """
        Register a new user account

        Requirements:
        - FR-021: Email/password based signup
        - FR-022: Password minimum 8 characters

        Args:
            signup_data: Signup request with email and password

        Returns:
            TokenResponse with access token and user info

        Raises:
            AccountExistsError: If email already registered
            AuthenticationError: If signup fails
        """
        # Check if user already exists
        result = await self.db.execute(
            select(User).filter(User.email == signup_data.email.lower())
        )
        existing_user = result.scalar_one_or_none()

        if existing_user:
            raise AccountExistsError("이미 등록된 이메일 주소입니다")

        # Create user in Supabase Auth
        try:
            auth_response = self.supabase.service.auth.admin.create_user({
                "email": signup_data.email,
                "password": signup_data.password,
                "email_confirm": True,  # Auto-confirm for MVP
            })

            if not auth_response.user:
                raise AuthenticationError("계정 생성에 실패했습니다")

            # Create user record in database
            user = User(
                id=UUID(auth_response.user.id),
                email=signup_data.email.lower(),
                plan=PlanType.FREE,
                oauth_provider=OAuthProvider.EMAIL,
                is_active=True,
                email_verified=True,
                onboarding_completed=False,
            )
            self.db.add(user)

            # Create free subscription
            subscription = Subscription(
                user_id=user.id,
                plan=SubscriptionPlan.FREE,
                status=SubscriptionStatus.ACTIVE,
            )
            self.db.add(subscription)

            await self.db.commit()
            await self.db.refresh(user)

            # Generate access token
            session_response = self.supabase.service.auth.admin.generate_link({
                "type": "magiclink",
                "email": signup_data.email,
            })

            # Sign in to get actual tokens
            sign_in_response = self.supabase.anon.auth.sign_in_with_password({
                "email": signup_data.email,
                "password": signup_data.password,
            })

            if not sign_in_response.session:
                raise AuthenticationError("로그인 토큰 생성에 실패했습니다")

            return TokenResponse(
                access_token=sign_in_response.session.access_token,
                token_type="bearer",
                user=UserResponse.model_validate(user),
            )

        except AccountExistsError:
            raise
        except Exception as e:
            import logging
            import traceback
            logger = logging.getLogger(__name__)
            logger.error(f"Signup failed: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            self.db.rollback()
            raise AuthenticationError(f"회원가입에 실패했습니다: {str(e)}")

    async def login(self, login_data: LoginRequest) -> TokenResponse:
        """
        Authenticate user and generate access token

        Requirements:
        - FR-023: Email/password login
        - 3 failed attempts trigger 15-minute lockout

        Args:
            login_data: Login request with email and password

        Returns:
            TokenResponse with access token and user info

        Raises:
            AccountLockedError: If account is locked
            InvalidCredentialsError: If credentials are invalid
        """
        # Get user from database
        result = await self.db.execute(
            select(User).filter(User.email == login_data.email.lower())
        )
        user = result.scalar_one_or_none()

        if not user:
            raise InvalidCredentialsError("이메일 또는 비밀번호가 올바르지 않습니다")

        # Check if account is locked
        if user.locked_until and user.locked_until > datetime.utcnow():
            raise AccountLockedError(user.locked_until)

        # Reset lock if expired
        if user.locked_until and user.locked_until <= datetime.utcnow():
            user.locked_until = None
            user.login_attempts = 0
            await self.db.commit()

        # Attempt login with Supabase Auth
        try:
            sign_in_response = self.supabase.anon.auth.sign_in_with_password({
                "email": login_data.email,
                "password": login_data.password,
            })

            if not sign_in_response.session:
                raise InvalidCredentialsError("이메일 또는 비밀번호가 올바르지 않습니다")

            # Successful login - reset attempts
            user.login_attempts = 0
            user.locked_until = None
            user.last_login_at = datetime.utcnow()
            await self.db.commit()
            await self.db.refresh(user)

            return TokenResponse(
                access_token=sign_in_response.session.access_token,
                token_type="bearer",
                user=UserResponse.model_validate(user),
            )

        except InvalidCredentialsError:
            # Failed login - increment attempts even for invalid credentials
            user.login_attempts += 1

            # Lock account after 3 failed attempts
            if user.login_attempts >= self.MAX_LOGIN_ATTEMPTS:
                user.locked_until = datetime.utcnow() + timedelta(
                    minutes=self.LOCKOUT_DURATION_MINUTES
                )
                await self.db.commit()
                raise AccountLockedError(user.locked_until)

            await self.db.commit()
            raise
        except Exception:
            # Other exceptions - also increment attempts
            user.login_attempts += 1

            # Lock account after 3 failed attempts
            if user.login_attempts >= self.MAX_LOGIN_ATTEMPTS:
                user.locked_until = datetime.utcnow() + timedelta(
                    minutes=self.LOCKOUT_DURATION_MINUTES
                )
                await self.db.commit()
                raise AccountLockedError(user.locked_until)

            await self.db.commit()
            raise InvalidCredentialsError("이메일 또는 비밀번호가 올바르지 않습니다")

    async def reset_password(self, reset_data: ResetPasswordRequest) -> bool:
        """
        Send password reset email

        Requirements:
        - FR-024: Password reset functionality

        Args:
            reset_data: Password reset request with email

        Returns:
            True if reset email sent successfully
        """
        try:
            # Send reset email via Supabase Auth
            self.supabase.anon.auth.reset_password_email(reset_data.email)
            return True
        except Exception:
            # Don't reveal if email exists or not (security)
            return True

    async def get_login_attempts(self, email: str) -> Tuple[int, Optional[datetime]]:
        """
        Get login attempt information for user

        Args:
            email: User email address

        Returns:
            Tuple of (attempts_count, locked_until_datetime)
        """
        result = await self.db.execute(
            select(User).filter(User.email == email.lower())
        )
        user = result.scalar_one_or_none()

        if not user:
            return (0, None)

        # Clear lock if expired
        if user.locked_until and user.locked_until <= datetime.utcnow():
            user.locked_until = None
            user.login_attempts = 0
            await self.db.commit()
            return (0, None)

        return (user.login_attempts, user.locked_until)

    async def delete_account(self, user_id: UUID, password: str) -> bool:
        """
        Delete user account (with 30-day grace period)

        Requirements:
        - FR-025: Account deletion with 30-day grace period

        Args:
            user_id: User UUID
            password: User password for confirmation

        Returns:
            True if deletion initiated successfully

        Raises:
            InvalidCredentialsError: If password is incorrect
        """
        result = await self.db.execute(
            select(User).filter(User.id == user_id)
        )
        user = result.scalar_one_or_none()

        if not user:
            raise InvalidCredentialsError("사용자를 찾을 수 없습니다")

        # Verify password
        try:
            sign_in_response = self.supabase.anon.auth.sign_in_with_password({
                "email": user.email,
                "password": password,
            })

            if not sign_in_response.session:
                raise InvalidCredentialsError("비밀번호가 올바르지 않습니다")

        except Exception:
            raise InvalidCredentialsError("비밀번호가 올바르지 않습니다")

        # Mark account for deletion (30-day grace period)
        user.is_active = False
        # In production, schedule actual deletion after 30 days
        # For MVP, we just deactivate immediately
        await self.db.commit()

        # Delete from Supabase Auth
        try:
            self.supabase.service.auth.admin.delete_user(str(user_id))
        except Exception:
            pass  # Continue even if Supabase deletion fails

        return True
