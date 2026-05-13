from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal
from app.models.user import Department
from app.models.procurement import ProcurementStatus


class ProcurementCreate(BaseModel):
    title: str
    description: Optional[str] = None
    department: Department
    estimated_amount: Optional[Decimal] = None
    vendor_name: Optional[str] = None
    vendor_contact: Optional[str] = None
    required_by: Optional[datetime] = None


class ProcurementUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    estimated_amount: Optional[Decimal] = None
    vendor_name: Optional[str] = None
    vendor_contact: Optional[str] = None
    required_by: Optional[datetime] = None
    status: Optional[ProcurementStatus] = None


class ProcurementResponse(BaseModel):
    id: str
    reference: str
    title: str
    description: Optional[str]
    department: Department
    estimated_amount: Optional[Decimal]
    status: ProcurementStatus
    vendor_name: Optional[str]
    vendor_contact: Optional[str]
    required_by: Optional[datetime]
    created_by: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
