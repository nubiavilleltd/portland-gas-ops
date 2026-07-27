"""
Procurement email content — custom copy for each workflow event in the
procurement approval flow.

Hooks receive a `ctx` dict.  Available keys per hook:

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
    """Load ProcurementRequest with purchase_orders → vendor eager-loaded."""
    from app.procurement.models import ProcurementRequest, PurchaseOrder
    from app.employees.models import Employee
    from sqlalchemy.orm import joinedload
    return (
        db.query(ProcurementRequest)
        .options(
            joinedload(ProcurementRequest.purchase_orders).joinedload(PurchaseOrder.vendor),
            joinedload(ProcurementRequest.vendor),
        )
        .filter(ProcurementRequest.id == request_id)
        .first()
    )


def on_submitted(ctx: dict) -> dict | None:
    ar = ctx["ar"]
    try:
        req = _get_req(ctx["db"], ar.request_id)
        if not req:
            return None
        category = (req.category or "").replace("_", " ").title() or "General"
        vendor = req.vendor.name if req.vendor else "TBD"
        return {
            "subject": f"Purchase Request Submitted — {req.reference}",
        }
    except Exception:
        logger.exception("procurement on_submitted content hook failed")
        return None


def on_step_assigned(ctx: dict) -> dict | None:
    ar = ctx["ar"]
    step = ctx["step"]
    approver_name = ctx["approver_name"]
    request_title = ctx["request_title"]
    try:
        req = _get_req(ctx["db"], ar.request_id)
        if not req:
            return None
        vendor = req.vendor.name if req.vendor else "TBD"
        # Second-to-last step = Issue PO step (Procurement Officer issues PO)
        if step.step_number == step.total_steps - 1:
            return {
                "intro_message": (
                    f"A purchase request ({req.reference}) requires you to review "
                    f"and issue a Purchase Order to {vendor}."
                ),
                "action_message": (
                    "Click the button to open the request, review the details, "
                    "and use the 'Issue PO' action to generate and issue the Purchase Order."
                ),
                "button_label": "Review & Issue PO",
            }
        # Final step = Confirm Delivery
        if step.step_number == step.total_steps:
            return {
                "intro_message": (
                    f"A Purchase Order has been issued for {req.reference}. "
                    f"Once goods are received from {vendor}, please confirm delivery."
                ),
                "action_message": (
                    "Click the button below to open the request and confirm "
                    "that the goods have been received."
                ),
                "button_label": "Confirm Delivery",
            }
        # Regular approval step (e.g. Operating Manager, Finance)
        amount = f"₦{req.estimated_amount:,.2f}" if req.estimated_amount else "amount not specified"
        return {
            "intro_message": (
                f"A purchase request from {ctx['requester_name']} requires your approval. "
                f"Vendor: {vendor}. Estimated amount: {amount}."
            ),
            "button_label": "Review Purchase Request",
        }
    except Exception:
        logger.exception("procurement on_step_assigned content hook failed")
        return None


def on_step_progress(ctx: dict) -> dict | None:
    ar = ctx["ar"]
    completed_step = ctx["completed_step"]
    approver_name = ctx["approver_name"]
    try:
        req = _get_req(ctx["db"], ar.request_id)
        if not req:
            return None
        vendor = req.vendor.name if req.vendor else "TBD"
        # Second-to-last step just completed = PO was just issued
        if completed_step.step_number == completed_step.total_steps - 1:
            po = req.purchase_orders[0] if req.purchase_orders else None
            po_ref = po.po_number if po else "—"
            po_vendor = (po.vendor.name if po and po.vendor else None) or vendor
            return {
                "subject": f"Purchase Order Issued — {req.reference}",
                "approver_name": f"{approver_name} (Procurement Officer)",
            }
        # Any other intermediate step
        return {
            "subject": f"Procurement Request Update — {req.reference}",
        }
    except Exception:
        logger.exception("procurement on_step_progress content hook failed")
        return None


def on_approved(ctx: dict) -> dict | None:
    """Final step approved = delivery confirmed, request complete."""
    ar = ctx["ar"]
    try:
        req = _get_req(ctx["db"], ar.request_id)
        if not req:
            return None
        return {
            "result_message": (
                f"Delivery has been confirmed and goods have been received for "
                f"purchase request {req.reference}. "
                "Your procurement request is now complete."
            )
        }
    except Exception:
        logger.exception("procurement on_approved content hook failed")
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
                f"Your purchase request {req.reference} has been rejected. "
                + (f"Reason: {comment} " if comment else "")
                + "Please contact your line manager if you have any questions."
            )
        }
    except Exception:
        logger.exception("procurement on_rejected content hook failed")
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
                f"Your purchase request {req.reference} has been returned for revision. "
                + (f"Reviewer's note: {comment} " if comment else "")
                + "Please update the request and resubmit."
            )
        }
    except Exception:
        logger.exception("procurement on_returned content hook failed")
        return None
