"""
Asset request email content — custom copy for each workflow event.

Hooks receive a `ctx` dict. Available keys per hook:

  on_submitted:     db, ar, requester_name, step (StepContext), request_title
  on_step_assigned: db, ar, approver_name, requester_name, step (StepContext), request_title
  on_step_progress: db, ar, completed_step (StepContext), next_step (StepContext),
                    approver_name, request_title
  on_approved:      db, ar, request_title
  on_rejected:      db, ar, request_title, comment
  on_returned:      db, ar, request_title, comment

Return a dict with any of: subject, intro_message, action_message, button_label,
result_message.  Return None to use the generic fallback.
"""

import logging

logger = logging.getLogger(__name__)


def _get_req(db, request_id):
    """Load AssetRequest with items and requester eager-loaded."""
    from app.assets.models import AssetRequest, AssetRequestItem
    from sqlalchemy.orm import joinedload
    return (
        db.query(AssetRequest)
        .options(
            joinedload(AssetRequest.items),
            joinedload(AssetRequest.requester),
        )
        .filter(AssetRequest.id == request_id)
        .first()
    )


def on_submitted(ctx: dict) -> dict | None:
    ar = ctx["ar"]
    try:
        req = _get_req(ctx["db"], ar.request_id)
        if not req:
            return None
        request_type_label = req.request_type.value.title()
        return {
            "subject": f"Asset {request_type_label} Request Submitted — {req.reference}",
        }
    except Exception:
        logger.exception("asset on_submitted content hook failed")
        return None


def on_step_assigned(ctx: dict) -> dict | None:
    ar = ctx["ar"]
    try:
        req = _get_req(ctx["db"], ar.request_id)
        if not req:
            return None
        request_type_label = req.request_type.value.title()
        item_count = len(req.items)
        items_label = f"{item_count} item{'s' if item_count != 1 else ''}"
        return {
            "intro_message": (
                f"An asset {request_type_label.lower()} request from "
                f"{ctx['requester_name']} requires your approval. "
                f"The request covers {items_label}."
            ),
            "button_label": f"Review {request_type_label} Request",
        }
    except Exception:
        logger.exception("asset on_step_assigned content hook failed")
        return None


def on_step_progress(ctx: dict) -> dict | None:
    ar = ctx["ar"]
    try:
        req = _get_req(ctx["db"], ar.request_id)
        if not req:
            return None
        return {
            "subject": f"Asset Request Update — {req.reference}",
        }
    except Exception:
        logger.exception("asset on_step_progress content hook failed")
        return None


def on_approved(ctx: dict) -> dict | None:
    ar = ctx["ar"]
    try:
        req = _get_req(ctx["db"], ar.request_id)
        if not req:
            return None
        request_type_label = req.request_type.value.title()
        return {
            "result_message": (
                f"Your asset {request_type_label.lower()} request {req.reference} "
                "has been approved. The Asset Management team will be in touch "
                "to arrange allocation."
            )
        }
    except Exception:
        logger.exception("asset on_approved content hook failed")
        return None


def on_rejected(ctx: dict) -> dict | None:
    ar = ctx["ar"]
    try:
        req = _get_req(ctx["db"], ar.request_id)
        if not req:
            return None
        comment = ctx.get("comment")
        return {
            "result_message": (
                f"Your asset request {req.reference} has been rejected. "
                + (f"Reason: {comment} " if comment else "")
                + "Please contact the Asset Management team if you have questions."
            )
        }
    except Exception:
        logger.exception("asset on_rejected content hook failed")
        return None


def on_returned(ctx: dict) -> dict | None:
    ar = ctx["ar"]
    try:
        req = _get_req(ctx["db"], ar.request_id)
        if not req:
            return None
        comment = ctx.get("comment")
        return {
            "result_message": (
                f"Your asset request {req.reference} has been returned for revision. "
                + (f"Reviewer's note: {comment} " if comment else "")
                + "Please update your request and resubmit."
            )
        }
    except Exception:
        logger.exception("asset on_returned content hook failed")
        return None
