"""
Application settings loaded from environment variables / .env file.
All config lives here — never import os.environ directly elsewhere.
"""
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ── Database ──────────────────────────────────────────────────────────────
    POSTGRES_USER: str = "flappit"
    POSTGRES_PASSWORD: str = "flappit_secret"
    POSTGRES_DB: str = "flappit_db"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    # ── Redis ─────────────────────────────────────────────────────────────────
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379

    @property
    def REDIS_URL(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/0"

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
