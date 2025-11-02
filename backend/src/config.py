"""
애플리케이션 설정

환경 변수를 통해 설정을 관리합니다.
"""
from pydantic_settings import BaseSettings
from typing import Optional


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
    SUPABASE_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str

    # JWT 설정
    JWT_SECRET: str
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

    # YouTube API 설정
    YOUTUBE_CLIENT_ID: str
    YOUTUBE_CLIENT_SECRET: str
    YOUTUBE_REDIRECT_URI: str

    # Pexels API 설정
    PEXELS_API_KEY: str

    # Stripe 설정
    STRIPE_SECRET_KEY: str
    STRIPE_PUBLISHABLE_KEY: str
    STRIPE_WEBHOOK_SECRET: str
    STRIPE_PRO_PRICE_ID: str
    STRIPE_AGENCY_PRICE_ID: str

    # CORS 설정
    CORS_ORIGINS: list = ["http://localhost:3000"]

    # Sentry 설정 (선택적)
    SENTRY_DSN: Optional[str] = None

    # Rate Limiting (NFR-017)
    RATE_LIMIT_PER_MINUTE: int = 60

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
