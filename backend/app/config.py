"""Application configuration using Pydantic Settings v2."""

from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import AnyHttpUrl, EmailStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """All application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ────────────────────────────────────────────────────────
    APP_NAME: str = "ThePropertyFolio"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: Literal["development", "production", "test"] = "development"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: Literal["json", "console"] = "console"

    # ── Database ───────────────────────────────────────────────────────────
    DATABASE_URL: str
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_TIMEOUT: int = 30

    # ── Redis ──────────────────────────────────────────────────────────────
    REDIS_URL: str
    REDIS_PASSWORD: str = ""

    # ── Security ───────────────────────────────────────────────────────────
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    BCRYPT_ROUNDS: int = 12
    FIELD_ENCRYPTION_KEY: str  # Base64-encoded 32-byte key for AES-256-GCM

    # ── CORS ───────────────────────────────────────────────────────────────
    ALLOWED_ORIGINS: str | list[str] = ["*"]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v: str | list[str]) -> list[str]:
        """Parse comma-separated string or list."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    # ── Rate Limiting ──────────────────────────────────────────────────────
    RATE_LIMIT_CHAT_UNAUTH: int = 30
    RATE_LIMIT_CHAT_AUTH: int = 100
    LOGIN_MAX_ATTEMPTS: int = 5
    LOGIN_LOCKOUT_MINUTES: int = 15

    # ── Email (Resend) ─────────────────────────────────────────────────────
    RESEND_API_KEY: str = ""
    EMAIL_FROM: EmailStr = "noreply@thepropertyfolio.com"  # type: ignore[assignment]
    EMAIL_REPLY_TO: EmailStr = "support@thepropertyfolio.com"  # type: ignore[assignment]
    ADMIN_EMAIL: EmailStr = "admin@thepropertyfolio.com"  # type: ignore[assignment]

    # ── OpenAI ────────────────────────────────────────────────────────────
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"
    OPENAI_MAX_TOKENS: int = 1024

    # ── AWS S3 / R2 ────────────────────────────────────────────────────────
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-1"
    AWS_S3_BUCKET: str = "thepropertyfolio-media"
    AWS_S3_ENDPOINT_URL: str | None = None  # Set for Cloudflare R2

    # ── Stripe ────────────────────────────────────────────────────────────
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""

    # ── Google reCAPTCHA ──────────────────────────────────────────────────
    RECAPTCHA_SECRET_KEY: str = ""

    # ── Celery ────────────────────────────────────────────────────────────
    CELERY_BROKER_URL: str = ""
    CELERY_RESULT_BACKEND: str = ""


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance — import this everywhere."""
    return Settings()  # type: ignore[call-arg]


settings = get_settings()
