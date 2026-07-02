from __future__ import annotations
from pydantic import BaseModel, field_validator
from typing import Optional, List
from decimal import Decimal
from datetime import datetime, date
from app.fleet.enums import DriverStatus, VehicleStatus, VehicleType, TripType, TripStatus


# ── Drivers ────────────────────────────────────────────────────────────────────

class DriverCreate(BaseModel):
    full_name:           str
    email:                str
    phone_number:        str
    license_number:      str
    license_expiry_date: date
    experience_years:    int = 0
    address:              Optional[str] = None

    @field_validator("license_number")
    @classmethod
    def license_not_empty(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("License number cannot be empty")
        return cleaned


class DriverUpdate(BaseModel):
    full_name:           Optional[str] = None
    phone_number:        Optional[str] = None
    license_number:      Optional[str] = None
    license_expiry_date: Optional[date] = None
    experience_years:    Optional[int] = None
    address:              Optional[str] = None
    status:               Optional[DriverStatus] = None


class DriverResponse(BaseModel):
    id:                     int
    employee_id:            str
    full_name:              str
    email:                  str
    phone_number:           str
    license_number:         str
    license_expiry_date:    date
    experience_years:       int
    profile_image_url:      Optional[str]
    status:                 DriverStatus
    current_trip_id:        Optional[int]
    created_at:              datetime

    class Config:
        from_attributes = True


# ── Vehicles ───────────────────────────────────────────────────────────────────

class VehicleCreate(BaseModel):
    name:          str
    plate_number:  str
    type:          VehicleType
    make:          Optional[str] = None
    model:         Optional[str] = None
    year:          Optional[int] = None
    capacity:      Optional[Decimal] = None
    fuel_type:     str
    mileage:       Optional[int] = None
    last_service_date:           Optional[date] = None
    next_service_date:           Optional[date] = None
    insurance_expiry_date:       Optional[date] = None

    @field_validator("plate_number")
    @classmethod
    def plate_not_empty(cls, v: str) -> str:
        cleaned = v.strip().upper()
        if not cleaned:
            raise ValueError("Plate number cannot be empty")
        return cleaned


class VehicleUpdate(BaseModel):
    name:          Optional[str] = None
    plate_number:  Optional[str] = None
    type:          Optional[VehicleType] = None
    make:          Optional[str] = None
    model:         Optional[str] = None
    year:          Optional[int] = None
    capacity:      Optional[Decimal] = None
    fuel_type:     Optional[str] = None
    mileage:       Optional[int] = None
    status:        Optional[VehicleStatus] = None
    last_service_date:           Optional[date] = None
    next_service_date:           Optional[date] = None
    insurance_expiry_date:       Optional[date] = None


class VehicleResponse(BaseModel):
    id:                int
    vehicle_no:        Optional[str]
    plate_number:      str
    name:              str
    type:              VehicleType
    make:              Optional[str]
    model:             Optional[str]
    year:              Optional[int]
    capacity:          Optional[Decimal]
    fuel_type:         str
    image_url:         Optional[str]
    mileage:           Optional[int]
    status:            VehicleStatus
    current_trip_id:   Optional[int]
    last_service_date: Optional[date]
    next_service_date: Optional[date]
    insurance_expiry_date: Optional[date]
    created_at:        datetime

    class Config:
        from_attributes = True


# ── Trips ──────────────────────────────────────────────────────────────────────

class TripCreate(BaseModel):
    type:            TripType = TripType.order_delivery
    order_ids:       List[str] = []        # order UUIDs
    start_location:  str
    end_location:    str
    scheduled_date:  date
    notes:           Optional[str] = None


class AssignResourcesRequest(BaseModel):
    driver_id:  int
    vehicle_id: int


class CancelTripRequest(BaseModel):
    reason: Optional[str] = None


class CompleteTripRequest(BaseModel):
    proof_notes: Optional[str] = None


class AddOrderToTripRequest(BaseModel):
    order_id: str


class TripOrderResponse(BaseModel):
    order_id:     str
    order_no:     Optional[str]

    class Config:
        from_attributes = True


class TripResponse(BaseModel):
    id:                  int
    trip_no:             Optional[str]
    type:                TripType
    driver_id:           Optional[int]
    driver_name:         Optional[str]
    vehicle_id:          Optional[int]
    vehicle_name:        Optional[str]
    order_ids:           List[str] = []
    start_location:      str
    end_location:        str
    scheduled_date:      date
    dispatch_date:       Optional[datetime]
    started_at:          Optional[datetime]
    completed_at:        Optional[datetime]
    status:              TripStatus
    notes:               Optional[str]
    cancellation_reason: Optional[str]
    cancelled_at:        Optional[datetime]
    created_at:          datetime

    class Config:
        from_attributes = True


class TripListResponse(BaseModel):
    items: List[TripResponse]