from __future__ import annotations
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import Optional, List, Tuple
from decimal import Decimal
from app.payments.model import Payment


class PaymentRepository:

    def get_by_id(self, db: Session, payment_id: str) -> Optional[Payment]:
        return (
            db.query(Payment)
            .options(joinedload(Payment.invoice))
            .filter(Payment.id == payment_id)
            .first()
        )

    def get_by_no(self, db: Session, payment_no: str) -> Optional[Payment]:
        return (
            db.query(Payment)
            .options(joinedload(Payment.invoice))
            .filter(Payment.payment_no == payment_no)
            .first()
        )

    def get_by_idempotency_key(self, db: Session, key: str) -> Optional[Payment]:
        return db.query(Payment).filter(Payment.idempotency_key == key).first()

    def get_by_invoice(self, db: Session, invoice_id: str) -> List[Payment]:
        return (
            db.query(Payment)
            .filter(Payment.invoice_id == invoice_id)
            .order_by(Payment.payment_date)
            .all()
        )

    def get_total_paid(self, db: Session, invoice_id: str) -> Decimal:
        result = db.query(func.sum(Payment.amount)).filter(
            Payment.invoice_id == invoice_id
        ).scalar()
        return Decimal(str(result or 0))

    def list(
        self,
        db:         Session,
        invoice_id: Optional[str] = None,
        page:       int = 1,
        page_size:  int = 50,
    ) -> Tuple[List[Payment], int]:
        q = db.query(Payment).options(joinedload(Payment.invoice))
        if invoice_id:
            q = q.filter(Payment.invoice_id == invoice_id)
        total = q.with_entities(func.count(Payment.id)).scalar() or 0
        items = q.order_by(Payment.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
        return items, total

    def create(self, db: Session, **fields) -> Payment:
        payment = Payment(**fields)
        db.add(payment)
        db.flush()
        return payment