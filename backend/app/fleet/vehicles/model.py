from __future__ import annotations
import uuid

from app.fleet.trips.enums import TripStatus
from sqlalchemy import (
    Column,
    Date,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    Numeric,
    String,
)
from sqlalchemy.sql import func
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.fleet.vehicles.enums import VehicleStatus, VehicleType


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    vehicle_no = Column(String(50), unique=True, nullable=False)
    plate_number = Column(String(50), unique=True, nullable=False)

    name = Column(String(255), nullable=False)

    vehicle_type = Column(
        SAEnum(VehicleType),
        nullable=False,
    )

    make = Column(String(100), nullable=True)
    model = Column(String(100), nullable=True)
    year = Column(Integer, nullable=True)

    capacity = Column(Numeric(10, 2), nullable=True)

    fuel_type = Column(String(50), nullable=False)

    primary_image_document_id = Column(
        Integer,
        ForeignKey("documents.id", ondelete="SET NULL"),
        nullable=True,
    )

    mileage = Column(Integer, nullable=True)

    status = Column(
        SAEnum(VehicleStatus),
        nullable=False,
        default=VehicleStatus.available,
    )

    last_service_date = Column(Date, nullable=True)
    next_service_date = Column(Date, nullable=True)

    insurance_expiry_date = Column(Date, nullable=True)
    roadworthiness_expiry_date = Column(Date, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    primary_image = relationship(
        "Document",
        foreign_keys=[primary_image_document_id],
    )

    trips = relationship(
        "Trip",
        back_populates="vehicle",
    )

    @property
    def primary_image_url(self) -> str | None:
        return self.primary_image.file_path if self.primary_image else None
    @property
    def current_trip_id(self) -> str | None:
        for trip in self.trips:
            if trip.status not in (TripStatus.completed, TripStatus.cancelled):
                return trip.id
        return None