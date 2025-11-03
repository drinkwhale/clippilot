"""
API v1 routes for ClipPilot
"""

from fastapi import APIRouter

from .auth import router as auth_router
from .billing import router as billing_router
from .channels import router as channels_router
from .jobs import router as jobs_router
from .metrics import router as metrics_router
from .templates import router as templates_router
from .users import router as users_router


# Create main v1 router
router = APIRouter(prefix="/v1")

# Include sub-routers
router.include_router(auth_router)
router.include_router(billing_router)
router.include_router(channels_router)
router.include_router(jobs_router)
router.include_router(metrics_router)
router.include_router(templates_router)
router.include_router(users_router)


__all__ = ["router"]
