from fastapi import APIRouter

from app.safety.checklists.router import router as checklists_router
from app.safety.incidents.router import router as incidents_router

router = APIRouter()

router.include_router(checklists_router)
router.include_router(incidents_router)