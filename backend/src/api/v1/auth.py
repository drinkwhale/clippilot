"""
Authentication API endpoints for ClipPilot
Handles signup, login, password reset, and account management

Requirements:
- FR-021: Email/password signup
- FR-022: Password minimum 8 characters
- FR-023: Login with 3-attempt lockout
- FR-024: Password reset
- FR-025: Account deletion with 30-day grace period
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...middleware.auth import get_current_user
from ...models.user import User
from ...schemas.auth import (
    SignupRequest,
    LoginRequest,
    TokenResponse,
    ResetPasswordRequest,
    DeleteAccountRequest,
    LoginAttemptResponse,
)
from ...schemas.base import SuccessResponse
from ...services.auth_service import (
    AuthService,
    AuthenticationError,
    AccountLockedError,
    InvalidCredentialsError,
    AccountExistsError,
)


router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post(
    "/signup",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="회원가입",
    description="이메일과 비밀번호로 새 계정을 생성합니다 (FR-021, FR-022)",
)
async def signup(
    signup_data: SignupRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """
    Register a new user account

    Requirements:
    - FR-021: Email/password based signup
    - FR-022: Password minimum 8 characters (validated by schema)

    Args:
        signup_data: Email and password for new account
        db: Database session

    Returns:
        TokenResponse with access token and user info

    Raises:
        HTTPException 400: If email already exists
        HTTPException 500: If signup fails
    """
    auth_service = AuthService(db)

    try:
        token_response = await auth_service.signup(signup_data)
        return token_response

    except AccountExistsError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "ALREADY_EXISTS",
                    "message": str(e),
                }
            },
        )
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": str(e),
                }
            },
        )


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="로그인",
    description="이메일과 비밀번호로 로그인합니다. 3회 실패 시 15분간 잠김 (FR-023)",
)
async def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """
    Authenticate user and generate access token

    Requirements:
    - FR-023: Email/password login with 3-attempt lockout (15 minutes)

    Args:
        login_data: Email and password
        db: Database session

    Returns:
        TokenResponse with access token and user info

    Raises:
        HTTPException 401: If credentials are invalid
        HTTPException 423: If account is locked (3 failed attempts)
    """
    auth_service = AuthService(db)

    try:
        token_response = await auth_service.login(login_data)
        return token_response

    except AccountLockedError as e:
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail={
                "error": {
                    "code": "ACCOUNT_LOCKED",
                    "message": f"로그인 시도 횟수를 초과했습니다. {e.locked_until.strftime('%Y-%m-%d %H:%M:%S')}까지 잠금됩니다.",
                    "details": {
                        "locked_until": e.locked_until.isoformat(),
                    },
                }
            },
        )
    except InvalidCredentialsError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "code": "INVALID_CREDENTIALS",
                    "message": str(e),
                }
            },
        )


@router.get(
    "/login-attempts",
    response_model=LoginAttemptResponse,
    summary="로그인 시도 횟수 조회",
    description="특정 이메일의 로그인 시도 횟수와 잠금 상태를 조회합니다",
)
async def get_login_attempts(
    email: str,
    db: Session = Depends(get_db),
) -> LoginAttemptResponse:
    """
    Get login attempt information for an email

    Args:
        email: User email address
        db: Database session

    Returns:
        LoginAttemptResponse with attempt count and lock status
    """
    auth_service = AuthService(db)
    attempts, locked_until = await auth_service.get_login_attempts(email)

    return LoginAttemptResponse(
        attempts=attempts,
        max_attempts=AuthService.MAX_LOGIN_ATTEMPTS,
        locked=locked_until is not None,
        locked_until=locked_until.isoformat() if locked_until else None,
        remaining_attempts=max(0, AuthService.MAX_LOGIN_ATTEMPTS - attempts),
    )


@router.post(
    "/reset-password",
    response_model=SuccessResponse,
    summary="비밀번호 재설정 요청",
    description="비밀번호 재설정 이메일을 발송합니다 (FR-024)",
)
async def reset_password(
    reset_data: ResetPasswordRequest,
    db: Session = Depends(get_db),
) -> SuccessResponse:
    """
    Send password reset email

    Requirements:
    - FR-024: Password reset functionality

    Args:
        reset_data: Email address for password reset
        db: Database session

    Returns:
        SuccessResponse confirming email sent
    """
    auth_service = AuthService(db)
    await auth_service.reset_password(reset_data)

    return SuccessResponse(
        success=True,
        message="비밀번호 재설정 이메일이 발송되었습니다. 이메일을 확인해주세요.",
    )


@router.delete(
    "/account",
    response_model=SuccessResponse,
    summary="계정 삭제",
    description="사용자 계정을 삭제합니다. 30일간 유예기간이 적용됩니다 (FR-025)",
)
async def delete_account(
    delete_data: DeleteAccountRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SuccessResponse:
    """
    Delete user account

    Requirements:
    - FR-025: Account deletion with 30-day grace period

    Args:
        delete_data: Password and confirmation for account deletion
        current_user: Authenticated user
        db: Database session

    Returns:
        SuccessResponse confirming deletion initiated

    Raises:
        HTTPException 400: If confirmation text is incorrect
        HTTPException 401: If password is incorrect
    """
    # Verify confirmation text
    if delete_data.confirmation != "DELETE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "INVALID_INPUT",
                    "message": "삭제 확인 문구가 올바르지 않습니다. 'DELETE'를 정확히 입력해주세요.",
                }
            },
        )

    auth_service = AuthService(db)

    try:
        await auth_service.delete_account(current_user.id, delete_data.password)

        return SuccessResponse(
            success=True,
            message="계정 삭제가 요청되었습니다. 30일 후 완전히 삭제됩니다.",
        )

    except InvalidCredentialsError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "code": "INVALID_CREDENTIALS",
                    "message": str(e),
                }
            },
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "계정 삭제 중 오류가 발생했습니다.",
                }
            },
        )
