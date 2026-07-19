from __future__ import annotations

from datetime import datetime, date
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


from app.fleet.trips.enums import TripType, TripStatus
from app.inventory.enums import DispositionStatus


class TripCreate(BaseModel):
    type: TripType = TripType.order_delivery

    order_ids: list[str] = []

    start_location: str
    end_location: str

    scheduled_date: date

    notes: Optional[str] = None


class TripAssignResources(BaseModel):
    driver_id: str
    vehicle_id: str

# class TripInventoryAssignment(BaseModel):
#     order_id: str
#     product_id: str
#     item_ids: list[str] = Field(min_length=1)
#     disposition: DispositionStatus


class TripInventoryAssignment(BaseModel):
    order_id: str
    product_id: str

    # tracked products
    item_ids: list[str] = Field(default_factory=list)

    # consumables
    location_id: str | None = None

    # Business disposition for tracked inventory
    disposition: DispositionStatus | None = None


class TripMarkReady(BaseModel):
    assignments: list[TripInventoryAssignment] = Field(default_factory=list)


class TripCancel(BaseModel):
    reason: Optional[str] = None


class TripComplete(BaseModel):
    proof_notes: Optional[str] = None


class TripAddOrder(BaseModel):
    order_id: str


class TripOrderResponse(BaseModel):
    order_id: str
    order_no: Optional[str]

    class Config:
        from_attributes = True

class TripResponse(BaseModel):
    id: str

    trip_no: Optional[str]

    type: TripType = Field(validation_alias="trip_type", serialization_alias="type")

    driver_id: Optional[str]
    driver_name: Optional[str]

    vehicle_id: Optional[str]
    vehicle_name: Optional[str]

    orders: list[TripOrderResponse] = Field(default=[], validation_alias="trip_orders")

    start_location: str
    end_location: str

    scheduled_date: date

    dispatch_date: Optional[datetime]

    started_at: Optional[datetime]
    completed_at: Optional[datetime]

    status: TripStatus

    notes: Optional[str]

    cancellation_reason: Optional[str]
    cancelled_at: Optional[datetime]

    created_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class TripListResponse(BaseModel):
    items: list[TripResponse]
    total: int
    page: int
    page_size: int
    has_next: bool