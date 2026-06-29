from __future__ import annotations
from pydantic import BaseModel, field_validator, model_validator
from typing import Optional, List
from decimal import Decimal
from datetime import datetime, date
from app.orders.enums import OrderStatus, FulfillmentStatus, DispositionStatus
from app.payments.enums import PaymentStatus


class OrderItemCreate(BaseModel):
    product_id:   str
    product_name: str
    quantity:     Decimal
    unit_price:   Decimal
    total:        Decimal

    @field_validator("quantity")
    @classmethod
    def qty_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Quantity must be greater than zero")
        return v

    @field_validator("unit_price")
    @classmethod
    def price_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Unit price must be greater than zero")
        return v


class OrderCreate(BaseModel):
    customer_id:      str
    order_items:      List[OrderItemCreate]
    delivery_address: str
    delivery_date:    Optional[date] = None
    notes:            Optional[str]  = None

    @field_validator("order_items")
    @classmethod
    def items_not_empty(cls, v: List[OrderItemCreate]) -> List[OrderItemCreate]:
        if not v:
            raise ValueError("Order must have at least one item")
        return v

    @field_validator("delivery_address")
    @classmethod
    def address_not_empty(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Delivery address cannot be empty")
        return cleaned


class OrderUpdate(BaseModel):
    customer_id:      Optional[str]              = None
    order_items:      Optional[List[OrderItemCreate]] = None
    delivery_address: Optional[str]              = None
    delivery_date:    Optional[date]             = None
    notes:            Optional[str]              = None


class CancelOrderRequest(BaseModel):
    reason: Optional[str] = None


class UpdateFulfillmentRequest(BaseModel):
    fulfillment_status: FulfillmentStatus


class UpdatePaymentStatusRequest(BaseModel):
    payment_status: PaymentStatus


class SetTripRequest(BaseModel):
    trip_id: Optional[str] = None


class SetInvoiceRequest(BaseModel):
    invoice_id: str


# ── Response schemas ──────────────────────────────────────────────────────────

class OrderItemResponse(BaseModel):
    id:           int
    product_id:   str
    product_name: str
    quantity:     Decimal
    unit_price:   Decimal
    total:        Decimal
    disposition:  Optional[DispositionStatus]

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id:                  str
    order_no:            Optional[str]
    customer_id:         str
    customer_name: str = ""         # denormalised from customer join
    order_status:        OrderStatus
    fulfillment_status:  FulfillmentStatus
    payment_status:      PaymentStatus
    delivery_address:    str
    delivery_date:       Optional[date]
    notes:               Optional[str]
    total_amount:        Decimal
    order_items:         List[OrderItemResponse] = []
    cancellation_reason: Optional[str]
    cancelled_at:        Optional[datetime]
    trip_id:             Optional[str]
    invoice_id:          Optional[str]
    confirmed_by:        Optional[str]
    confirmed_at:        Optional[datetime]
    delivered_at:        Optional[datetime]
    created_by:          str
    created_at:          datetime
    updated_at:          datetime

    class Config:
        from_attributes = True


class OrderFilters(BaseModel):
    search:             Optional[str]              = None
    order_status:       Optional[OrderStatus]      = None
    fulfillment_status: Optional[FulfillmentStatus] = None
    payment_status:     Optional[PaymentStatus]    = None
    customer_id:        Optional[str]              = None
    page:               int = 1
    page_size:          int = 50


class OrderListResponse(BaseModel):
    items:     List[OrderResponse]
    total:     int
    page:      int
    page_size: int
    has_next:  bool