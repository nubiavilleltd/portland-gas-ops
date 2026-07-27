from __future__ import annotations

from decimal import Decimal
from typing import Optional

from sqlalchemy.orm import Session

from app.core.exceptions import AppException
from app.payments import guards
from app.payments.enums import PaymentStatus
from app.payments.error_codes import PaymentErrorCode
from app.payments.model import Payment
from app.payments.repository import PaymentRepository
from app.payments.schema import PaymentCreate
from app.payments.validators import (
    validate_payment_amount,
    validate_payment_date,
)
from app.shared.utils.number_generator import generate_entity_no


class PaymentService:

    def __init__(self):
        self.repo = PaymentRepository()

    # ------------------------------------------------------------------
    # Retrieval
    # ------------------------------------------------------------------

    def get_by_id_or_raise(self, db: Session, payment_id: str) -> Payment:
        payment = self.repo.get_by_id(db, payment_id)
        if not payment:
            raise AppException(
                404,
                PaymentErrorCode.PAYMENT_NOT_FOUND,
                f"Payment {payment_id} not found",
            )
        return payment

    def get_by_no_or_raise(self, db: Session, payment_no: str) -> Payment:
        payment = self.repo.get_by_no(db, payment_no)
        if not payment:
            raise AppException(
                404,
                PaymentErrorCode.PAYMENT_NOT_FOUND,
                f"Payment {payment_no} not found",
            )
        return payment

    def list(
        self,
        db: Session,
        invoice_id: Optional[str],
        page: int,
        page_size: int,
    ):
        return self.repo.list(
            db=db,
            invoice_id=invoice_id,
            page=page,
            page_size=page_size,
        )

    def get_payments_by_invoice(
        self,
        db: Session,
        invoice_id: str,
    ):
        return self.repo.get_by_invoice(db, invoice_id)

    # ------------------------------------------------------------------
    # Commands
    # ------------------------------------------------------------------

    def record(
        self,
        db: Session,
        data: PaymentCreate,
        recorded_by: str,
        idempotency_key: Optional[str] = None,
    ) -> Payment:

        # --------------------------------------------------------------
        # Validate request
        # --------------------------------------------------------------

        validate_payment_amount(data.amount)
        validate_payment_date(data.payment_date)

        # --------------------------------------------------------------
        # Idempotency
        # --------------------------------------------------------------

        if idempotency_key:
            existing = self.repo.get_by_idempotency_key(
                db,
                idempotency_key,
            )
            if existing:
                return existing

        # --------------------------------------------------------------
        # Invoice
        # --------------------------------------------------------------

        from app.invoices.service import InvoiceService

        invoice_service = InvoiceService()
        invoice = invoice_service.get_by_id_or_raise(
            db,
            data.invoice_id,
        )



        from app.orders.service import OrderService

        order_service = OrderService()

        order = order_service.get_by_id_or_raise(
            db,
            invoice.order_id,
        )


        # --------------------------------------------------------------
        # Business guards
        # --------------------------------------------------------------

        if not guards.can_record_payment(invoice):
            raise AppException(
                400,
                PaymentErrorCode.INVOICE_ALREADY_PAID,
                "This invoice cannot accept additional payments.",
            )

        # --------------------------------------------------------------
        # Outstanding balance
        # --------------------------------------------------------------

        total_paid = self.repo.get_total_paid(
            db,
            invoice.id,
        )

        remaining_balance = invoice.total_amount - total_paid

        if data.amount > remaining_balance:
            raise AppException(
                400,
                PaymentErrorCode.PAYMENT_EXCEEDS_BALANCE,
                f"Payment exceeds outstanding balance of ₦{remaining_balance:,.2f}.",
                details={
                    "remaining_balance": str(remaining_balance),
                    "attempted_amount": str(data.amount),
                },
            )

        # --------------------------------------------------------------
        # Create payment
        # --------------------------------------------------------------

        payment_no = generate_entity_no(
            db,
            Payment,
            "payment_no",
            "PAY",
        )

        reference = data.reference or payment_no

        payment = self.repo.create(
            db,
            payment_no=payment_no,
            invoice_id=invoice.id,
            invoice_no=invoice.invoice_no,
            customer_id=order.customer_id,
            customer_name=order.customer_name,
            amount=data.amount,
            currency="NGN",
            method=data.method,
            payment_date=data.payment_date,
            reference=reference,
            idempotency_key=idempotency_key,
            recorded_by=recorded_by,
            notes=data.notes,
        )

        # --------------------------------------------------------------
        # Recalculate invoice status
        # --------------------------------------------------------------

        total_paid += data.amount
        remaining_balance = invoice.total_amount - total_paid

        if remaining_balance <= Decimal("0"):
            invoice_status = PaymentStatus.paid
        else:
            invoice_status = PaymentStatus.partially_paid

        invoice_service.update_status(
            db,
            invoice,
            invoice_status,
        )

        # --------------------------------------------------------------
        # Synchronize order payment status
        # --------------------------------------------------------------

        order_service.update_payment_status(
            db,
            order,
            invoice_status,
        )

        return payment