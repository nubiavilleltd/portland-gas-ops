from __future__ import annotations

from sqlalchemy.orm import Session
from decimal import Decimal
from app.audit.schema import AuditActorType, AuditEntityType
from app.audit.service import AuditService
from app.invoices.service import InvoiceService
from app.orders.service import OrderService
from app.payments.enums import PaymentStatus
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

        invoice = self.invoice_service.get_or_raise(
            db,
            payload.invoice_id,
        )
    
        order = self.order_service.get_or_raise(
            db,
            invoice.order_id,
        )
        payment = self.payment_service.record(
            db=db,
            invoice=invoice,
            order=order,
            data=payload,
            attachments=attachments,
            uploaded_by=uploaded_by,
            recorded_by=recorded_by,
            idempotency_key=idempotency_key,
        )

    
        invoice_status = self.invoice_service.refresh_payment_status(
            db,
            invoice,
        )

        self.order_service.update_payment_status(
            db,
            order,
            invoice_status,
        )

        

        AuditService.record(
            db,
            AuditEntityType.payment,
            payment.id,
            "recorded",
            f"Payment {payment.payment_no} recorded.",
            AuditActorType.employee,
            actor_employee_id,
            actor_name,
        )

        AuditService.record(
            db,
            AuditEntityType.invoice,
            invoice.id,
            "payment_recorded",
            (
                f"Payment {payment.payment_no} "
                f"recorded for ₦{payment.amount:,.2f}."
            ),
            AuditActorType.employee,
            actor_employee_id,
            actor_name,
        )

        AuditService.record(
            db,
            AuditEntityType.order,
            order.id,
            "payment_recorded",
            (
                f"Payment {payment.payment_no} "
                f"recorded for ₦{payment.amount:,.2f} "
                f"via {payment.method.value}."
            ),
            AuditActorType.employee,
            actor_employee_id,
            actor_name,
        )

        return payment