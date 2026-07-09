from sqlalchemy import (
    Column, String, DateTime, Numeric, Enum as SAEnum,
    ForeignKey, Text, Date, Integer
)
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum

from app.core.database import Base


class CashRequisitionStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    denied = "denied"
    retired = "retired"


class CashRequisition(Base):
    __tablename__ = "cash_requisitions"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    reference = Column(String(50), unique=True, nullable=False, index=True)  # CRQ-YYYYMMDD-XXXXXX

    # Foreign keys
    requester_id = Column(CHAR(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)

    # Request details
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    department = Column(String(100), nullable=False)

    # Amount and currency
    amount = Column(Numeric(15, 2), nullable=False)
    currency = Column(String(3), default="NGN")  # NGN, USD, EUR, GBP

    # Expected retirement date
    expected_retirement = Column(Date, nullable=True)

    # Status
    status = Column(SAEnum(CashRequisitionStatus), default=CashRequisitionStatus.pending)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    requester = relationship("User")
    document = relationship("Document", foreign_keys=[document_id])
