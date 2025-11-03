"""
애플리케이션 설정

환경 변수를 통해 설정을 관리합니다.
"""
from pydantic_settings import BaseSettings
from typing import Optional
from pydantic import field_validator


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

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
