<<<<<<< HEAD
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

=======
"""
Pydantic schemas for the Procurement resource.

Why separate schemas?
  - ProcurementItemCreate  → one line item when creating a request
  - ProcurementItemResponse → one line item in a response (includes id)
  - ProcurementCreate      → the full JSON body for creating a request (includes list of items)
  - ProcurementUpdate      → fields staff can edit on a draft request
  - ProcurementStatusUpdate → what procurement managers use to advance status (ordered, delivered)
  - ProcurementResponse    → full detail response (vendor + items embedded)
  - ProcurementListItem    → lighter version for list views (no items, just totals)

Note on file attachments:
  File uploads (the supporting document like a quote PDF) cannot go in a JSON body.
  They are sent as multipart/form-data. The router handles this with FastAPI's File/Form
  parameters — not this schema. The schema only covers the JSON fields.
"""

from pydantic import BaseModel, field_validator, Field
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
from app.procurement.models import (
    ProcurementStatus,
    ProcurementCategory,
    ProcurementPriority,
    ItemUnit,
)
from app.vendors.schemas import VendorResponse


# ── LINE ITEM SCHEMAS ─────────────────────────────────────────────────────────

class ProcurementItemCreate(BaseModel):
    description: str = Field(..., min_length=1, max_length=500)
    quantity: Decimal
    unit: ItemUnit
    unit_cost: Decimal
    total_cost: Decimal

    @field_validator("description")
    @classmethod
    def strip_description(cls, v):
        return v.strip()

    @field_validator("quantity", "unit_cost", "total_cost")
    @classmethod
    def must_be_positive(cls, v):
        if v <= 0:
            raise ValueError("must be greater than zero")
        return v

>>>>>>> c7b4c06 (merging)

class ProcurementItemResponse(BaseModel):
    id: str
    description: str
<<<<<<< HEAD
    quantity: int
    unit_price: Optional[Decimal]
    total_price: Optional[Decimal]
=======
    quantity: Decimal
    unit: ItemUnit
    unit_cost: Decimal
    total_cost: Decimal
    created_at: datetime
>>>>>>> c7b4c06 (merging)

    class Config:
        from_attributes = True


<<<<<<< HEAD
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
=======
# ── PROCUREMENT REQUEST SCHEMAS ───────────────────────────────────────────────

class ProcurementCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    category: ProcurementCategory
    priority: ProcurementPriority = ProcurementPriority.routine
    justification: Optional[str] = Field(None, max_length=2000)
    required_by: Optional[date] = None
    vendor_id: Optional[str] = None
    items: List[ProcurementItemCreate] = Field(..., min_length=1, max_length=50)

    @field_validator("title", "justification")
    @classmethod
    def strip_text(cls, v):
        return v.strip() if v else v

    @field_validator("items")
    @classmethod
    def at_least_one_item(cls, v):
        if len(v) == 0:
            raise ValueError("at least one line item is required")
        return v


class ProcurementUpdate(BaseModel):
    """Staff can edit a draft request before submitting."""
    title: Optional[str] = None
    category: Optional[ProcurementCategory] = None
    priority: Optional[ProcurementPriority] = None
    justification: Optional[str] = None
    required_by: Optional[date] = None
    vendor_id: Optional[str] = None


class ProcurementStatusUpdate(BaseModel):
    """Procurement managers use this to move a request through the workflow."""
    status: ProcurementStatus
>>>>>>> c7b4c06 (merging)


class ProcurementResponse(BaseModel):
    id: str
    reference: str
    title: str
<<<<<<< HEAD
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
=======
    category: ProcurementCategory
    priority: ProcurementPriority
    justification: Optional[str]
    required_by: Optional[date]
    status: ProcurementStatus
    attachment_url: Optional[str]
    attachment_name: Optional[str]
    po_url: Optional[str]
    created_by: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

    # Nested objects — SQLAlchemy will load these via the relationships we defined
    vendor: Optional[VendorResponse] = None
    items: List[ProcurementItemResponse] = []
>>>>>>> c7b4c06 (merging)

    class Config:
        from_attributes = True


class ProcurementListItem(BaseModel):
<<<<<<< HEAD
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
=======
    """Lighter schema used in list endpoints — no items array, just summary fields."""
    id: str
    reference: str
    title: str
    category: ProcurementCategory
    priority: ProcurementPriority
    status: ProcurementStatus
    required_by: Optional[date]
    attachment_url: Optional[str]
    po_url: Optional[str]
    created_by: str
    created_at: datetime
    vendor: Optional[VendorResponse] = None

    class Config:
        from_attributes = True
>>>>>>> c7b4c06 (merging)
