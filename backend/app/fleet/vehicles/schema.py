from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


from app.fleet.vehicles.enums import VehicleStatus, VehicleType


class VehicleCreate(BaseModel):
    name: str
    plate_number: str
    vehicle_type: VehicleType

    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None

    capacity: Optional[Decimal] = None

    fuel_type: str

    mileage: Optional[int] = None

    last_service_date: Optional[date] = None
    next_service_date: Optional[date] = None
    insurance_expiry_date: Optional[date] = None
    roadworthiness_expiry_date: Optional[date] = None


class VehicleUpdate(BaseModel):
    name: Optional[str] = None
    plate_number: Optional[str] = None
    vehicle_type: Optional[VehicleType] = None

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
    roadworthiness_expiry_date: Optional[date] = None



class VehicleResponse(BaseModel):
    id: str

    vehicle_no: Optional[str]

    plate_number: str

    name: str

    type: VehicleType = Field(validation_alias="vehicle_type", serialization_alias="type")

    make: Optional[str]
    model: Optional[str]
    year: Optional[int]

    capacity: Optional[Decimal]

    fuel_type: str

    primary_image_url: Optional[str]

    mileage: Optional[int]

    status: VehicleStatus

    current_trip_id: Optional[str]

    last_service_date: Optional[date]
    next_service_date: Optional[date]
    insurance_expiry_date: Optional[date]
    roadworthiness_expiry_date: Optional[date]

    created_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class VehicleListResponse(BaseModel):
    items: list[VehicleResponse]
    total: int
    page: int
    page_size: int
    has_next: bool