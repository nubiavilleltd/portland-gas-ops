from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


# ── Nested ─────────────────────────────────────────────────────────────────────

class UserInProcurement(BaseModel):
    first_name: Optional[str]
    last_name: Optional[str]
    email: str

    class Config:
        from_attributes = True


class EmployeeInProcurement(BaseModel):
    id: str
    employee_no: str
    job_title: Optional[str]
    department: Optional[str]
    user: Optional[UserInProcurement]

    class Config:
        from_attributes = True


class VendorInProcurement(BaseModel):
    id: str
    name: str
    phone: Optional[str]
    email: Optional[str]
    address: Optional[str]
    bank_name: Optional[str]
    account_name: Optional[str]
    account_number: Optional[str]

    class Config:
        from_attributes = True


# ── Items ──────────────────────────────────────────────────────────────────────

class ProcurementItemCreate(BaseModel):
    description: str = Field(..., min_length=1, max_length=255)
    quantity: int = Field(..., gt=0)
    unit_price: Optional[Decimal] = None
    total_price: Optional[Decimal] = None

    @field_validator("description")
    @classmethod
    def strip_description(cls, v: str) -> str:
        return v.strip()


class ProcurementItemResponse(BaseModel):
    id: str
    description: str
    quantity: int
    unit_price: Optional[Decimal]
    total_price: Optional[Decimal]

    class Config:
        from_attributes = True


# ── Procurement request ────────────────────────────────────────────────────────

class ProcurementCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    estimated_amount: Optional[Decimal] = None
    currency: str = "NGN"
    vendor_id: Optional[str] = None
    items: List[ProcurementItemCreate] = Field(..., min_length=1)

    @field_validator("title", "description")
    @classmethod
    def strip_text(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if v else v


class ProcurementUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = None
    estimated_amount: Optional[Decimal] = None
    vendor_id: Optional[str] = None
    items: Optional[List[ProcurementItemCreate]] = None


class ActionRequest(BaseModel):
    """Body for approve / reject / return actions."""
    comment: Optional[str] = None


class ProcurementResponse(BaseModel):
    id: str
    reference: str
    title: str
    description: Optional[str]
    estimated_amount: Optional[Decimal]
    currency: str
    status: str
    raised_by: str
    vendor_id: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    raiser: Optional[EmployeeInProcurement]
    vendor: Optional[VendorInProcurement]
    items: List[ProcurementItemResponse] = []
    purchase_orders: List["PurchaseOrderResponse"] = []

    class Config:
        from_attributes = True


class ProcurementListItem(BaseModel):
    id: str
    reference: str
    title: str
    status: str
    estimated_amount: Optional[Decimal]
    currency: str
    raised_by: str
    vendor_id: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    raiser: Optional[EmployeeInProcurement]
    vendor: Optional[VendorInProcurement]

    class Config:
        from_attributes = True


# ── Purchase order ─────────────────────────────────────────────────────────────

class IssuePORequest(BaseModel):
    notes: Optional[str] = None
    vendor_id: Optional[str] = None   # override request's vendor if needed


class POStatusUpdate(BaseModel):
    status: str   # delivered | cancelled

    @field_validator("status")
    @classmethod
    def valid_status(cls, v: str) -> str:
        if v not in ("delivered", "cancelled"):
            raise ValueError("status must be 'delivered' or 'cancelled'")
        return v


class PurchaseOrderResponse(BaseModel):
    id: str
    po_number: str
    procurement_request_id: str
    total_amount: Decimal
    currency: str
    issued_at: datetime
    status: str
    notes: Optional[str]
    document_id: Optional[int]

    vendor: Optional[VendorInProcurement]
    issuer: Optional[EmployeeInProcurement]

    class Config:
        from_attributes = True


# resolve forward reference
ProcurementResponse.model_rebuild()
