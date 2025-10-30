"""
API v1 routes for ClipPilot
"""

from fastapi import APIRouter

from .auth import router as auth_router
from .channels import router as channels_router
from .jobs import router as jobs_router


# Create main v1 router
router = APIRouter(prefix="/v1")

# Include sub-routers
router.include_router(auth_router)
router.include_router(channels_router)
router.include_router(jobs_router)


__all__ = ["router"]
