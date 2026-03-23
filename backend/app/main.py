"""
Flappit — FastAPI application entry point.
"""
from contextlib import asynccontextmanager

import redis.asyncio as aioredis
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import router
from app.config import get_settings

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: verify Redis is reachable
    app.state.redis = aioredis.from_url(
        settings.REDIS_URL, encoding="utf-8", decode_responses=True
    )
    await app.state.redis.ping()
    yield
    # Shutdown: close Redis connection
    await app.state.redis.aclose()


app = FastAPI(
    title="Flappit API",
    description="Free-form travel planning — notes, maps, pins.",
    version="0.1.0",
    docs_url="/docs" if settings.is_dev else None,
    redoc_url="/redoc" if settings.is_dev else None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok", "version": "0.1.0"}
