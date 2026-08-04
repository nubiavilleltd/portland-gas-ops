from sqlalchemy import Column, String, Boolean, DateTime, Enum as SAEnum, ForeignKey, Text, Integer
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum
from app.core.database import Base


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


class VendorType(str, enum.Enum):
    approved = "approved"   # created by admin — verified supplier
    adhoc    = "adhoc"      # created inline during a procurement request by a regular user


class VendorSize(str, enum.Enum):
    """
    Business size classification based on annual turnover (Nigerian standards).
    - small: Turnover ≤ ₦25 million — VAT registration not required
    - medium_large: Turnover > ₦25 million — VAT registration required
    """
    small        = "small"         # ≤ ₦25m turnover
    medium_large = "medium_large"  # > ₦25m turnover


class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    category = Column(SAEnum(VendorCategory), nullable=False)
    contact_person = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=False)
    email = Column(String(255), nullable=False)
    address = Column(Text, nullable=False)

    # Bank / payment details
    bank_name = Column(String(255), nullable=False)
    account_name = Column(String(255), nullable=False)
    account_number = Column(String(20), nullable=False)

    vendor_code       = Column(String(20), nullable=True, unique=True, index=True)  # e.g. AT-K7M2
    logo_document_id  = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)

    # Business classification — determines document requirements
    business_size = Column(SAEnum(VendorSize), nullable=True)  # small (≤₦25m) or medium_large (>₦25m)

    # Compliance documents — stored in documents table, linked here
    cac_certificate_document_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    tin_certificate_document_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    vat_certificate_document_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)

    vendor_type = Column(SAEnum(VendorType), nullable=False, default=VendorType.approved)
    status = Column(SAEnum(VendorStatus), nullable=False, default=VendorStatus.active)
    added_by = Column(CHAR(36), ForeignKey("users.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    added_by_user  = relationship("User", foreign_keys=[added_by])
    logo_document  = relationship("Document", foreign_keys=[logo_document_id])
    cac_certificate_document = relationship("Document", foreign_keys=[cac_certificate_document_id])
    tin_certificate_document = relationship("Document", foreign_keys=[tin_certificate_document_id])
    vat_certificate_document = relationship("Document", foreign_keys=[vat_certificate_document_id])

    @property
    def logo_url(self) -> str | None:
        """Derive logo URL from the linked document — consistent with User.profile_picture_url."""
        if self.logo_document and self.logo_document.file_path:
            return self.logo_document.file_path
        return None

    @property
    def cac_certificate_url(self) -> str | None:
        if self.cac_certificate_document and self.cac_certificate_document.file_path:
            return self.cac_certificate_document.file_path
        return None

    @property
    def tin_certificate_url(self) -> str | None:
        if self.tin_certificate_document and self.tin_certificate_document.file_path:
            return self.tin_certificate_document.file_path
        return None

    @property
    def vat_certificate_url(self) -> str | None:
        if self.vat_certificate_document and self.vat_certificate_document.file_path:
            return self.vat_certificate_document.file_path
        return None
