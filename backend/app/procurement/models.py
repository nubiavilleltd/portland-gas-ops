<<<<<<< HEAD
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Numeric, Integer
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base


class ProcurementRequest(Base):
    __tablename__ = "procurement_requests"

    id        = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    reference = Column(String(20), nullable=False, unique=True)   # PR-2026-001
    raised_by = Column(CHAR(36), ForeignKey("employees.id"), nullable=False)
    title     = Column(String(200), nullable=False)
    description      = Column(Text, nullable=True)
    estimated_amount = Column(Numeric(15, 2), nullable=True)
    currency         = Column(String(5), nullable=False, default="NGN")
    vendor_id        = Column(CHAR(36), ForeignKey("vendors.id"), nullable=True)
    status    = Column(String(50), nullable=False, default="draft")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    raiser          = relationship("Employee", foreign_keys=[raised_by])
    vendor          = relationship("Vendor", foreign_keys=[vendor_id])
    items           = relationship("ProcurementItem", back_populates="request", cascade="all, delete-orphan")
    purchase_orders = relationship("PurchaseOrder", back_populates="procurement_request")
=======
from sqlalchemy import Column, String, Boolean, DateTime, Enum as SAEnum, ForeignKey, Text, Numeric, Date, Integer
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum
from app.core.database import Base


class ProcurementStatus(str, enum.Enum):
    draft     = "draft"
    submitted = "submitted"
    ordered   = "ordered"
    delivered = "delivered"
    cancelled = "cancelled"


class ProcurementCategory(str, enum.Enum):
    equipment    = "equipment"
    ppe          = "ppe"
    technical    = "technical"
    consumables  = "consumables"
    food_beverage = "food_beverage"
    services     = "services"
    it           = "it"
    logistics    = "logistics"
    other        = "other"


class ProcurementPriority(str, enum.Enum):
    routine = "routine"
    urgent  = "urgent"
    critical = "critical"


class ItemUnit(str, enum.Enum):
    pieces   = "pieces"
    cartons  = "cartons"
    litres   = "litres"
    kg       = "kg"
    bags     = "bags"
    sets     = "sets"
    units    = "units"
    metres   = "metres"
    pairs    = "pairs"
    rolls    = "rolls"
    packs    = "packs"
    months   = "months"
    days     = "days"
    hours    = "hours"
    trips    = "trips"
    jobs     = "jobs"


class ProcurementRequest(Base):
    __tablename__ = "procurement_requests"

    id              = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    reference       = Column(String(50), nullable=False, unique=True)
    title           = Column(String(255), nullable=False)
    category        = Column(SAEnum(ProcurementCategory), nullable=False)
    priority        = Column(SAEnum(ProcurementPriority), nullable=False, default=ProcurementPriority.routine)
    justification   = Column(Text, nullable=True)
    required_by     = Column(Date, nullable=True)
    vendor_id       = Column(String(36), ForeignKey("vendors.id"), nullable=True)
    status          = Column(SAEnum(ProcurementStatus), nullable=False, default=ProcurementStatus.submitted)
    attachment_url  = Column(String(500), nullable=True)
    attachment_name = Column(String(255), nullable=True)
    po_url          = Column(String(500), nullable=True)
    created_by      = Column(String(36), ForeignKey("users.id"), nullable=False)
    is_active       = Column(Boolean, default=True, nullable=False)
    created_at      = Column(DateTime, default=func.now())
    updated_at      = Column(DateTime, default=func.now(), onupdate=func.now())

    vendor = relationship("Vendor", foreign_keys=[vendor_id])
    items  = relationship("ProcurementItem", back_populates="request", cascade="all, delete-orphan")
>>>>>>> c7b4c06 (merging)


class ProcurementItem(Base):
    __tablename__ = "procurement_items"

<<<<<<< HEAD
    id                     = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    procurement_request_id = Column(CHAR(36), ForeignKey("procurement_requests.id"), nullable=False)
    description = Column(String(255), nullable=False)
    quantity    = Column(Integer, nullable=False)
    unit_price  = Column(Numeric(15, 2), nullable=True)
    total_price = Column(Numeric(15, 2), nullable=True)   # stored for display; computed: qty × unit_price

    request = relationship("ProcurementRequest", back_populates="items")


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id                     = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    po_number              = Column(String(20), nullable=False, unique=True)   # PO-2026-001
    procurement_request_id = Column(CHAR(36), ForeignKey("procurement_requests.id"), nullable=False)
    vendor_id   = Column(CHAR(36), ForeignKey("vendors.id"), nullable=False)
    total_amount = Column(Numeric(15, 2), nullable=False)
    currency     = Column(String(5), nullable=False, default="NGN")
    issued_by    = Column(CHAR(36), ForeignKey("employees.id"), nullable=False)
    issued_at    = Column(DateTime(timezone=True), server_default=func.now())
    status       = Column(String(20), nullable=False, default="issued")   # issued | delivered | cancelled
    notes        = Column(Text, nullable=True)
    document_id  = Column(Integer, ForeignKey("documents.id"), nullable=True)

    procurement_request = relationship("ProcurementRequest", back_populates="purchase_orders")
    vendor   = relationship("Vendor", foreign_keys=[vendor_id])
    issuer   = relationship("Employee", foreign_keys=[issued_by])
    document = relationship("Document", foreign_keys=[document_id])
=======
    id          = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    request_id  = Column(String(36), ForeignKey("procurement_requests.id"), nullable=False)
    description = Column(String(500), nullable=False)
    quantity    = Column(Numeric(12, 2), nullable=False)
    unit        = Column(SAEnum(ItemUnit), nullable=False)
    unit_cost   = Column(Numeric(15, 2), nullable=False)
    total_cost  = Column(Numeric(15, 2), nullable=False)
    created_at  = Column(DateTime, default=func.now())

    request = relationship("ProcurementRequest", back_populates="items")
>>>>>>> c7b4c06 (merging)
