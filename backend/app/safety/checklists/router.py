from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.safety.checklists import service as checklist_service
from app.safety.checklists.models import SafetyChecklistParentType, SafetyChecklistStage
from app.safety.checklists.schemas import ChecklistResponseRead, ChecklistTemplateResponse
from app.shared.dependencies import get_current_user
from app.shared.models.user import User


router = APIRouter(prefix="/checklists", tags=["Safety Checklists"])


@router.get("/active", response_model=ChecklistTemplateResponse)
def get_active_checklist(
    parent_type: SafetyChecklistParentType = Query(...),
    stage: SafetyChecklistStage = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    template = checklist_service.get_active_template(
        db=db,
        parent_type=parent_type,
        stage=stage,
    )
    return ChecklistTemplateResponse.from_model(template)


@router.get("/responses", response_model=List[ChecklistResponseRead])
def list_checklist_responses(
    parent_type: SafetyChecklistParentType = Query(...),
    parent_id: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return checklist_service.list_parent_responses(
        db=db,
        parent_type=parent_type,
        parent_id=parent_id,
    )
