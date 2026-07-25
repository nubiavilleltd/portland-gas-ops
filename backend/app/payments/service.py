from __future__ import annotations
import uuid

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
from app.shared.services.cloudinary_service import (
    ResourceType,
    get_storage_service,
)
from app.payments.schema import PaymentAttachmentResponse
from app.core.exceptions import AppException, ErrorCode

from app.shared.models.document import Document



class PaymentService:

    def __init__(self):
        self.repo = PaymentRepository()
        self.storage = get_storage_service()

    # ------------------------------------------------------------------
    # Retrieval
    # ------------------------------------------------------------------

    def get_or_raise(self, db: Session, payment_id: str) -> Payment:
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
        attachments: list[tuple[bytes, str, str, int]] | None = None,
        uploaded_by: str | None = None,
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
        invoice = invoice_service.get_or_raise(
            db,
            data.invoice_id,
        )



        from app.orders.service import OrderService

        order_service = OrderService()

        order = order_service.get_or_raise(
            db,
            invoice.order_id,
        )


        # --------------------------------------------------------------
        # Business guards
        # --------------------------------------------------------------

        guards.ensure_can_record_payment(invoice)

        # --------------------------------------------------------------
        # Outstanding balance
        # --------------------------------------------------------------

        total_paid = self.repo.get_total_paid(
            db,
            invoice.id,
        )

        remaining_balance = invoice.total_amount - total_paid

        guards.ensure_payment_does_not_exceed_balance(
            amount=data.amount,
            remaining_balance=remaining_balance,
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

        with db.begin_nested():

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

            if attachments:
                self._upload_attachments(
                    db=db,
                    payment=payment,
                    attachments=attachments,
                    uploaded_by=uploaded_by,
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
    
    def get_attachments(
        self,
        db: Session,
        payment: Payment,
    ) -> list[PaymentAttachmentResponse]:

        docs = self.repo.get_payment_attachments(
            db,
            payment.id,
        )

        return [
            PaymentAttachmentResponse(
                id=str(doc.id),
                url=doc.file_path or "",
                name=doc.name,
            )
            for doc in docs
        ]

    def get_attachment_or_raise(
        self,
        db: Session,
        payment_id: str,
        attachment_id: str,
    ) -> Document:
        attachment = self.repo.get_attachment(
            db,
            payment_id,
            attachment_id,
        )

        if not attachment:
            raise AppException(
                status_code=404,
                error_code=ErrorCode.NOT_FOUND,
                message="Attachment not found.",
            )

        return attachment
    

    def _upload_attachments(
        self,
        *,
        db: Session,
        payment: Payment,
        attachments: list[tuple[bytes, str, str, int]],
        uploaded_by: str | None,
    ) -> None:

        for (
            file_bytes,
            filename,
            mime_type,
            file_size,
        ) in attachments:

            result = self.storage.upload(
                file_bytes=file_bytes,
                # filename=filename,
                filename = f"{uuid.uuid4()}_{filename}",
                folder=f"payments/{payment.id}",
                resource_type=ResourceType.RAW,
                overwrite=False,
            )

            self.repo.create_attachment_document(
                db=db,
                payment_id=payment.id,
                filename=filename,
                url=result.url,
                file_size=result.file_size,
                mime_type=mime_type,
                uploaded_by=uploaded_by,
            )

    def _delete_all_attachments(
        self,
        db: Session,
        payment: Payment,
    ) -> None:

        docs = self.repo.get_payment_attachments(
            db,
            payment.id,
        )

        for doc in docs:
            self.repo.delete_attachment_document(
                db,
                doc.id,
            )