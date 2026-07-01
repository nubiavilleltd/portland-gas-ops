from __future__ import annotations
from pydantic import BaseModel, field_validator
from typing import Optional, List
from decimal import Decimal
from datetime import datetime, date
from app.inventory.enums import (
    InventoryItemStatus, InventoryItemCondition, DispositionStatus,
    MovementType, ReferenceType,
)


# ── Warehouse Locations ───────────────────────────────────────────────────────

class LocationResponse(BaseModel):
    id:         int
    name:       str
    address:    Optional[str]
    is_default: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ── Check-in inputs ───────────────────────────────────────────────────────────

class CheckInTrackedInput(BaseModel):
    product_id:  str
    location_id: int
    quantity:    int
    condition:   InventoryItemCondition = InventoryItemCondition.new
    notes:       Optional[str] = None

    @field_validator("quantity")
    @classmethod
    def qty_positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Quantity must be at least 1")
        return v


class CheckInConsumableInput(BaseModel):
    product_id:  str
    location_id: int
    quantity:    Decimal
    notes:       Optional[str] = None

    @field_validator("quantity")
    @classmethod
    def qty_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Quantity must be greater than zero")
        return v


# ── Return input ──────────────────────────────────────────────────────────────

class ReturnItemInput(BaseModel):
    condition: InventoryItemCondition
    notes:     Optional[str] = None


# ── Responses ─────────────────────────────────────────────────────────────────

class InventoryItemResponse(BaseModel):
    id:                   int
    product_id:           str
    tag_number:           str
    serial_number:        Optional[str]
    status:               InventoryItemStatus
    condition:            InventoryItemCondition
    disposition:          Optional[DispositionStatus]
    location_id:          int
    order_id:             Optional[str]
    customer_id:          Optional[str]
    checked_out_at:       Optional[datetime]
    expected_return_date: Optional[date]
    received_at:          date
    notes:                Optional[str]

    class Config:
        from_attributes = True


class ConsumableStockResponse(BaseModel):
    id:         int
    product_id: str
    location_id: int
    quantity:   Decimal
    updated_at: datetime

    class Config:
        from_attributes = True


class StockMovementResponse(BaseModel):
    id:             int
    product_id:     str
    movement_type:  MovementType
    quantity:       Decimal
    reference_id:   Optional[str]
    reference_type: Optional[ReferenceType]
    location_id:    int
    notes:          Optional[str]
    recorded_by:    str
    item_ids:       List[int] = []
    created_at:     datetime

    class Config:
        from_attributes = True


class InventoryKPIResponse(BaseModel):
    total_tracked_items:  int
    available_items:      int
    reserved_items:       int
    checked_out_items:    int
    with_customer_items:  int
    maintenance_items:    int