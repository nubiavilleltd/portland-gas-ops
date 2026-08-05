from __future__ import annotations

from sqlalchemy.orm import Session

from app.audit.service import AuditService
from app.invoices.service import InvoiceService
from app.orders.service import OrderService
from app.payments.service import PaymentService


class RecordPaymentWorkflow:
    def __init__(self):
        self.payment_service = PaymentService()
        self.invoice_service = InvoiceService()
        self.order_service = OrderService()

    def execute(
        self,
        *,
        db: Session,
        payload,
        attachments,
        uploaded_by,
        recorded_by,
        idempotency_key,
        actor_employee_id: str,
        actor_name: str,
    ):
        pass