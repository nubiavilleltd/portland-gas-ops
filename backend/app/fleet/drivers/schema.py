from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel

from app.fleet.drivers.enums import DriverStatus


class DriverCreate(BaseModel):
    employee_id: str
    license_number: str
    license_expiry_date: date
    experience_years: int = 0
    address: Optional[str] = None


class DriverUpdate(BaseModel):
    license_number: Optional[str] = None
    license_expiry_date: Optional[date] = None
    experience_years: Optional[int] = None
    address: Optional[str] = None
    status: Optional[DriverStatus] = None


class DriverResponse(BaseModel):
    id: int
    employee_id: str

    full_name: str
    email: str
    phone_number: str

    license_number: str
    license_expiry_date: date
    experience_years: int

    address: Optional[str]

    profile_image_url: Optional[str]

    status: DriverStatus
    current_trip_id: Optional[int]

    created_at: datetime

    class Config:
        from_attributes = True


class DriverListResponse(BaseModel):
    items: list[DriverResponse]
    total: int
    page: int
    page_size: int
    has_next: bool