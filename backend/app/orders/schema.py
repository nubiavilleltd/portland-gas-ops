from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator

from app.inventory.enums import DispositionStatus
from app.orders.enums import FulfillmentStatus, OrderStatus
from app.orders.validators import (
    validate_delivery_address,
    validate_order_items,
    validate_quantity,
)
from app.payments.enums import PaymentStatus


# ── Request Schemas ───────────────────────────────────────────────────────────

class OrderItemCreate(BaseModel):
    product_id: str
    quantity: Decimal

    @field_validator("quantity")
    @classmethod
    def quantity_validator(cls, value: Decimal) -> Decimal:
        return validate_quantity(value)

class OrderCreate(BaseModel):
    customer_id: str
    order_items: List[OrderItemCreate]
    delivery_address: str
    delivery_date: Optional[date] = None
    notes: Optional[str] = None

    @field_validator("order_items")
    @classmethod
    def order_items_validator(
        cls,
        value: List[OrderItemCreate],
    ) -> List[OrderItemCreate]:
        return validate_order_items(value)

    @field_validator("delivery_address")
    @classmethod
    def delivery_address_validator(cls, value: str) -> str:
        return validate_delivery_address(value)


class OrderUpdate(BaseModel):
    customer_id: Optional[str] = None
    order_items: Optional[List[OrderItemCreate]] = None
    delivery_address: Optional[str] = None
    delivery_date: Optional[date] = None
    notes: Optional[str] = None

    @field_validator("order_items")
    @classmethod
    def order_items_validator(
        cls,
        value: Optional[List[OrderItemCreate]],
    ) -> Optional[List[OrderItemCreate]]:
        return validate_order_items(value, required=False)

    @field_validator("delivery_address")
    @classmethod
    def delivery_address_validator(
        cls,
        value: Optional[str],
    ) -> Optional[str]:
        return validate_delivery_address(value, required=False)


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


# ── Response Schemas ──────────────────────────────────────────────────────────

class OrderItemResponse(BaseModel):
    id: int
    product_id: str
    product_name: str          # snapshot
    quantity: Decimal
    unit_price: Decimal        # snapshot
    total: Decimal
    disposition: Optional[DispositionStatus]

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: str
    order_no: Optional[str]

    customer_id: str
    customer_name: str         # snapshot stored on Order

    order_status: OrderStatus
    fulfillment_status: FulfillmentStatus
    payment_status: PaymentStatus

    delivery_address: str
    delivery_date: Optional[date]
    notes: Optional[str]

    total_amount: Decimal
    order_items: List[OrderItemResponse] = Field(default_factory=list)

    cancellation_reason: Optional[str]
    cancelled_at: Optional[datetime]

    trip_id: Optional[str]
    invoice_id: Optional[str]

    confirmed_by: Optional[str]
    confirmed_at: Optional[datetime]
    delivered_at: Optional[datetime]

    created_by: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OrderFilters(BaseModel):
    search: Optional[str] = None
    order_status: Optional[OrderStatus] = None
    fulfillment_status: Optional[FulfillmentStatus] = None
    payment_status: Optional[PaymentStatus] = None
    customer_id: Optional[str] = None

    page: int = 1
    page_size: int = 50


class OrderListResponse(BaseModel):
    items: List[OrderResponse]
    total: int
    page: int
    page_size: int
    has_next: bool