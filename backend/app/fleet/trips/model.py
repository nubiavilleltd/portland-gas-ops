from __future__ import annotations
import uuid

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

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    trip_no = Column(String(50), unique=True, nullable=False)

    trip_type = Column(
        SAEnum(TripType),
        nullable=False,
        default=TripType.order_delivery,
    )

    driver_id = Column(
        CHAR(36),
        ForeignKey("drivers.id", ondelete="SET NULL"),
        nullable=True,
    )

    vehicle_id = Column(
        CHAR(36),
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

    created_by = Column(
        CHAR(36),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=True,
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
    created_by_user = relationship(
        "User",
        foreign_keys=[created_by],
    )

    trip_orders = relationship(
        "TripOrder",
        back_populates="trip",
        cascade="all, delete-orphan",
    )

   

  
    
    @property
    def driver_name(self) -> str | None:
        return self.driver.full_name if self.driver else None

    @property
    def vehicle_name(self) -> str | None:
        return self.vehicle.name if self.vehicle else None
    @property
    def created_by_name(self) -> str | None:
        return (
            self.created_by_user.full_name
            if self.created_by_user
            else None
        )


class TripOrder(Base):
    __tablename__ = "trip_orders"

    id = Column(Integer, primary_key=True, autoincrement=True)

    trip_id = Column(
        CHAR(36),
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

    @property
    def order_no(self) -> str | None:
        return self.order.order_no if self.order else None