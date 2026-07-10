from __future__ import annotations

from datetime import datetime, date
from typing import Optional

from pydantic import BaseModel

from app.fleet.trips.enums import TripType, TripStatus


class TripCreate(BaseModel):
    type: TripType = TripType.order_delivery

    order_ids: list[str] = []

    start_location: str
    end_location: str

    scheduled_date: date

    notes: Optional[str] = None


class TripAssignResources(BaseModel):
    driver_id: int
    vehicle_id: int


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
    id: int

    trip_no: Optional[str]

    type: TripType

    driver_id: Optional[int]
    driver_name: Optional[str]

    vehicle_id: Optional[int]
    vehicle_name: Optional[str]

    orders: list[TripOrderResponse] = []

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

    class Config:
        from_attributes = True


class TripListResponse(BaseModel):
    items: list[TripResponse]
    total: int
    page: int
    page_size: int
    has_next: bool