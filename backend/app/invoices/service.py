from __future__ import annotations
from sqlalchemy.orm import Session
from typing import Optional
from app.invoices.repository import InvoiceRepository
from app.invoices.model import Invoice
from app.invoices.schema import InvoiceCreate
from app.invoices.error_codes import InvoiceErrorCode
from app.invoices import guards
from app.payments.enums import PaymentStatus
from app.core.exceptions import AppException, ErrorCode
from app.shared.utils.number_generator import generate_entity_no


class InvoiceService:

    def __init__(self):
        self.repo = InvoiceRepository()

    def get_by_no_or_raise(self, db: Session, invoice_no: str) -> Invoice:
        invoice = self.repo.get_by_no(db, invoice_no)
        if not invoice:
            raise AppException(404, InvoiceErrorCode.INVOICE_NOT_FOUND, f"Invoice {invoice_no} not found")
        return invoice

    def get_by_id_or_none(self, db: Session, invoice_id: str) -> Optional[Invoice]:
        return self.repo.get_by_id(db, invoice_id)

    def list(self, db: Session, order_id: Optional[str], status: Optional[PaymentStatus], page: int, page_size: int):
        return self.repo.list(
            db,
            order_id  = order_id,
            status    = status.value if status else None,
            page      = page,
            page_size = page_size,
        )

    def create(self, db: Session, data: InvoiceCreate, created_by: str) -> Invoice:
        from app.orders.service import OrderService
        order_service = OrderService()

        # Get the order
        order = order_service.get_by_no_or_raise(db, data.order_id)

        # Guard: can generate invoice?
        # Frontend: canGenerateInvoice = order_status == "submitted" && !order.invoice_id
        if order.order_status.value != "submitted":
            raise AppException(400, InvoiceErrorCode.ORDER_NOT_INVOICEABLE,
                               "Invoice can only be generated for submitted orders")
        if order.invoice_id:
            raise AppException(409, InvoiceErrorCode.INVOICE_ALREADY_EXISTS,
                               "An invoice already exists for this order")

        invoice_no = generate_entity_no(db, Invoice, "invoice_no", "INV")

        invoice = self.repo.create(
            db,
            invoice_no   = invoice_no,
            order_id     = data.order_id,
            total_amount = order.total_amount,
            status       = PaymentStatus.unpaid,
            issued_date  = data.invoice_date,
            due_date     = data.due_date,
            notes        = data.notes,
            created_by   = created_by,
        )

        # Cascade: link invoice to order + set payment_status=unpaid
        order_service.set_invoice(db, order, invoice.id)
        order_service.repo.update(db, order, payment_status=PaymentStatus.unpaid)

        return invoice

    def void(self, db: Session, invoice: Invoice) -> Invoice:
        if not guards.can_void(invoice):
            raise AppException(400, InvoiceErrorCode.INVOICE_CANNOT_BE_VOIDED,
                               "Only unpaid or partially paid invoices can be voided")
        return self.repo.update(db, invoice, status=PaymentStatus.void)

    def update_status(self, db: Session, invoice: Invoice, status: PaymentStatus) -> Invoice:
        return self.repo.update(db, invoice, status=status)