from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal

from app.shared.utils.helpers import sanitize_str


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
    contact_person: Optional[str]
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
    unit: Optional[str] = None
    unit_price: Optional[Decimal] = Field(None, ge=0)
    total_price: Optional[Decimal] = Field(None, ge=0)

    @field_validator("description")
    @classmethod
    def strip_description(cls, v: str) -> str:
        return sanitize_str(v)


class ProcurementItemResponse(BaseModel):
    id: str
    description: str
    quantity: int
    unit: Optional[str]
    unit_price: Optional[Decimal]
    total_price: Optional[Decimal]

    class Config:
        from_attributes = True


# ── Attachment ────────────────────────────────────────────────────────────────

class AttachmentResponse(BaseModel):
    id: int
    name: str
    file_path: str
    mime_type: Optional[str]
    file_size: Optional[int]

    class Config:
        from_attributes = True


# ── Procurement request ────────────────────────────────────────────────────────

class ProcurementCreate(BaseModel):
    category: Optional[str] = None
    description: Optional[str] = Field(None, max_length=2000)
    estimated_amount: Optional[Decimal] = Field(None, ge=0)
    currency: str = "NGN"
    required_by: Optional[str] = None
    vendor_id: str = Field(..., min_length=1, description="Vendor is required")
    items: List[ProcurementItemCreate] = Field(..., min_length=1)
    # {step_number: employee_id} — required for requester_pick steps
    picked_approvers: dict[int, str] = Field(default_factory=dict)

    @field_validator("description")
    @classmethod
    def sanitize_text(cls, v: Optional[str]) -> Optional[str]:
        return sanitize_str(v) if v else v

    @field_validator("vendor_id")
    @classmethod
    def validate_vendor_id(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("A vendor must be selected or created before submitting a request")
        return v


class ProcurementUpdate(BaseModel):
    category: Optional[str] = None
    description: Optional[str] = None
    estimated_amount: Optional[Decimal] = Field(None, ge=0)
    required_by: Optional[str] = None
    vendor_id: Optional[str] = None
    items: Optional[List[ProcurementItemCreate]] = None

    @field_validator("description")
    @classmethod
    def sanitize_text(cls, v: Optional[str]) -> Optional[str]:
        return sanitize_str(v) if v else v


class ActionRequest(BaseModel):
    """Body for approve / reject / return actions."""
    comment: Optional[str] = None


class ProcurementResponse(BaseModel):
    id: str
    reference: str
    category: Optional[str]
    description: Optional[str]
    estimated_amount: Optional[Decimal]
    currency: str
    status: str
    raised_by: str
    required_by: Optional[date]
    vendor_id: Optional[str]
    attachment_id: Optional[int] = None
    attachment: Optional[AttachmentResponse] = None
    created_at: datetime
    updated_at: Optional[datetime]

    raiser: Optional[EmployeeInProcurement]
    vendor: Optional[VendorInProcurement]
    items: List[ProcurementItemResponse] = []
    purchase_orders: List["PurchaseOrderResponse"] = []

    # Workflow — who holds the ball right now
    next_actor_name: Optional[str] = None
    current_step_name: Optional[str] = None

    class Config:
        from_attributes = True


class ProcurementListItem(BaseModel):
    id: str
    reference: str
    category: Optional[str]
    status: str
    estimated_amount: Optional[Decimal]
    currency: str
    raised_by: str
    required_by: Optional[date]
    vendor_id: Optional[str]
    attachment_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime]

    raiser: Optional[EmployeeInProcurement]
    vendor: Optional[VendorInProcurement]

    # Workflow — who holds the ball right now (only populated for pending rows)
    next_actor_name: Optional[str] = None
    current_step_name: Optional[str] = None

    # PO info — po_number is set whenever a PO exists; po_document_url only when the PDF is ready
    po_number: Optional[str] = None
    po_document_url: Optional[str] = None

    class Config:
        from_attributes = True


# ── Purchase order ─────────────────────────────────────────────────────────────

class DocumentInPO(BaseModel):
    id: int
    file_path: Optional[str]
    name: str

    class Config:
        from_attributes = True

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
    document: Optional[DocumentInPO] = None

    class Config:
        from_attributes = True


# resolve forward reference
ProcurementResponse.model_rebuild()
