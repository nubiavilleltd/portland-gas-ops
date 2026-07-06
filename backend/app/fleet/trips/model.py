from __future__ import annotations

from sqlalchemy import (
    Column,
    Date,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base
from app.fleet.trips.enums import TripStatus, TripType


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, autoincrement=True)

    trip_no = Column(String(50), unique=True, nullable=True)

    trip_type = Column(
        SAEnum(TripType),
        nullable=False,
        default=TripType.order_delivery,
    )

    driver_id = Column(
        Integer,
        ForeignKey("drivers.id", ondelete="SET NULL"),
        nullable=True,
    )

    vehicle_id = Column(
        Integer,
        ForeignKey("vehicles.id", ondelete="SET NULL"),
        nullable=True,
    )

    start_location = Column(String(255), nullable=False)
    end_location = Column(String(255), nullable=False)

    scheduled_date = Column(Date, nullable=False)

    dispatch_date = Column(DateTime(timezone=True), nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    status = Column(
        SAEnum(TripStatus),
        nullable=False,
        default=TripStatus.pending,
    )

    notes = Column(Text, nullable=True)

    cancellation_reason = Column(Text, nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    driver = relationship(
        "Driver",
        back_populates="trips",
        foreign_keys=[driver_id],
    )

    vehicle = relationship(
        "Vehicle",
        back_populates="trips",
        foreign_keys=[vehicle_id],
    )

    trip_orders = relationship(
        "TripOrder",
        back_populates="trip",
        cascade="all, delete-orphan",
    )


class TripOrder(Base):
    __tablename__ = "trip_orders"

    id = Column(Integer, primary_key=True, autoincrement=True)

    trip_id = Column(
        Integer,
        ForeignKey("trips.id", ondelete="CASCADE"),
        nullable=False,
    )

    order_id = Column(
        CHAR(36),
        ForeignKey("orders.id", ondelete="RESTRICT"),
        nullable=False,
    )

    trip = relationship(
        "Trip",
        back_populates="trip_orders",
    )

    order = relationship(
        "Order",
        foreign_keys=[order_id],
    )