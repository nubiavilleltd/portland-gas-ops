from __future__ import annotations
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List

from app.core.dependencies import get_db, get_current_user
from app.shared.models.user import User
from app.audit.service import AuditService
from app.audit.schema import AuditLogResponse, AuditEntityType

router = APIRouter()


@router.get("", response_model=List[AuditLogResponse])
def list_audit_log(
    entity_type: AuditEntityType = Query(...),
    entity_id:   str             = Query(...),
    db:          Session         = Depends(get_db),
    current_user: User           = Depends(get_current_user),
):
    entries = AuditService.get_by_entity(db, entity_type, entity_id)
    return entries
