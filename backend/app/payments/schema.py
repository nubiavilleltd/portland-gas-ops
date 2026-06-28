from __future__ import annotations
from pydantic import BaseModel, field_validator
from typing import Optional, List
from decimal import Decimal
from datetime import datetime, date
from app.payments.enums import PaymentMethod, PaymentStatus


class PaymentCreate(BaseModel):
    invoice_id:      str
    amount:          Decimal
    method:          PaymentMethod
    payment_date:    date
    reference:       Optional[str] = None

    @field_validator("amount")
    @classmethod
    def amount_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Payment amount must be greater than zero")
        return v


class PaymentResponse(BaseModel):
    id:           str
    payment_no:   Optional[str]
    invoice_id:   str
    invoice_no:   Optional[str]   # denormalised
    amount:       Decimal
    method:       PaymentMethod
    payment_date: date
    reference:    Optional[str]
    recorded_by:  str
    created_at:   datetime

    class Config:
        from_attributes = True


class PaymentListResponse(BaseModel):
    items:     List[PaymentResponse]
    total:     int
    page:      int
    page_size: int
    has_next:  bool