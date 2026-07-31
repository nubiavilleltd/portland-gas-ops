from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.shared.models.user import User
from app.shared.models.approval import Notification, NotificationType
from app.shared.dependencies import get_current_user
from app.shared.services import notification_service
from app.employees import service as employee_service

router = APIRouter()


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    type: str
    title: str
    message: str
    reference_type: Optional[str]
    reference_id: Optional[str]
    is_read: bool
    created_at: datetime


def _get_employee(current_user: User, db: Session):
    """Returns current user's employee record or raises 404."""
    try:
        return employee_service.get_employee_by_user_id(current_user.id, db)
    except HTTPException:
        raise HTTPException(status_code=404, detail="No employee profile found for this user.")


# ── List ─────────────────────────────────────────────────────────────────────

@router.get("", response_model=List[NotificationResponse])
@router.get("/", response_model=List[NotificationResponse])
def list_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns the current user's notifications, newest first."""
    try:
        emp = employee_service.get_employee_by_user_id(current_user.id, db)
    except HTTPException:
        return []  # No employee record — return empty list gracefully

    return (
        db.query(Notification)
        .filter(Notification.recipient_id == emp.id)
        .order_by(Notification.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


# ── Unread count (lightweight poll for bell badge) ────────────────────────────

@router.get("/count")
def unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        emp = employee_service.get_employee_by_user_id(current_user.id, db)
    except HTTPException:
        return {"count": 0}

    count = (
        db.query(Notification)
        .filter(
            Notification.recipient_id == emp.id,
            Notification.is_read == False,  # noqa: E712
        )
        .count()
    )
    return {"count": count}


# ── Mark one read ─────────────────────────────────────────────────────────────

@router.patch("/{notification_id}/read")
def mark_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    emp = _get_employee(current_user, db)
    ok = notification_service.mark_as_read(db, notification_id, emp.id)
    if not ok:
        raise HTTPException(status_code=404, detail="Notification not found.")
    db.commit()
    return {"success": True}


# ── Mark all read ─────────────────────────────────────────────────────────────

@router.post("/mark-all-read")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    emp = _get_employee(current_user, db)
    updated = notification_service.mark_all_read(db, emp.id)
    db.commit()
    return {"updated": updated}


# ── Send birthday wishes ───────────────────────────────────────────────────────

@router.post("/send-wishes/{employee_id}")
def send_birthday_wishes(
    employee_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Creates a birthday wish notification for the target employee."""
    sender_name = (
        f"{current_user.first_name or ''} {current_user.last_name or ''}".strip()
        or "A colleague"
    )

    notif = notification_service.create_notification(
        db=db,
        recipient_id=employee_id,
        type=NotificationType.info,
        title="🎂 Birthday Wishes!",
        message=f"{sender_name} wished you a Happy Birthday! 🎉",
    )
    db.commit()
    return {"success": True, "notification_id": notif.id}
