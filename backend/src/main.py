"""FastAPI 애플리케이션 진입점"""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.core.redis_client import get_redis
from src.api import router as api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    print("Starting ClipPilot API...")

    # Initialize Redis connection
    redis_client = get_redis()
    print(f"Redis connected: {redis_client.url}")

    yield

    # Shutdown
    print("Shutting down ClipPilot API...")
    await redis_client.close()


app = FastAPI(
    title="ClipPilot API",
    version="1.0.0",
    description="AI 숏폼 크리에이터 자동화 SaaS API",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS 설정
allowed_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:3001",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "ClipPilot API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    redis_client = get_redis()

    # Check Redis connection
    try:
        client = await redis_client.get_async()
        await client.ping()
        redis_status = "healthy"
    except Exception as e:
        redis_status = f"unhealthy: {str(e)}"

    return {
        "status": "healthy",
        "redis": redis_status,
    }
