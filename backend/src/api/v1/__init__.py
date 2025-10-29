"""
API v1 routes for ClipPilot
"""

from fastapi import APIRouter

from .auth import router as auth_router


# Create main v1 router
router = APIRouter(prefix="/v1")

# Include sub-routers
router.include_router(auth_router)


__all__ = ["router"]
