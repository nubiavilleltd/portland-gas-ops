from __future__ import annotations

from sqlalchemy.orm import Session

from app.invoices.email_context import (
    get_invoice_email_context,
)

from app.shared.services import email_service


def send_invoice_email(
    db: Session,
    invoice_id: str,
) -> None:
    """
    Send an invoice email with the generated PDF attached.
    """

    context = get_invoice_email_context(
        db,
        invoice_id,
    )

    if not context:
        return
    

    email_service.send_template_email(
        to_email=context["recipient_email"],
        subject=f"Invoice {context['invoice_no']}",
        template_name="invoices/invoice_sent.html",
        variables=context,
        attachments=context["attachments"],
    )