from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.approval import ApprovalActionRequest
from app.services import approval_engine

router = APIRouter()


@router.get("/mine")
def get_my_approvals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # TODO: Replace stub with real query via approval_engine.get_pending_for_user
    pending = approval_engine.get_pending_for_user(current_user, db)
    return {"items": pending, "total": len(pending)}


@router.get("/{approval_id}")
def get_approval(
    approval_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # TODO: Fetch ApprovalRequest + all steps + assignees + history
    return {
        "id": approval_id,
        "message": "Approval detail (stub)",
        "todo": "Implement full fetch with steps and history",
    }


@router.post("/{approval_id}/approve")
def approve(
    approval_id: str,
    body: ApprovalActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = approval_engine.approve_step(approval_id, current_user, body.comment or "", db)
    return result


@router.post("/{approval_id}/reject")
def reject(
    approval_id: str,
    body: ApprovalActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = approval_engine.reject_request(approval_id, current_user, body.comment or "", db)
    return result


@router.post("/{approval_id}/return")
def return_to_submitter(
    approval_id: str,
    body: ApprovalActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = approval_engine.return_request(approval_id, current_user, body.comment or "", db)
    return result
