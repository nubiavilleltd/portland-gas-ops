from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict

from app.payments.enums import PaymentMethod
from pydantic import BaseModel, ConfigDict, Field


class PaymentCreate(BaseModel):
    invoice_id: str
    amount: Decimal
    method: PaymentMethod
    payment_date: date
    reference: Optional[str] = None
    notes: Optional[str] = None
    idempotency_key: Optional[str] = None

class PaymentAttachmentResponse(BaseModel):
    id: str
    url: str
    name: str

    model_config = ConfigDict(from_attributes=True)


class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    payment_no: Optional[str]

    invoice_id: str
    invoice_no: str

    customer_id: Optional[str] = None
    customer_name: Optional[str] = None

    amount: Decimal
    currency: str

    method: PaymentMethod
    payment_date: date

    reference: Optional[str]
    notes: Optional[str]

    recorded_by: str

    attachments: list[PaymentAttachmentResponse] = Field(
        default_factory=list
    )

    created_at: datetime
    updated_at: datetime


class PaymentListResponse(BaseModel):
    items: List[PaymentResponse]
    total: int
    page: int
    page_size: int
    has_next: bool


class PaymentFilters(BaseModel):
    invoice_id: Optional[str] = None
    customer_id: Optional[str] = None
    method: Optional[PaymentMethod] = None
    page: int = 1
    page_size: int = 50