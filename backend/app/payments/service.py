# from __future__ import annotations
# from sqlalchemy.orm import Session
# from typing import Optional
# from decimal import Decimal

# from app.payments.repository import PaymentRepository
# from app.payments.model import Payment
# from app.payments.schema import PaymentCreate
# from app.payments.error_codes import PaymentErrorCode
# from app.payments.enums import PaymentStatus
# from app.payments import guards
# from app.invoices.error_codes import InvoiceErrorCode
# from app.core.exceptions import AppException, ErrorCode
# from app.shared.utils.number_generator import generate_entity_no


# class PaymentService:

#     def __init__(self):
#         self.repo = PaymentRepository()

#     def get_by_no_or_raise(self, db: Session, payment_no: str) -> Payment:
#         payment = self.repo.get_by_no(db, payment_no)
#         if not payment:
#             raise AppException(404, PaymentErrorCode.PAYMENT_NOT_FOUND, f"Payment {payment_no} not found")
#         return payment

#     def list(self, db: Session, invoice_id: Optional[str], page: int, page_size: int):
#         return self.repo.list(db, invoice_id=invoice_id, page=page, page_size=page_size)

#     def record(
#         self,
#         db:              Session,
#         data:            PaymentCreate,
#         recorded_by:     str,
#         idempotency_key: Optional[str] = None,
#     ) -> Payment:
#         # ── Idempotency check ──────────────────────────────────────────────────
#         if idempotency_key:
#             existing = self.repo.get_by_idempotency_key(db, idempotency_key)
#             if existing:
#                 return existing   # return existing payment, no duplicate

#         # ── Get invoice ────────────────────────────────────────────────────────
#         from app.invoices.repository import InvoiceRepository
#         invoice_repo = InvoiceRepository()
#         invoice = invoice_repo.get_by_no(db, data.invoice_id)
#         if not invoice:
#             raise AppException(404, InvoiceErrorCode.INVOICE_NOT_FOUND, "Invoice not found")

#         # ── Guard ──────────────────────────────────────────────────────────────
#         if not guards.can_record_payment(invoice):
#             raise AppException(400, PaymentErrorCode.INVOICE_ALREADY_PAID,
#                                "This invoice has already been fully paid")

#         # ── Balance check ──────────────────────────────────────────────────────
#         already_paid = self.repo.get_total_paid(db, data.invoice_id)
#         balance = invoice.total_amount - already_paid
#         if data.amount > balance:
#             raise AppException(
#                 400, PaymentErrorCode.PAYMENT_EXCEEDS_BALANCE,
#                 f"Payment amount exceeds outstanding balance of ₦{balance:,.2f}",
#                 details={"balance": str(balance), "attempted": str(data.amount)},
#             )

#         # ── Generate reference if not provided ────────────────────────────────
#         payment_no = generate_entity_no(db, Payment, "payment_no", "PAY")
#         reference  = data.reference or payment_no

#         # ── Create payment ────────────────────────────────────────────────────
#         payment = self.repo.create(
#             db,
#             payment_no      = payment_no,
#             invoice_id      = data.invoice_id,
#             amount          = data.amount,
#             method          = data.method,
#             payment_date    = data.payment_date,
#             reference       = reference,
#             idempotency_key = idempotency_key,
#             recorded_by     = recorded_by,
#         )

#         # ── CASCADE 1: Update invoice status ───────────────────────────────────
#         new_total_paid = already_paid + data.amount
#         new_invoice_status = (
#             PaymentStatus.paid if new_total_paid >= invoice.total_amount
#             else PaymentStatus.partially_paid
#         )
#         from app.invoices.service import InvoiceService
#         invoice_service = InvoiceService()
#         invoice_service.update_status(db, invoice, new_invoice_status)

#         # ── CASCADE 2: Update order payment_status → auto-confirm if paid ─────
#         from app.orders.service import OrderService
#         order_service = OrderService()
#         order = order_service.get_by_id_or_raise(db, invoice.order_id)
#         order_service.update_payment_status(db, order, new_invoice_status)
#         # Note: update_payment_status handles:
#         #   if paid → order_status = confirmed (mirrors frontend updatePaymentStatus exactly)

#         return payment

#     def get_payments_by_invoice(self, db: Session, invoice_id: str):
#         return self.repo.get_by_invoice(db, invoice_id)






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

        from app.orders.service import OrderService

        order_service = OrderService()

        order = order_service.get_by_id_or_raise(
            db,
            invoice.order_id,
        )

        order_service.update_payment_status(
            db,
            order,
            invoice_status,
        )

        return payment