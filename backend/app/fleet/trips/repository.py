from __future__ import annotations

from typing import List, Optional

from sqlalchemy.orm import Session, joinedload

from app.fleet.trips.model import Trip, TripOrder
from app.fleet.trips.enums import TripStatus

from datetime import datetime, timezone

from app.orders.model import OrderItem
from app.products.model import Product
from app.products.enums import ProductType


class TripRepository:

    def get_by_id(
        self,
        db: Session,
        trip_id: str,
    ) -> Optional[Trip]:

        return (
            db.query(Trip)
            .options(
                joinedload(Trip.driver),
                joinedload(Trip.vehicle),
                joinedload(Trip.trip_orders),
            )
            .filter(Trip.id == trip_id)
            .first()
        )

    def list(
        self,
        db: Session,
        status: Optional[str] = None,
    ) -> List[Trip]:

        q = (
            db.query(Trip)
            .options(
                joinedload(Trip.driver),
                joinedload(Trip.vehicle),
                joinedload(Trip.trip_orders),
            )
        )

        if status:
            q = q.filter(Trip.status == status)

        return q.order_by(Trip.created_at.desc()).all()

    def create(
        self,
        db: Session,
        **fields,
    ) -> Trip:

        trip = Trip(**fields)
        db.add(trip)
        db.flush()
        return trip
    
    def update(
        self,
        db: Session,
        trip: Trip,
        **fields,
    ) -> Trip:

        for key, value in fields.items():
            setattr(trip, key, value)

        db.flush()

        return trip
    def generate_trip_no(
        self,
        db: Session,
    ) -> str:

        today = datetime.now(timezone.utc).strftime("%Y%m%d")

        prefix = f"TRP-{today}-"

        last_trip = (
            db.query(Trip)
            .filter(Trip.trip_no.like(f"{prefix}%"))
            .order_by(Trip.trip_no.desc())
            .first()
        )

        if last_trip and last_trip.trip_no:
            sequence = int(last_trip.trip_no.split("-")[-1]) + 1
        else:
            sequence = 1

        return f"{prefix}{sequence:03d}"
    def trip_requires_inventory(
        self,
        db: Session,
        trip_id: str,
    ) -> bool:

        order_ids = self.get_order_ids(
            db=db,
            trip_id=trip_id,
        )

        if not order_ids:
            return False

        count = (
            db.query(OrderItem)
            .join(Product, Product.id == OrderItem.product_id)
            .filter(
                OrderItem.order_id.in_(order_ids),
                Product.product_type == ProductType.tracked,
            )
            .count()
        )

        return count > 0

    def save(
        self,
        db: Session,
        trip: Trip,
    ) -> Trip:

        db.flush()
        return trip

    def add_order(
        self,
        db: Session,
        trip_id: str,
        order_id: str,
    ) -> TripOrder:

        trip_order = TripOrder(
            trip_id=trip_id,
            order_id=order_id,
        )

        db.add(trip_order)
        db.flush()

        return trip_order

    def remove_order(
        self,
        db: Session,
        trip_id: str,
        order_id: str,
    ) -> None:

        (
            db.query(TripOrder)
            .filter(
                TripOrder.trip_id == trip_id,
                TripOrder.order_id == order_id,
            )
            .delete()
        )

        db.flush()

    def get_order_ids(
        self,
        db: Session,
        trip_id: str,
    ) -> List[str]:

        rows = (
            db.query(TripOrder.order_id)
            .filter(TripOrder.trip_id == trip_id)
            .all()
        )

        return [row.order_id for row in rows]

    def get_active_trip_for_driver(
        self,
        db: Session,
        driver_id: str,
    ) -> Optional[Trip]:

        return (
            db.query(Trip)
            .filter(
                Trip.driver_id == driver_id,
                Trip.status.in_(
                    (
                        TripStatus.assigned,
                        TripStatus.awaiting_inventory,
                        TripStatus.ready_for_dispatch,
                        TripStatus.dispatched,
                        TripStatus.in_transit,
                    )
                ),
            )
            .first()
        )

    def get_active_trip_for_vehicle(
        self,
        db: Session,
        vehicle_id: str,
    ) -> Optional[Trip]:

        return (
            db.query(Trip)
            .filter(
                Trip.vehicle_id == vehicle_id,
                Trip.status.in_(
                    (
                        TripStatus.assigned,
                        TripStatus.awaiting_inventory,
                        TripStatus.ready_for_dispatch,
                        TripStatus.dispatched,
                        TripStatus.in_transit,
                    )
                ),
            )
            .first()
        )

    def trip_exists_for_order(
        self,
        db: Session,
        order_id: str,
    ) -> bool:

        return (
            db.query(TripOrder)
            .join(Trip)
            .filter(
                TripOrder.order_id == order_id,
                Trip.status.in_(
                    (
                        TripStatus.pending,
                        TripStatus.assigned,
                        TripStatus.awaiting_inventory,
                        TripStatus.ready_for_dispatch,
                        TripStatus.dispatched,
                        TripStatus.in_transit,
                    )
                ),
            )
            .first()
            is not None
        )
    