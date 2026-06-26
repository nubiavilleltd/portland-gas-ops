from fastapi import APIRouter

from app.safety.checklists.router import router as checklists_router

router = APIRouter()

router.include_router(checklists_router)
