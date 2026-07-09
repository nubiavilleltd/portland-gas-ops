"""
In-app notification service.

create_notification() is called by the workflow engine after each step action.
The /api/notifications endpoint (polling) surfaces unread notifications to the frontend.
"""

import uuid
from sqlalchemy.orm import Session

from app.shared.models.approval import Notification, NotificationType


def create_notification(
    db: Session,
    recipient_id: str,
    type: NotificationType,
    title: str,
    message: str,
    reference_type: str | None = None,
    reference_id: str | None = None,
) -> Notification:
    notif = Notification(
        id=str(uuid.uuid4()),
        recipient_id=recipient_id,
        type=type,
        title=title,
        message=message,
        reference_type=reference_type,
        reference_id=reference_id,
        is_read=False,
    )
    db.add(notif)
    # Caller is responsible for committing the session
    return notif


def mark_as_read(db: Session, notification_id: str, recipient_id: str) -> bool:
    notif = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.recipient_id == recipient_id,
        )
        .first()
    )
    if not notif:
        return False
    notif.is_read = True
    return True


def mark_all_read(db: Session, recipient_id: str) -> int:
    updated = (
        db.query(Notification)
        .filter(Notification.recipient_id == recipient_id, Notification.is_read == False)  # noqa: E712
        .all()
    )
    for n in updated:
        n.is_read = True
    return len(updated)
