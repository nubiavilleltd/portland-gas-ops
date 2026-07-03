from __future__ import annotations

from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.invoices.model import Invoice
from app.payments.enums import PaymentStatus
from app.shared.utils.number_generator import generate_entity_no


class InvoiceRepository:

    def generate_invoice_no(self, db: Session) -> str:
        return generate_entity_no(db, Invoice, "invoice_no", "INV")

    def get_by_id(self, db: Session, invoice_id: str) -> Optional[Invoice]:
        return (
            db.query(Invoice)
            .options(
                joinedload(Invoice.order),
                joinedload(Invoice.payments),
            )
            .filter(Invoice.id == invoice_id)
            .first()
        )

    def get_by_no(self, db: Session, invoice_no: str) -> Optional[Invoice]:
        return (
            db.query(Invoice)
            .options(
                joinedload(Invoice.order),
                joinedload(Invoice.payments),
            )
            .filter(Invoice.invoice_no == invoice_no)
            .first()
        )

    def get_by_order_id(self, db: Session, order_id: str) -> Optional[Invoice]:
        return (
            db.query(Invoice)
            .options(
                joinedload(Invoice.order),
                joinedload(Invoice.payments),
            )
            .filter(Invoice.order_id == order_id)
            .first()
        )

    def list(
        self,
        db: Session,
        order_id: Optional[str] = None,
        status: Optional[PaymentStatus] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[list[Invoice], int]:
        q = (
            db.query(Invoice)
            .options(
                joinedload(Invoice.order),
                joinedload(Invoice.payments),
            )
        )

        if order_id:
            q = q.filter(Invoice.order_id == order_id)

        if status:
            q = q.filter(Invoice.status == status)

        total = q.with_entities(func.count(Invoice.id)).scalar() or 0

        items = (
            q.order_by(Invoice.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        return items, total

    def create(self, db: Session, **fields) -> Invoice:
        invoice = Invoice(**fields)
        db.add(invoice)
        db.flush()
        return invoice

    def update(self, db: Session, invoice: Invoice, **fields) -> Invoice:
        for key, value in fields.items():
            setattr(invoice, key, value)

        db.flush()
        return invoice