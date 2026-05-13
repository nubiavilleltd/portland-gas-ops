from sqlalchemy import Column, String, Boolean, DateTime, Enum as SAEnum, ForeignKey, Integer, Text
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.sql import func
import uuid
import enum
from app.database import Base


class VehicleStatus(str, enum.Enum):
    available = "available"
    in_use = "in_use"
    maintenance = "maintenance"
    retired = "retired"


class VehicleType(str, enum.Enum):
    cng_truck = "cng_truck"
    lng_tanker = "lng_tanker"
    service_van = "service_van"
    pickup = "pickup"
    bus = "bus"


class FleetVehicle(Base):
    __tablename__ = "fleet_vehicles"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    plate_number = Column(String(20), unique=True, nullable=False, index=True)
    make = Column(String(100), nullable=False)
    model = Column(String(100), nullable=False)
    year = Column(Integer, nullable=False)
    vehicle_type = Column(SAEnum(VehicleType), nullable=False)
    status = Column(SAEnum(VehicleStatus), nullable=False, default=VehicleStatus.available)
    mileage = Column(Integer, default=0)
    driver_id = Column(CHAR(36), ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class MaintenanceStatus(str, enum.Enum):
    scheduled = "scheduled"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"


class MaintenanceRequest(Base):
    __tablename__ = "maintenance_requests"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    reference = Column(String(50), unique=True, nullable=False, index=True)
    vehicle_id = Column(CHAR(36), ForeignKey("fleet_vehicles.id"), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(SAEnum(MaintenanceStatus), nullable=False, default=MaintenanceStatus.scheduled)
    scheduled_date = Column(DateTime(timezone=True), nullable=True)
    completed_date = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(CHAR(36), ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
