from __future__ import annotations
import uuid
from sqlalchemy import Column, String, Numeric, DateTime, Date, Enum as SAEnum, ForeignKey
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.payments.enums import PaymentMethod


class Payment(Base):
    __tablename__ = "payments"

    id              = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    payment_no      = Column(String(50), unique=True, nullable=True, index=True)
    invoice_id      = Column(CHAR(36), ForeignKey("invoices.id", ondelete="RESTRICT"), nullable=False)
    amount          = Column(Numeric(15, 2), nullable=False)
    method          = Column(SAEnum(PaymentMethod), nullable=False)
    payment_date    = Column(Date, nullable=False)
    reference       = Column(String(100), unique=True, nullable=True)
    idempotency_key = Column(String(100), unique=True, nullable=True, index=True)
    recorded_by     = Column(CHAR(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    invoice    = relationship("Invoice", back_populates="payments")
    recorder   = relationship("User", foreign_keys=[recorded_by])