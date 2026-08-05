from __future__ import annotations

from typing import Optional

from sqlalchemy.orm import Session

from app.core.exceptions import AppException
from app.invoices import guards
from app.invoices.error_codes import InvoiceErrorCode
from app.invoices.model import Invoice
from app.invoices.repository import InvoiceRepository
from app.invoices.schema import InvoiceCreate
from app.orders.service import OrderService
from app.payments.enums import PaymentStatus
from app.invoices.schema import InvoiceFilters
from app.orders import guards as order_guards
from decimal import Decimal

from app.payments.enums import PaymentStatus
from app.payments.service import PaymentService


class InvoiceService:

    def __init__(self):
        self.repo = InvoiceRepository()
        self.order_service = OrderService()
        self.payment_service = PaymentService()

    # ------------------------------------------------------------------
    # Queries
    # ------------------------------------------------------------------

    def get_by_no_or_raise(self, db: Session, invoice_no: str) -> Invoice:
        invoice = self.repo.get_by_no(db, invoice_no)
        if not invoice:
            raise AppException(
                404,
                InvoiceErrorCode.INVOICE_NOT_FOUND,
                f"Invoice {invoice_no} not found",
            )
        return invoice

    def get_or_raise(self, db: Session, invoice_id: str) -> Invoice:
        invoice = self.repo.get_by_id(db, invoice_id)
        if not invoice:
            raise AppException(
                404,
                InvoiceErrorCode.INVOICE_NOT_FOUND,
                f"Invoice {invoice_id} not found",
            )
        return invoice

    def get_or_none(
        self,
        db: Session,
        invoice_id: str,
    ) -> Optional[Invoice]:
        return self.repo.get_by_id(db, invoice_id)
    
    
    def get_by_order_id_or_raise(self, db: Session, order_id: str) -> Invoice:
        invoice = self.repo.get_by_order_id(db, order_id)
        if not invoice:
            raise AppException(
                404,
                InvoiceErrorCode.INVOICE_NOT_FOUND,
                f"Invoice for order {order_id} not found",
            )
        return invoice

    def list(
        self,
        db: Session,
        filters: InvoiceFilters,
    ):
        return self.repo.list(
            db=db,
            order_id=filters.order_id,
            status=filters.status.value if filters.status else None,
            page=filters.page,
            page_size=filters.page_size,
        )

    # ------------------------------------------------------------------
    # Commands
    # ------------------------------------------------------------------

    def create(
        self,
        db: Session,
        data: InvoiceCreate,
        created_by: str,
    ) -> Invoice:

        order = self.order_service.get_or_raise(db, data.order_id)

        order_guards.ensure_can_generate_invoice(order)

        invoice = self.repo.create(
            db=db,
            invoice_no=self.repo.generate_invoice_no(db),
            order_id=order.id,
            total_amount=order.total_amount,
            status=PaymentStatus.unpaid,
            issued_date=data.issued_date,
            due_date=data.due_date,
            notes=data.notes,
            created_by=created_by,
        )

        # Link invoice to the order.
        # Order confirmation happens later when payment is received.
        self.order_service.set_invoice(db, order, invoice.id)

        return invoice

    def void(
        self,
        db: Session,
        invoice: Invoice,
    ) -> Invoice:

        if not guards.can_void(invoice):
            raise AppException(
                400,
                InvoiceErrorCode.INVOICE_CANNOT_BE_VOIDED,
                "Only unpaid, partially paid or overdue invoices can be voided",
            )

        return self.repo.update(
            db,
            invoice,
            status=PaymentStatus.void,
        )

    def update_status(
        self,
        db: Session,
        invoice: Invoice,
        status: PaymentStatus,
    ) -> Invoice:

        return self.repo.update(
            db,
            invoice,
            status=status,
        )
    def refresh_payment_status(
        self,
        db: Session,
        invoice,
    ) -> PaymentStatus:
        """
        Refresh the invoice payment status based on the current total paid.

        Returns the updated status so callers can synchronize dependent entities.
        """

        total_paid = self.payment_service.get_total_paid_for_invoice(
            db,
            invoice.id,
        )
        

        remaining_balance = invoice.total_amount - total_paid

        status = (
            PaymentStatus.paid
            if remaining_balance <= Decimal("0")
            else PaymentStatus.partially_paid
        )

        self.update_status(
            db,
            invoice,
            status,
        )

        return status