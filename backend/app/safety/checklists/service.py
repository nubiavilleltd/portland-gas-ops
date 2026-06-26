from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.safety.checklists.models import (
    SafetyChecklistParentType,
    SafetyChecklistResponse,
    SafetyChecklistStage,
    SafetyChecklistTemplate,
)


def get_active_template(
    db: Session,
    parent_type: SafetyChecklistParentType,
    stage: SafetyChecklistStage,
) -> SafetyChecklistTemplate:
    template = (
        db.query(SafetyChecklistTemplate)
        .options(joinedload(SafetyChecklistTemplate.items))
        .filter(
            SafetyChecklistTemplate.parent_type == parent_type,
            SafetyChecklistTemplate.stage == stage,
            SafetyChecklistTemplate.is_active == True,
        )
        .order_by(SafetyChecklistTemplate.version.desc())
        .first()
    )
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Checklist template not found",
        )
    return template


def list_parent_responses(
    db: Session,
    parent_type: SafetyChecklistParentType,
    parent_id: str,
) -> list[SafetyChecklistResponse]:
    return (
        db.query(SafetyChecklistResponse)
        .filter(
            SafetyChecklistResponse.parent_type == parent_type,
            SafetyChecklistResponse.parent_id == parent_id,
        )
        .order_by(
            SafetyChecklistResponse.stage_snapshot.asc(),
            SafetyChecklistResponse.sort_order_snapshot.asc(),
            SafetyChecklistResponse.created_at.asc(),
        )
        .all()
    )
