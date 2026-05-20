from sqlalchemy import Column, String, Boolean, DateTime, Enum as SAEnum, ForeignKey, Text
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum
from app.database import Base


class VendorCategory(str, enum.Enum):
    equipment = "equipment"           # CNG/LNG equipment, compressors, machinery
    ppe = "ppe"                       # Personal protective equipment
    technical = "technical"           # Spare parts, tools, technical materials
    consumables = "consumables"       # Office supplies, stationery, cleaning
    food_beverage = "food_beverage"   # Staff welfare, canteen supplies
    services = "services"             # Contractors, maintenance, security
    it = "it"                         # Computers, software, networking
    logistics = "logistics"           # Transport, haulage, courier


class VendorStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"


class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    category = Column(SAEnum(VendorCategory), nullable=False)
    contact_person = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)

    # Bank / payment details
    bank_name = Column(String(255), nullable=True)
    account_name = Column(String(255), nullable=True)
    account_number = Column(String(20), nullable=True)

    status = Column(SAEnum(VendorStatus), nullable=False, default=VendorStatus.active)
    added_by = Column(CHAR(36), ForeignKey("users.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    added_by_user = relationship("User", foreign_keys=[added_by])
    procurement_requests = relationship("ProcurementRequest", back_populates="vendor")
