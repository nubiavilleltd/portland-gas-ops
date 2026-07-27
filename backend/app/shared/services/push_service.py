"""
Web Push notification service.

Sends OS-level browser push notifications to subscribed devices.
Works even when the Portland Gas Ops tab is closed, as long as the
browser is running (same tier as Microsoft Teams web notifications).

Usage:
    fire_push_for_recipient(db, employee_id, title, body, url, tag)

This is always fire-and-forget — never blocks the calling request.
VAPID env vars required (set in .env and Vercel):
    NEXT_PUBLIC_VAPID_PUBLIC_KEY
    VAPID_PRIVATE_KEY
    VAPID_SUBJECT  (defaults to mailto:admin@portlandgas.com)
"""

import json
import logging
import os
import threading
import uuid

logger = logging.getLogger(__name__)

# Deep-link paths — mirrors NotificationToaster.tsx REFERENCE_PATHS
_PUSH_PATHS: dict[str, str] = {
    "procurement":        "/procurement",
    "asset":              "/assets/requests",
    "leave_request":      "/hr-management/leave-requests",
    "cash_requisition":   "/finance/cash-requisitions",
    "invoice":            "/finance/invoices",
    "work_initiation":    "/safety/work-initiation",
    "work_authorization": "/safety/work-authorization",
    "work_closeout":      "/safety/work-close-out",
}


def _build_url(reference_type: str | None, reference_id: str | None) -> str:
    if not reference_type or not reference_id:
        return "/"
    path = _PUSH_PATHS.get(reference_type, "/")
    return f"{path}/{reference_id}"


def _send_one(subscription_json: str, payload: dict) -> str:
    """
    Send a single push notification.
    Returns 'delivered' or 'stale' (subscription expired/revoked).
    Raises on unexpected errors.
    """
    try:
        from pywebpush import webpush, WebPushException

        private_key = os.environ.get("VAPID_PRIVATE_KEY")
        public_key  = os.environ.get("NEXT_PUBLIC_VAPID_PUBLIC_KEY")
        subject     = os.environ.get("VAPID_SUBJECT", "mailto:admin@portlandgas.com")

        if not private_key or not public_key:
            logger.warning("VAPID keys not configured — skipping push")
            return "delivered"  # treat as delivered so we don't delete subs

        webpush(
            subscription_info=json.loads(subscription_json),
            data=json.dumps(payload),
            vapid_private_key=private_key,
            vapid_claims={"sub": subject},
            ttl=86400,  # keep in push queue 24h if browser is temporarily offline
        )
        return "delivered"

    except Exception as exc:
        # pywebpush raises WebPushException with a response object on 4xx
        response = getattr(exc, "response", None)
        status   = getattr(response, "status_code", None)
        if status in (404, 410):
            return "stale"
        logger.warning("Push send failed: %s", exc)
        return "delivered"  # don't delete on transient errors


def _worker(
    subscriptions: list[dict],  # [{id, subscription_json}]
    payload: dict,
) -> None:
    """Background thread: send push to all subscriptions, clean up stale ones."""
    from app.core.database import SessionLocal
    from app.shared.models.push import PushSubscription

    stale_ids: list[str] = []

    for sub in subscriptions:
        result = _send_one(sub["subscription_json"], payload)
        if result == "stale":
            stale_ids.append(sub["id"])

    if stale_ids:
        db = SessionLocal()
        try:
            db.query(PushSubscription).filter(
                PushSubscription.id.in_(stale_ids)
            ).delete(synchronize_session=False)
            db.commit()
        except Exception as exc:
            logger.warning("Failed to delete stale push subscriptions: %s", exc)
        finally:
            db.close()


def fire_push_for_recipient(
    db,
    employee_id: str,
    title: str,
    body: str,
    reference_type: str | None = None,
    reference_id: str | None = None,
    notif_id: str | None = None,
) -> None:
    """
    Fire-and-forget: send push to all devices subscribed for this employee.
    Looks up the employee's email, finds their subscriptions, sends in a daemon thread.
    Never raises — push failures must never affect the main request.
    """
    try:
        from app.employees.models import Employee
        from app.shared.models.push import PushSubscription

        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if not employee or not employee.user:
            return

        subs = (
            db.query(PushSubscription)
            .filter(PushSubscription.user_email == employee.user.email)
            .all()
        )
        if not subs:
            return

        url     = _build_url(reference_type, reference_id)
        tag     = f"notif-{notif_id}" if notif_id else f"notif-{uuid.uuid4()}"
        payload = {
            "title": title,
            "body":  body,
            "icon":  "/icon.png",
            "url":   url,
            "tag":   tag,
        }

        # Snapshot subscription data — do NOT pass the db session to the thread
        sub_data = [
            {"id": s.id, "subscription_json": s.subscription_json}
            for s in subs
        ]

        threading.Thread(
            target=_worker,
            args=(sub_data, payload),
            daemon=True,
        ).start()

    except Exception as exc:
        logger.warning("fire_push_for_recipient failed: %s", exc)
