from sqlalchemy import Column, String, DateTime, Date, ForeignKey, Text, Numeric, Integer
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base


class ProcurementRequest(Base):
    __tablename__ = "procurement_requests"

    id        = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    reference = Column(String(20), nullable=False, unique=True)
    raised_by = Column(CHAR(36), ForeignKey("employees.id"), nullable=False)
    category  = Column(String(50),  nullable=True)
    description      = Column(Text, nullable=True)
    estimated_amount = Column(Numeric(15, 2), nullable=True)
    currency         = Column(String(5), nullable=False, default="NGN")
    required_by      = Column(Date, nullable=True)
    vendor_id        = Column(CHAR(36), ForeignKey("vendors.id"), nullable=True)
    status    = Column(String(50), nullable=False, default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    attachment_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)

    raiser          = relationship("Employee", foreign_keys=[raised_by])
    vendor          = relationship("Vendor", foreign_keys=[vendor_id])
    attachment      = relationship("Document", foreign_keys=[attachment_id])
    items           = relationship("ProcurementItem", back_populates="request", cascade="all, delete-orphan")
    purchase_orders = relationship("PurchaseOrder", back_populates="procurement_request")


class ProcurementItem(Base):
    __tablename__ = "procurement_items"

    id                     = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    procurement_request_id = Column(CHAR(36), ForeignKey("procurement_requests.id"), nullable=False)
    description = Column(String(255), nullable=False)
    quantity    = Column(Integer, nullable=False)
    unit        = Column(String(20), nullable=True)
    unit_price  = Column(Numeric(15, 2), nullable=True)
    total_price = Column(Numeric(15, 2), nullable=True)

    request = relationship("ProcurementRequest", back_populates="items")


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id                     = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    po_number              = Column(String(20), nullable=False, unique=True)
    procurement_request_id = Column(CHAR(36), ForeignKey("procurement_requests.id"), nullable=False)
    vendor_id   = Column(CHAR(36), ForeignKey("vendors.id"), nullable=False)
    total_amount = Column(Numeric(15, 2), nullable=False)
    currency     = Column(String(5), nullable=False, default="NGN")
    issued_by    = Column(CHAR(36), ForeignKey("employees.id"), nullable=False)
    issued_at    = Column(DateTime(timezone=True), server_default=func.now())
    status       = Column(String(20), nullable=False, default="issued")
    notes        = Column(Text, nullable=True)
    document_id  = Column(Integer, ForeignKey("documents.id"), nullable=True)

    procurement_request = relationship("ProcurementRequest", back_populates="purchase_orders")
    vendor   = relationship("Vendor", foreign_keys=[vendor_id])
    issuer   = relationship("Employee", foreign_keys=[issued_by])
    document = relationship("Document", foreign_keys=[document_id])
