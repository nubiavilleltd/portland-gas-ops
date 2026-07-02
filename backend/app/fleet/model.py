from __future__ import annotations
from sqlalchemy import Column, String, Text, Numeric, DateTime, Date, Integer, Enum as SAEnum, ForeignKey
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.fleet.enums import DriverStatus, VehicleStatus, VehicleType, TripType, TripStatus


class Driver(Base):
    __tablename__ = "drivers"

    id                     = Column(Integer, primary_key=True, autoincrement=True)
    employee_id            = Column(CHAR(36), ForeignKey("employees.id", ondelete="RESTRICT"), nullable=False, unique=True)
    license_number         = Column(String(100), unique=True, nullable=False)
    license_expiry_date    = Column(Date, nullable=False)
    experience_years       = Column(Integer, nullable=False, default=0)
    profile_image_document_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    status                 = Column(SAEnum(DriverStatus), nullable=False, default=DriverStatus.available)
    current_trip_id        = Column(Integer, ForeignKey("trips.id", ondelete="SET NULL"), nullable=True)
    created_at             = Column(DateTime(timezone=True), server_default=func.now())
    updated_at             = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    employee = relationship("Employee", foreign_keys=[employee_id])


class Vehicle(Base):
    __tablename__ = "vehicles"

    id                          = Column(Integer, primary_key=True, autoincrement=True)
    vehicle_no                  = Column(String(50), unique=True, nullable=True)
    plate_number                = Column(String(50), unique=True, nullable=False)
    name                        = Column(String(255), nullable=False)
    type                        = Column(SAEnum(VehicleType), nullable=False)
    make                        = Column(String(100), nullable=True)
    model                       = Column(String(100), nullable=True)
    year                        = Column(Integer, nullable=True)
    capacity                    = Column(Numeric(10, 2), nullable=True)
    fuel_type                   = Column(String(50), nullable=False)
    primary_image_document_id   = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    mileage                     = Column(Integer, nullable=True)
    status                      = Column(SAEnum(VehicleStatus), nullable=False, default=VehicleStatus.available)
    current_trip_id             = Column(Integer, ForeignKey("trips.id", ondelete="SET NULL"), nullable=True)
    last_service_date           = Column(Date, nullable=True)
    next_service_date           = Column(Date, nullable=True)
    insurance_expiry_date       = Column(Date, nullable=True)
    created_at                  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at                  = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Trip(Base):
    __tablename__ = "trips"

    id                  = Column(Integer, primary_key=True, autoincrement=True)
    trip_no             = Column(String(50), unique=True, nullable=True)
    type                = Column(SAEnum(TripType), nullable=False, default=TripType.order_delivery)
    driver_id           = Column(Integer, ForeignKey("drivers.id", ondelete="SET NULL"), nullable=True)
    vehicle_id          = Column(Integer, ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True)
    start_location      = Column(String(255), nullable=False)
    end_location        = Column(String(255), nullable=False)
    scheduled_date       = Column(Date, nullable=False)
    dispatch_date       = Column(DateTime(timezone=True), nullable=True)
    started_at          = Column(DateTime(timezone=True), nullable=True)
    completed_at        = Column(DateTime(timezone=True), nullable=True)
    status              = Column(SAEnum(TripStatus), nullable=False, default=TripStatus.pending)
    notes               = Column(Text, nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    cancelled_at        = Column(DateTime(timezone=True), nullable=True)
    created_at          = Column(DateTime(timezone=True), server_default=func.now())
    updated_at          = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    driver  = relationship("Driver", foreign_keys=[driver_id])
    vehicle = relationship("Vehicle", foreign_keys=[vehicle_id])
    trip_orders = relationship("TripOrder", back_populates="trip", cascade="all, delete-orphan")


class TripOrder(Base):
    __tablename__ = "trip_orders"

    id       = Column(Integer, primary_key=True, autoincrement=True)
    trip_id  = Column(Integer, ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    order_id = Column(CHAR(36), ForeignKey("orders.id", ondelete="RESTRICT"), nullable=False)

    trip  = relationship("Trip", back_populates="trip_orders")
    order = relationship("Order", foreign_keys=[order_id])