from __future__ import annotations
from pydantic import BaseModel, field_validator
from typing import Optional, List
from decimal import Decimal
from datetime import datetime, date
from app.payments.enums import PaymentStatus


class InvoiceCreate(BaseModel):
    order_id:     str
    invoice_date: date
    due_date:     date
    notes:        Optional[str] = None

    @field_validator("due_date")
    @classmethod
    def due_after_issued(cls, v: date, info) -> date:
        issued = info.data.get("invoice_date")
        if issued and v < issued:
            raise ValueError("Due date must be on or after invoice date")
        return v


class InvoiceResponse(BaseModel):
    id:           str
    invoice_no:   Optional[str]
    order_id:     str
    order_no:     Optional[str]   # denormalised
    total_amount: Decimal
    status:       PaymentStatus
    issued_date:  date
    due_date:     date
    notes:        Optional[str]
    created_by:   str
    created_at:   datetime
    updated_at:   datetime

    class Config:
        from_attributes = True


class InvoiceListResponse(BaseModel):
    items:     List[InvoiceResponse]
    total:     int
    page:      int
    page_size: int
    has_next:  bool


class InvoiceFilters(BaseModel):
    order_id: Optional[str] = None
    status:   Optional[PaymentStatus] = None
    page:     int = 1
    page_size: int = 50