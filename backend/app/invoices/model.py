from __future__ import annotations
import uuid
from sqlalchemy import Column, String, Text, Numeric, DateTime, Date, Enum as SAEnum, ForeignKey
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.payments.enums import PaymentStatus


class Invoice(Base):
    __tablename__ = "invoices"

    id         = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_no = Column(String(50), unique=True, nullable=True, index=True)
    order_id   = Column(CHAR(36), ForeignKey("orders.id", ondelete="RESTRICT"), nullable=False, unique=True)
    total_amount = Column(Numeric(15, 2), nullable=False)
    status     = Column(SAEnum(PaymentStatus), nullable=False, default=PaymentStatus.unpaid)
    issued_date = Column(Date, nullable=False)
    due_date   = Column(Date, nullable=False)
    notes      = Column(Text, nullable=True)
    created_by = Column(CHAR(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    paid_at = Column(DateTime(timezone=True), nullable=True)

    order = relationship("Order", foreign_keys=[order_id], uselist=False)
    payments = relationship("Payment", back_populates="invoice")
    created_by_user = relationship(
        "User",
        foreign_keys=[created_by],
    )

    @property
    def order_no(self) -> str | None:
        return self.order.order_no if self.order else None