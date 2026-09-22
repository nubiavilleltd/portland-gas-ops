"""
Email wording for invoice processing.

An invoice's LAST workflow step settles it rather than approving it: the final
approver either marks it paid or cancels it. The engine still drives that
through approve()/reject(), so without these hooks the requester is told their
invoice was "approved" when it was in fact paid, or "rejected" when it was
cancelled.

Each hook returns overrides only when the invoice actually settled; returning
None falls back to the standard wording, which is what a mid-workflow outcome
should still say.
"""

from app.finance.models import InvoiceProcessing, InvoiceProcessingStatus


def _invoice_for(ctx: dict) -> InvoiceProcessing | None:
    db = ctx.get("db")
    ar = ctx.get("ar")
    if db is None or ar is None:
        return None
    return (
        db.query(InvoiceProcessing)
        .filter(InvoiceProcessing.id == ar.request_id)
        .first()
    )


def on_approved(ctx: dict) -> dict | None:
    """Final step marked the invoice paid — say so instead of "approved"."""
    invoice = _invoice_for(ctx)
    if not invoice or invoice.status != InvoiceProcessingStatus.paid:
        return None

    title = ctx.get("request_title") or "Invoice"
    reference = invoice.payment_reference
    message = (
        f"Your invoice \"{title}\" has been marked as paid"
        + (f" (payment reference: {reference})" if reference else "")
        + ". No further approval is required."
    )
    return {
        "subject":        f"Invoice Paid — {title}",
        "result_heading": "Your Invoice Has Been Paid",
        "result_message": message,
        "action_label":   "Paid",
        "action_color":   "#16a34a",
    }


def on_rejected(ctx: dict) -> dict | None:
    """Final step cancelled the invoice — say so instead of "rejected"."""
    invoice = _invoice_for(ctx)
    if not invoice or invoice.status != InvoiceProcessingStatus.cancelled:
        return None

    title = ctx.get("request_title") or "Invoice"
    reason = invoice.cancellation_reason or ctx.get("comment")
    message = (
        f"Your invoice \"{title}\" has been cancelled and will not be paid."
        + (f" Reason: {reason}" if reason else "")
    )
    return {
        "subject":        f"Invoice Cancelled — {title}",
        "result_heading": "Your Invoice Has Been Cancelled",
        "result_message": message,
        "action_label":   "Cancelled",
        "action_color":   "#dc2626",
    }
