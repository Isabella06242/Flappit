"""
Application settings loaded from environment variables / .env file.
All config lives here — never import os.environ directly elsewhere.
"""
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ── Database ──────────────────────────────────────────────────────────────
    # Railway injects DATABASE_URL as postgres:// — we normalise to asyncpg.
    DATABASE_URL: str = (
        "postgresql+asyncpg://flappit:flappit_secret@localhost:5432/flappit_db"
    )

    @property
    def async_database_url(self) -> str:
        return self.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1).replace("postgres://", "postgresql+asyncpg://", 1)

    # ── Redis ─────────────────────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"

    # ── Auth ──────────────────────────────────────────────────────────────────
    SECRET_KEY: str = "change_me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    ALGORITHM: str = "HS256"

    # ── AI ────────────────────────────────────────────────────────────────────
    OPENAI_API_KEY: str = ""

    # ── App ───────────────────────────────────────────────────────────────────
    ENVIRONMENT: str = "development"

    @property
    def is_dev(self) -> bool:
        return self.ENVIRONMENT == "development"

    # ── Maps ──────────────────────────────────────────────────────────────────
    # OpenStreetMap is used on the frontend — no backend map key needed

    # ── CORS ──────────────────────────────────────────────────────────────────
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:8081"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """Cached singleton — call this everywhere instead of Settings()."""
    return Settings()
