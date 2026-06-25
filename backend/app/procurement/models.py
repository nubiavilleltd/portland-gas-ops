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


class ProcurementItem(Base):
    __tablename__ = "procurement_items"

    id          = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    request_id  = Column(String(36), ForeignKey("procurement_requests.id"), nullable=False)
    description = Column(String(500), nullable=False)
    quantity    = Column(Numeric(12, 2), nullable=False)
    unit        = Column(SAEnum(ItemUnit), nullable=False)
    unit_cost   = Column(Numeric(15, 2), nullable=False)
    total_cost  = Column(Numeric(15, 2), nullable=False)
    created_at  = Column(DateTime, default=func.now())

    request = relationship("ProcurementRequest", back_populates="items")
