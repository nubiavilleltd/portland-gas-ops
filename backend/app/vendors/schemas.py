"""
Pydantic schemas for the Vendor resource.

Three schemas follow the standard pattern:
  - VendorCreate   → what the client sends when adding a vendor (POST body)
  - VendorUpdate   → what the client sends when editing a vendor (PATCH body, all optional)
  - VendorResponse → what the API returns (includes id, timestamps, etc.)

The model (app/vendors/models.py) owns the database columns.
The schema owns the API surface — what is accepted and what is exposed.
"""

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.vendors.models import VendorCategory, VendorStatus, VendorType, VendorSize


class VendorCreate(BaseModel):
    name: str
    category: VendorCategory
    vendor_type: VendorType = VendorType.approved
    business_size: Optional[VendorSize] = None  # Required for approved vendors, optional for adhoc
    contact_person: str
    phone: str
    email: EmailStr
    address: str
    bank_name: str
    account_name: str
    account_number: str


class VendorUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[VendorCategory] = None
    business_size: Optional[VendorSize] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    bank_name: Optional[str] = None
    account_name: Optional[str] = None
    account_number: Optional[str] = None
    status: Optional[VendorStatus] = None


class VendorResponse(BaseModel):
    id: str
    name: str
    category: VendorCategory
    vendor_code: Optional[str]
    business_size: Optional[VendorSize]
    contact_person: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    address: Optional[str]
    bank_name: Optional[str]
    account_name: Optional[str]
    account_number: Optional[str]
    logo_url: Optional[str]          # derived from logo_document.file_path via model property
    logo_document_id: Optional[int]
    # Compliance documents
    cac_certificate_url: Optional[str]
    cac_certificate_document_id: Optional[int]
    tin_certificate_url: Optional[str]
    tin_certificate_document_id: Optional[int]
    vat_certificate_url: Optional[str]
    vat_certificate_document_id: Optional[int]
    vendor_type: VendorType
    status: VendorStatus
    added_by: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True  # Allows Pydantic to read SQLAlchemy ORM objects and properties
