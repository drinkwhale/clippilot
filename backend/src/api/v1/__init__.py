"""
API v1 routes for ClipPilot
"""

from fastapi import APIRouter

from .admin import router as admin_router
from .auth import router as auth_router
# from .billing import router as billing_router
# from .channels import router as channels_router
# from .jobs import router as jobs_router
# from .metrics import router as metrics_router  # TODO: Fix async DB dependency
# from .templates import router as templates_router  # TODO: Fix async DB dependency
from .users import router as users_router
from .youtube import router as youtube_router


# Create main v1 router
router = APIRouter(prefix="/v1")

# Include sub-routers
# Phase 3 (US0 Authentication) - Currently implemented
router.include_router(auth_router)
router.include_router(users_router)
router.include_router(admin_router)

# Phase 3 (US1 YouTube Search) - Currently implemented
router.include_router(youtube_router)

# Phase 4+ - To be implemented
# router.include_router(billing_router)
# router.include_router(channels_router)
# router.include_router(jobs_router)
# router.include_router(metrics_router)
# router.include_router(templates_router)


__all__ = ["router"]
