
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, field_validator

from app.inventory.enums import (
    DispositionStatus,
    InventoryItemCondition,
    InventoryItemStatus,
    MovementType,
    ReferenceType,
)
from app.inventory.validators import (
    validate_positive_decimal,
    validate_positive_integer,
)


# ============================================================================
# Warehouse Locations
# ============================================================================

class CreateLocationInput(BaseModel):
    name: str
    address: str | None = None
    is_default: bool = False

class LocationResponse(BaseModel):
    id: str
    name: str
    address: Optional[str]
    is_default: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Check In
# ============================================================================

class CheckInTrackedInput(BaseModel):
    product_id: str
    location_id: str
    quantity: int
    condition: InventoryItemCondition = InventoryItemCondition.new
    notes: Optional[str] = None

    @field_validator("quantity")
    @classmethod
    def validate_quantity(cls, value: int) -> int:
        return validate_positive_integer(value)


class CheckInConsumableInput(BaseModel):
    product_id: str
    location_id: str
    quantity: Decimal
    notes: Optional[str] = None

    @field_validator("quantity")
    @classmethod
    def validate_quantity(cls, value: Decimal) -> Decimal:
        return validate_positive_decimal(value)


# ============================================================================
# Returns
# ============================================================================

class ReturnItemInput(BaseModel):
    condition: InventoryItemCondition
    notes: Optional[str] = None


# ============================================================================
# Inventory Item
# ============================================================================

class InventoryItemResponse(BaseModel):
    id: str

    product_id: str
    product_name: Optional[str] = None
    product_code: Optional[str] = None

    tag_number: Optional[str] = None
    serial_number: Optional[str] = None

    status: InventoryItemStatus
    condition: InventoryItemCondition
    disposition: Optional[DispositionStatus]

    location_id: str
    location_name: Optional[str] = None

    order_id: Optional[str] = None
    order_no: Optional[str] = None

    trip_id: Optional[str] = None
    trip_no: Optional[str] = None

    customer_id: Optional[str] = None
    customer_name: Optional[str] = None

    checked_out_at: Optional[datetime]
    expected_return_date: Optional[date]

    received_into_inventory_at: date

    notes: Optional[str]

    class Config:
        from_attributes = True


class InventoryItemListResponse(BaseModel):
    items: List[InventoryItemResponse]
    total: int
    page: int
    page_size: int
    has_next: bool


# ============================================================================
# Consumable Stock
# ============================================================================

class ConsumableStockResponse(BaseModel):
    id: str

    product_id: str
    product_name: Optional[str] = None
    product_code: Optional[str] = None

    location_id: str
    location_name: Optional[str] = None

    quantity: Decimal
    updated_at: datetime

    class Config:
        from_attributes = True


class ConsumableStockListResponse(BaseModel):
    items: List[ConsumableStockResponse]
    total: int


# ============================================================================
# Consumable Stock Detail
# ============================================================================

class ConsumableStockDetailResponse(BaseModel):
    id: str

    product_id: str
    product_name: Optional[str] = None
    product_code: Optional[str] = None

    location_id: str
    location_name: Optional[str] = None

    quantity: Decimal

    updated_at: datetime

    movements: List[StockMovementResponse] = []

    class Config:
        from_attributes = True


# ============================================================================
# Stock Movements
# ============================================================================

class StockMovementResponse(BaseModel):
    id: str

    product_id: str
    product_name: Optional[str] = None

    movement_type: MovementType

    quantity: Decimal

    reference_id: Optional[str]
    reference_type: Optional[ReferenceType]

    location_id: str
    location_name: Optional[str] = None

    recorded_by: str
    recorded_by_name: Optional[str] = None

    item_ids: List[str] = []

    notes: Optional[str]

    created_at: datetime

    class Config:
        from_attributes = True


class StockMovementListResponse(BaseModel):
    items: List[StockMovementResponse]
    total: int
    page: int
    page_size: int
    has_next: bool


# ============================================================================
# Inventory Dashboard
# ============================================================================

class InventoryKPIResponse(BaseModel):
    total_tracked_items: int
    available_items: int
    reserved_items: int
    checked_out_items: int
    with_customer_items: int
    maintenance_items: int

