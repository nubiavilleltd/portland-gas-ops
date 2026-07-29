from __future__ import annotations

from decimal import Decimal
from app.shared.services.email_service import EmailAttachment

from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload

from app.invoices.model import Invoice
from app.orders.model import Order
from app.orders.model import OrderItem

from app.shared.config.company import COMPANY_INFO
from app.shared.pdf.builder import (
    fmt_currency,
    fmt_date,
)

from app.shared.pdf.invoice_pdf import (
    generate_invoice_pdf,
)


def get_invoice_email_context(
    db: Session,
    invoice_id: str,
) -> dict[str, object] | None:
    """
    Build all variables required by the Invoice email,
    including the PDF attachment.
    """

    invoice = (
        db.query(Invoice)
        .options(
            joinedload(Invoice.order)
            .joinedload(Order.customer),
            joinedload(Invoice.order)
            .joinedload(Order.order_items)
            .joinedload(OrderItem.product),
            joinedload(Invoice.payments),
        )
        .filter(
            Invoice.id == invoice_id,
        )
        .first()
    )

    if not invoice:
        return None

    order = invoice.order

    if not order:
        return None

    customer = order.customer

    if not customer or not customer.email:
        return None

    amount_paid = sum(
        (
            payment.amount
            for payment in invoice.payments
        ),
        Decimal("0"),
    )

    balance_due = max(
        Decimal("0"),
        invoice.total_amount - amount_paid,
    )

    pdf_bytes = generate_invoice_pdf(
        invoice=invoice,
        order=order,
        customer=customer,
    )




    attachment = EmailAttachment(
        filename=f"{invoice.invoice_no}.pdf",
        content=pdf_bytes,
    )

    return {
        "recipient_email": customer.email,

        "customer_name": customer.name,

        "invoice_no": invoice.invoice_no,
        "order_no": order.order_no,

        "issued_date": fmt_date(
            invoice.issued_date,
        ),

        "due_date": fmt_date(
            invoice.due_date,
        ),

        "payment_status": (
            invoice.status.value
            .replace("_", " ")
            .title()
        ),

        "total_amount": fmt_currency(
            invoice.total_amount,
        ),

        "amount_paid": fmt_currency(
            amount_paid,
        ),

        "balance_due": fmt_currency(
            balance_due,
        ),

        "company_name": COMPANY_INFO.name,
        "company_email": COMPANY_INFO.email,
        "company_phone": COMPANY_INFO.phone,
        "company_website": COMPANY_INFO.website,

        "attachments": [attachment],
    }