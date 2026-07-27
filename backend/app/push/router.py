"""
Push subscription management — /api/push

POST   /subscribe    Save or upsert a browser push subscription for the current user
DELETE /subscribe    Remove subscription(s) for the current user (on logout / revoke)
"""

import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Any, Dict, Optional

from app.core.database import get_db
from app.shared.dependencies import get_current_user
from app.shared.models.user import User
from app.shared.models.push import PushSubscription

router = APIRouter()


class SubscribeRequest(BaseModel):
    subscription: Dict[str, Any]   # full PushSubscriptionJSON from browser


class UnsubscribeRequest(BaseModel):
    endpoint: Optional[str] = None  # if omitted, removes ALL for this user


# ── POST /api/push/subscribe ───────────────────────────────────────────────────

@router.post("/subscribe", status_code=204)
def subscribe(
    body: SubscribeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upsert a push subscription by endpoint (unique per browser/device)."""
    import json

    endpoint = body.subscription.get("endpoint")
    if not endpoint:
        raise HTTPException(status_code=422, detail="subscription.endpoint is required")

    sub_json = json.dumps(body.subscription)

    existing = db.query(PushSubscription).filter(
        PushSubscription.endpoint == endpoint
    ).first()

    if existing:
        # Update in case keys rotated
        existing.subscription_json = sub_json
        existing.user_id    = current_user.id
        existing.user_email = current_user.email
    else:
        db.add(PushSubscription(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            user_email=current_user.email,
            endpoint=endpoint,
            subscription_json=sub_json,
        ))

    db.commit()


# ── DELETE /api/push/subscribe ────────────────────────────────────────────────

@router.delete("/subscribe", status_code=204)
def unsubscribe(
    body: UnsubscribeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove one subscription by endpoint, or all for this user."""
    q = db.query(PushSubscription).filter(
        PushSubscription.user_id == current_user.id
    )
    if body.endpoint:
        q = q.filter(PushSubscription.endpoint == body.endpoint)

    q.delete(synchronize_session=False)
    db.commit()
