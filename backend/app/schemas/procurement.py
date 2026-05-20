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
from app.models.procurement import (
    ProcurementStatus,
    ProcurementCategory,
    ProcurementPriority,
    ItemUnit,
)
from app.schemas.vendor import VendorResponse


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


class ProcurementItemResponse(BaseModel):
    id: str
    description: str
    quantity: Decimal
    unit: ItemUnit
    unit_cost: Decimal
    total_cost: Decimal
    created_at: datetime

    class Config:
        from_attributes = True


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


class ProcurementResponse(BaseModel):
    id: str
    reference: str
    title: str
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

    class Config:
        from_attributes = True


class ProcurementListItem(BaseModel):
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
