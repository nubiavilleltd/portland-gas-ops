from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel

from app.fleet.vehicles.enums import VehicleStatus, VehicleType


class VehicleCreate(BaseModel):
    name: str
    plate_number: str
    type: VehicleType

    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None

    capacity: Optional[Decimal] = None

    fuel_type: str

    mileage: Optional[int] = None

    last_service_date: Optional[date] = None
    next_service_date: Optional[date] = None
    insurance_expiry_date: Optional[date] = None


class VehicleUpdate(BaseModel):
    name: Optional[str] = None
    plate_number: Optional[str] = None
    type: Optional[VehicleType] = None

    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None

    capacity: Optional[Decimal] = None

    fuel_type: Optional[str] = None

    mileage: Optional[int] = None

    status: Optional[VehicleStatus] = None

    last_service_date: Optional[date] = None
    next_service_date: Optional[date] = None
    insurance_expiry_date: Optional[date] = None


class VehicleResponse(BaseModel):
    id: int

    vehicle_no: Optional[str]

    plate_number: str

    name: str

    type: VehicleType

    make: Optional[str]
    model: Optional[str]
    year: Optional[int]

    capacity: Optional[Decimal]

    fuel_type: str

    primary_image_url: Optional[str]

    mileage: Optional[int]

    status: VehicleStatus

    current_trip_id: Optional[int]

    last_service_date: Optional[date]
    next_service_date: Optional[date]
    insurance_expiry_date: Optional[date]

    created_at: datetime

    class Config:
        from_attributes = True


class VehicleListResponse(BaseModel):
    items: list[VehicleResponse]
    total: int
    page: int
    page_size: int
    has_next: bool