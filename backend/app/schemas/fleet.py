from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.fleet import VehicleStatus, VehicleType, MaintenanceStatus


class FleetVehicleCreate(BaseModel):
    plate_number: str
    make: str
    model: str
    year: int
    vehicle_type: VehicleType
    mileage: int = 0
    driver_id: Optional[str] = None
    notes: Optional[str] = None


class FleetVehicleUpdate(BaseModel):
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    vehicle_type: Optional[VehicleType] = None
    status: Optional[VehicleStatus] = None
    mileage: Optional[int] = None
    driver_id: Optional[str] = None
    notes: Optional[str] = None


class FleetVehicleResponse(BaseModel):
    id: str
    plate_number: str
    make: str
    model: str
    year: int
    vehicle_type: VehicleType
    status: VehicleStatus
    mileage: int
    driver_id: Optional[str]
    notes: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class MaintenanceCreate(BaseModel):
    vehicle_id: str
    description: str
    scheduled_date: Optional[datetime] = None


class MaintenanceUpdate(BaseModel):
    description: Optional[str] = None
    status: Optional[MaintenanceStatus] = None
    scheduled_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None


class MaintenanceResponse(BaseModel):
    id: str
    reference: str
    vehicle_id: str
    description: str
    status: MaintenanceStatus
    scheduled_date: Optional[datetime]
    completed_date: Optional[datetime]
    created_by: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
