from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional, Any

from pydantic import BaseModel, Field, field_validator, model_validator

from app.inventory.enums import DispositionStatus
from app.orders.enums import FulfillmentStatus, OrderStatus
from app.orders.validators import (
    validate_delivery_address,
    validate_order_items,
    validate_quantity,
    validate_discount,
    validate_discount_value,
    validate_customer_id
)
from app.payments.enums import PaymentStatus
from app.orders.enums import DiscountType


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
    discount_type: DiscountType = DiscountType.none
    discount_value: Decimal = Decimal("0")
    delivery_address: str
    delivery_date: Optional[date] = None
    notes: Optional[str] = None


    @field_validator("customer_id")
    @classmethod
    def customer_id_validator(cls, value: str) -> str:
        return validate_customer_id(value)

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
    
    @field_validator("discount_value")
    @classmethod
    def discount_value_validator(cls, value: Decimal) -> Decimal:
        return validate_discount_value(value)
    
    @model_validator(mode="after")
    def validate_discount_fields(self):
        self.discount_value = validate_discount(
            self.discount_type,
            self.discount_value,
        )
        return self


class OrderDraftCreate(BaseModel):
    customer_id: str
    order_items: List[OrderItemCreate] = Field(default_factory=list)
    discount_type: DiscountType = DiscountType.none
    discount_value: Decimal = Decimal("0")
    delivery_address: str = ""
    delivery_date: Optional[date] = None
    notes: str = ""

    @field_validator("delivery_date", mode="before")
    @classmethod
    def handle_empty_date(cls, v: Any) -> Any:
        """Convert empty string to None before date validation."""
        if v == "":
            return None
        return v

    @field_validator("customer_id")
    @classmethod
    def customer_id_validator(cls, value: str) -> str:
        return validate_customer_id(value)

    @field_validator("order_items")
    @classmethod
    def order_items_validator(
        cls,
        value: List[OrderItemCreate],
    ) -> List[OrderItemCreate]:
        return value

    @field_validator("delivery_address")
    @classmethod
    def delivery_address_validator(
        cls,
        value: str,
    ) -> str:
        return value

    @field_validator("discount_value")
    @classmethod
    def discount_value_validator(cls, value: Decimal) -> Decimal:
        return validate_discount_value(value, required=False) or Decimal("0")

    @model_validator(mode="after")
    def validate_discount_fields(self):
        self.discount_value = validate_discount(
            self.discount_type,
            self.discount_value,
        )
        return self
class OrderUpdate(BaseModel):
    customer_id: str
    order_items: List[OrderItemCreate] = Field(default_factory=list)
    discount_type: DiscountType = DiscountType.none
    discount_value: Decimal = Decimal("0")
    delivery_address: str = ""
    delivery_date: Optional[date] = None
    notes: str = ""

    @field_validator("delivery_date", mode="before")
    @classmethod
    def handle_empty_date(cls, v: Any) -> Any:
        """Convert empty string to None before date validation."""
        if v == "":
            return None
        return v

    @field_validator("customer_id")
    @classmethod
    def customer_id_validator(cls, value: str) -> str:
        return validate_customer_id(value)

    @field_validator("order_items")
    @classmethod
    def order_items_validator(
        cls,
        value: List[OrderItemCreate],
    ) -> List[OrderItemCreate]:
        return value

    @field_validator("delivery_address")
    @classmethod
    def delivery_address_validator(
        cls,
        value: str,
    ) -> str:
        return value

    @field_validator("discount_value")
    @classmethod
    def discount_value_validator(
        cls,
        value: Decimal,
    ) -> Decimal:
        return validate_discount_value(value, required=False) or Decimal("0")

    @model_validator(mode="after")
    def validate_discount_fields(self):
        self.discount_value = validate_discount(
            self.discount_type,
            self.discount_value,
        )
        return self

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

    delivery_address: Optional[str]
    delivery_date: Optional[date]
    notes: Optional[str]

    total_amount: Decimal
    discount_type: DiscountType
    discount_value: Decimal
    discount_amount: Decimal
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