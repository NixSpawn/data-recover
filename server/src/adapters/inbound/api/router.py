from fastapi import APIRouter

from .routes.disks import router as disks_router
from .routes.recovery import router as recovery_router
from .routes.scan import router as scan_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(disks_router)
api_router.include_router(scan_router)
api_router.include_router(recovery_router)
