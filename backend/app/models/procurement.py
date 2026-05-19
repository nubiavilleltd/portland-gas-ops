from sqlalchemy import Column, String, Boolean, DateTime, Enum as SAEnum, ForeignKey, Text, Numeric, Date
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum
from app.database import Base


class ProcurementStatus(str, enum.Enum):
    draft = "draft"           # Saved but not submitted
    submitted = "submitted"   # Submitted by staff, awaiting procurement team
    ordered = "ordered"       # Procurement team placed the order
    delivered = "delivered"   # Goods/services received
    cancelled = "cancelled"   # Cancelled


class ProcurementCategory(str, enum.Enum):
    consumables = "consumables"       # Office supplies, food, cleaning materials
    technical = "technical"           # CNG equipment, spare parts, tools
    services = "services"             # Contractors, maintenance, security
    capital = "capital"               # Major equipment (will link to assets later)


class ProcurementPriority(str, enum.Enum):
    routine = "routine"       # Normal — no urgency
    urgent = "urgent"         # Needed soon
    emergency = "emergency"   # Needed immediately


class ItemUnit(str, enum.Enum):
    pieces = "pieces"
    litres = "litres"
    kg = "kg"
    boxes = "boxes"
    metres = "metres"
    hours = "hours"
    sets = "sets"
    cartons = "cartons"
    units = "units"


class ProcurementRequest(Base):
    __tablename__ = "procurement_requests"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    reference = Column(String(50), unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    category = Column(SAEnum(ProcurementCategory), nullable=False)
    priority = Column(SAEnum(ProcurementPriority), nullable=False, default=ProcurementPriority.routine)
    justification = Column(Text, nullable=True)

    # Vendor — optional FK. Staff can also type a vendor not yet in the system.
    vendor_id = Column(CHAR(36), ForeignKey("vendors.id"), nullable=True)

    required_by = Column(Date, nullable=True)
    status = Column(SAEnum(ProcurementStatus), nullable=False, default=ProcurementStatus.draft)

    # File attachment (supporting document — quote, spec sheet, etc.)
    attachment_url = Column(String(500), nullable=True)
    attachment_name = Column(String(255), nullable=True)

    # Generated Purchase Order PDF
    po_url = Column(String(500), nullable=True)

    created_by = Column(CHAR(36), ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships — SQLAlchemy loads these automatically when you access them
    vendor = relationship("Vendor", back_populates="procurement_requests")
    items = relationship("ProcurementItem", back_populates="request", cascade="all, delete-orphan")
    creator = relationship("User", foreign_keys=[created_by])


class ProcurementItem(Base):
    """One line item on a procurement request. A request can have many items."""
    __tablename__ = "procurement_items"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    request_id = Column(CHAR(36), ForeignKey("procurement_requests.id"), nullable=False)
    description = Column(Text, nullable=False)
    quantity = Column(Numeric(10, 2), nullable=False)
    unit = Column(SAEnum(ItemUnit), nullable=False)
    unit_cost = Column(Numeric(12, 2), nullable=False)
    total_cost = Column(Numeric(12, 2), nullable=False)  # stored = qty * unit_cost
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship back to the parent request
    request = relationship("ProcurementRequest", back_populates="items")
