"""
애플리케이션 설정

환경 변수를 통해 설정을 관리합니다.
"""
from pydantic_settings import BaseSettings
from typing import Optional
from pydantic import field_validator, model_validator
import sys


class Settings(BaseSettings):
    """애플리케이션 설정"""

    # 애플리케이션 기본 설정
    APP_NAME: str = "ClipPilot"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # 데이터베이스 설정 (Supabase PostgreSQL)
    DATABASE_URL: str

    # Supabase 설정
    SUPABASE_URL: str
    SUPABASE_KEY: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: str

    # JWT 설정 (개발 환경용 기본값)
    JWT_SECRET: str = "dev-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Redis 설정
    REDIS_URL: str = "redis://localhost:6379/0"

    # Celery 설정
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    # OpenAI 설정
    OPENAI_API_KEY: str
    OPENAI_MODEL: str = "gpt-4o"

    # YouTube API 설정 (개발 환경용 기본값)
    YOUTUBE_CLIENT_ID: str = "placeholder-client-id"
    YOUTUBE_CLIENT_SECRET: str = "placeholder-secret"
    YOUTUBE_REDIRECT_URI: str = "http://localhost:3000/api/auth/callback/youtube"

    # Pexels API 설정 (개발 환경용 기본값)
    PEXELS_API_KEY: str = "placeholder-pexels-key"

    # Stripe 설정 (개발 환경용 기본값)
    STRIPE_SECRET_KEY: str = "sk_test_placeholder"
    STRIPE_PUBLISHABLE_KEY: str = "pk_test_placeholder"
    STRIPE_WEBHOOK_SECRET: str = "whsec_placeholder"
    STRIPE_PRO_PRICE_ID: str = "price_placeholder_pro"
    STRIPE_AGENCY_PRICE_ID: str = "price_placeholder_agency"

    # CORS 설정
    CORS_ORIGINS: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        """CORS_ORIGINS를 리스트로 반환"""
        if isinstance(self.CORS_ORIGINS, str):
            return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
        return self.CORS_ORIGINS if isinstance(self.CORS_ORIGINS, list) else [self.CORS_ORIGINS]

    # Sentry 설정 (선택적)
    SENTRY_DSN: Optional[str] = None

    # Rate Limiting (NFR-017)
    RATE_LIMIT_PER_MINUTE: int = 60

    # Environment
    PYTHON_ENV: str = "development"

    # Quota limits per plan (중앙화된 할당량 설정)
    QUOTA_LIMITS: dict[str, int] = {
        "free": 20,
        "pro": 500,
        "agency": 2000
    }

    @model_validator(mode='after')
    def validate_required_env_vars(self):
        """필수 환경 변수 검증"""
        errors = []

        # Production 환경에서 필수 환경 변수 체크
        if self.PYTHON_ENV == "production":
            # JWT Secret 검증
            if self.JWT_SECRET == "dev-secret-key-change-in-production":
                errors.append("JWT_SECRET must be set in production environment")

            # Supabase 검증
            if not self.SUPABASE_URL or self.SUPABASE_URL == "":
                errors.append("SUPABASE_URL is required")
            if not self.SUPABASE_SERVICE_ROLE_KEY or self.SUPABASE_SERVICE_ROLE_KEY == "":
                errors.append("SUPABASE_SERVICE_ROLE_KEY is required")

            # Database 검증
            if not self.DATABASE_URL or self.DATABASE_URL == "":
                errors.append("DATABASE_URL is required")

            # OpenAI 검증
            if not self.OPENAI_API_KEY or self.OPENAI_API_KEY == "":
                errors.append("OPENAI_API_KEY is required")

            # YouTube API 검증
            if self.YOUTUBE_CLIENT_ID == "placeholder-client-id":
                errors.append("YOUTUBE_CLIENT_ID must be set in production environment")
            if self.YOUTUBE_CLIENT_SECRET == "placeholder-secret":
                errors.append("YOUTUBE_CLIENT_SECRET must be set in production environment")

            # Pexels API 검증
            if self.PEXELS_API_KEY == "placeholder-pexels-key":
                errors.append("PEXELS_API_KEY must be set in production environment")

            # Stripe 검증
            if self.STRIPE_SECRET_KEY.startswith("sk_test_"):
                errors.append("STRIPE_SECRET_KEY must use production key (sk_live_*) in production environment")
            if self.STRIPE_PUBLISHABLE_KEY.startswith("pk_test_"):
                errors.append("STRIPE_PUBLISHABLE_KEY must use production key (pk_live_*) in production environment")

        # Development 환경에서도 기본적인 검증
        else:
            # 최소한 DATABASE_URL과 SUPABASE_URL은 설정되어야 함
            if not self.DATABASE_URL or self.DATABASE_URL == "":
                errors.append("DATABASE_URL is required (even in development)")
            if not self.SUPABASE_URL or self.SUPABASE_URL == "":
                errors.append("SUPABASE_URL is required (even in development)")

        if errors:
            error_msg = "환경 변수 검증 실패:\n" + "\n".join(f"  - {error}" for error in errors)
            print(f"\n❌ {error_msg}\n", file=sys.stderr)
            raise ValueError(error_msg)

        return self

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
