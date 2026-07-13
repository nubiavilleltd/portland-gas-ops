from __future__ import annotations

from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

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
    id: str
    employee_id: str

    full_name: Optional[str]
    email: Optional[str]
    phone_number: Optional[str]

    license_number: str
    license_expiry_date: date
    experience_years: int

    address: Optional[str]

    profile_image_url: Optional[str]

    status: DriverStatus
    current_trip_id: Optional[str]

    created_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class DriverListResponse(BaseModel):
    items: list[DriverResponse]
    total: int
    page: int
    page_size: int
    has_next: bool