from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.invoices.validators import validate_due_date
from app.payments.enums import PaymentStatus


class InvoiceCreate(BaseModel):
    order_id: str
    issued_date: date
    due_date: date
    notes: Optional[str] = None

    @field_validator("due_date")
    @classmethod
    def validate_due(cls, due_date: date, info) -> date:
        issued_date = info.data.get("issued_date")
        if issued_date:
            return validate_due_date(issued_date, due_date)
        return due_date


class InvoiceResponse(BaseModel):
    id: str
    invoice_no: Optional[str]

    order_id: str
    order_no: Optional[str]

    total_amount: Decimal
    status: PaymentStatus

    issued_date: date
    due_date: date

    notes: Optional[str]

    created_by: str
    created_by_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InvoiceFilters(BaseModel):
    order_id: Optional[str] = None
    status: Optional[PaymentStatus] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=50, ge=1, le=200)


class InvoiceListResponse(BaseModel):
    items: list[InvoiceResponse]
    total: int
    page: int
    page_size: int
    has_next: bool