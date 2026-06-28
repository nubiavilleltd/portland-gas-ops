from __future__ import annotations
from app.invoices.model import Invoice
from app.payments.enums import PaymentStatus

def can_record_payment(invoice: Invoice) -> bool:
    return invoice.status not in (PaymentStatus.paid, PaymentStatus.void)