from __future__ import annotations

from decimal import Decimal
from typing import List, Optional, Tuple

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.payments.model import Payment
from app.shared.models.document import Document


class PaymentRepository:

    def get_by_id(
        self,
        db: Session,
        payment_id: str,
    ) -> Optional[Payment]:
        return (
            db.query(Payment)
            .options(joinedload(Payment.invoice))
            .filter(Payment.id == payment_id)
            .first()
        )

    def get_by_no(
        self,
        db: Session,
        payment_no: str,
    ) -> Optional[Payment]:
        return (
            db.query(Payment)
            .options(joinedload(Payment.invoice))
            .filter(Payment.payment_no == payment_no)
            .first()
        )

    def get_by_reference(
        self,
        db: Session,
        reference: str,
    ) -> Optional[Payment]:
        return (
            db.query(Payment)
            .filter(Payment.reference == reference)
            .first()
        )

    def get_by_idempotency_key(
        self,
        db: Session,
        key: str,
    ) -> Optional[Payment]:
        return (
            db.query(Payment)
            .filter(Payment.idempotency_key == key)
            .first()
        )

    def get_by_invoice(
        self,
        db: Session,
        invoice_id: str,
    ) -> List[Payment]:
        return (
            db.query(Payment)
            .filter(Payment.invoice_id == invoice_id)
            .order_by(Payment.payment_date)
            .all()
        )

    def get_total_paid(
        self,
        db: Session,
        invoice_id: str,
    ) -> Decimal:
        result = (
            db.query(func.sum(Payment.amount))
            .filter(Payment.invoice_id == invoice_id)
            .scalar()
        )
        return Decimal(str(result or 0))

    def list(
        self,
        db: Session,
        invoice_id: Optional[str] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> Tuple[List[Payment], int]:
        q = (
            db.query(Payment)
            .options(joinedload(Payment.invoice))
        )

        if invoice_id:
            q = q.filter(Payment.invoice_id == invoice_id)

        total = q.with_entities(func.count(Payment.id)).scalar() or 0

        items = (
            q.order_by(Payment.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        return items, total

    def create(
        self,
        db: Session,
        **fields,
    ) -> Payment:
        payment = Payment(**fields)
        db.add(payment)
        db.flush()
        return payment

    def update(
        self,
        db: Session,
        payment: Payment,
        **fields,
    ) -> Payment:
        for key, value in fields.items():
            setattr(payment, key, value)

        db.flush()
        return payment
    

    def get_payment_attachments(
        self,
        db: Session,
        payment_id: str,
    ) -> list[Document]:

        return (
            db.query(Document)
            .filter(
                Document.category == f"payment:{payment_id}",
                Document.type == "file",
            )
            .order_by(Document.created_at.asc())
            .all()
        )

    def get_attachment(
        self,
        db: Session,
        payment_id: str,
        attachment_id: str,
    ) -> Document | None:
        return (
            db.query(Document)
            .filter(
                Document.id == attachment_id,
                Document.category == f"payment:{payment_id}",
            )
            .first()
        )
    

    def create_attachment_document(
        self,
        db: Session,
        payment_id: str,
        filename: str,
        url: str,
        file_size: int,
        mime_type: str,
        uploaded_by: str | None = None,
    ) -> Document:

        doc = Document(
            type="file",
            name=filename,
            category=f"payment:{payment_id}",
            file_path=url,
            file_size=file_size,
            mime_type=mime_type,
            uploaded_by=uploaded_by,
            parent_id=None,
        )

        db.add(doc)
        db.flush()

        return doc
    


    def delete_attachment_document(
        self,
        db: Session,
        doc_id: int,
    ) -> None:

        doc = (
            db.query(Document)
            .filter(Document.id == doc_id)
            .first()
        )

        if doc:
            db.delete(doc)
            db.flush()