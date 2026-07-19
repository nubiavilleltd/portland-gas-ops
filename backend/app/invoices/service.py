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


class InvoiceService:

    def __init__(self):
        self.repo = InvoiceRepository()
        self.order_service = OrderService()

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

    def get_by_id_or_raise(self, db: Session, invoice_id: str) -> Invoice:
        invoice = self.repo.get_by_id(db, invoice_id)
        if not invoice:
            raise AppException(
                404,
                InvoiceErrorCode.INVOICE_NOT_FOUND,
                f"Invoice {invoice_id} not found",
            )
        return invoice

    def get_by_id_or_none(
        self,
        db: Session,
        invoice_id: str,
    ) -> Optional[Invoice]:
        return self.repo.get_by_id(db, invoice_id)

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

        if not order_guards.can_generate_invoice(order):
            if order.invoice_id:
                raise AppException(
                    409,
                    InvoiceErrorCode.INVOICE_ALREADY_EXISTS,
                    "An invoice already exists for this order",
                )

            raise AppException(
                400,
                InvoiceErrorCode.ORDER_NOT_INVOICEABLE,
                "This order cannot be invoiced",
            )

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