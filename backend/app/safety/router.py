from fastapi import APIRouter

from app.safety.actors import router as actors_router
from app.safety.checklists.router import router as checklists_router
from app.safety.incidents.router import router as incidents_router
from app.safety.work_initiations.router import router as work_initiations_router
from app.safety.work_authorizations.router import router as work_authorizations_router

router = APIRouter()

router.include_router(actors_router)
router.include_router(checklists_router)
router.include_router(incidents_router)
router.include_router(work_initiations_router)
router.include_router(work_authorizations_router)
