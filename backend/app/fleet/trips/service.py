from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy.orm import Session

from app.core.exceptions import AppException

from app.fleet.trips.enums import TripStatus
from app.fleet.trips.error_codes import TripErrorCode
from app.fleet.trips.guards import (
    can_add_order,
    can_assign_resources,
    can_cancel,
    can_complete,
    can_dispatch,
    can_mark_ready,
    can_start,
)
from app.fleet.trips.model import Trip
from app.fleet.trips.repository import TripRepository
from app.fleet.trips.schema import TripCreate, TripFilters
from app.fleet.trips import policies


class TripService:

    def __init__(self):
        self.repo = TripRepository()

    # ------------------------------------------------------------------
    # Queries
    # ------------------------------------------------------------------

    def get_or_raise(
        self,
        db: Session,
        trip_id: str,
    ) -> Trip:
        trip = self.repo.get_by_id(db, trip_id)

        if not trip:
            raise AppException(
                status_code=404,
                error_code=TripErrorCode.TRIP_NOT_FOUND,
                message=f"Trip '{trip_id}' was not found.",
            )

        return trip

    def get_order_ids(
        self,
        db: Session,
        trip_id: str,
    ) -> List[str]:
        return self.repo.get_order_ids(
            db=db,
            trip_id=trip_id,
        )

    def list(
        self,
        db: Session,
        filters: TripFilters,
        current_user,
    ) -> tuple[list[Trip], int]:

        if policies.can_manage_trips(current_user):
            return self.repo.list(
                db=db,
                status=filters.status,
                page=filters.page,
                page_size=filters.page_size,
            )

        return self.repo.list(
            db=db,
            created_by=current_user.id,
            status=filters.status,
            page=filters.page,
            page_size=filters.page_size,
        )

    # ------------------------------------------------------------------
    # CRUD
    # ------------------------------------------------------------------

    def create(
        self,
        db: Session,
        data: TripCreate,
        created_by:str
    ) -> Trip:

        trip_no = self.repo.generate_trip_no(db)

        return self.repo.create(
            db=db,
            trip_no=trip_no,
            trip_type=data.type,
            start_location=data.start_location,
            end_location=data.end_location,
            scheduled_date=data.scheduled_date,
            notes=data.notes,
            status=TripStatus.pending,
            created_by=created_by
        )

    def update(
        self,
        db: Session,
        trip: Trip,
        **fields,
    ) -> Trip:
        return self.repo.update(
            db=db,
            trip=trip,
            **fields,
        )

    # ------------------------------------------------------------------
    # Orders
    # ------------------------------------------------------------------

    def add_order(
        self,
        db: Session,
        trip_id: str,
        order_id: str,
    ) -> Trip:

        trip = self.get_or_raise(db, trip_id)

        if not can_add_order(trip):
            raise AppException(
                status_code=400,
                error_code=TripErrorCode.TRIP_CANNOT_BE_MODIFIED,
                message="Orders cannot be added once the trip has been dispatched.",
            )

        self.repo.add_order(
            db=db,
            trip_id=trip.id,
            order_id=order_id,
        )

        return trip

    def remove_order(
        self,
        db: Session,
        trip_id: str,
        order_id: str,
    ) -> Trip:

        trip = self.get_or_raise(db, trip_id)

        if not can_add_order(trip):
            raise AppException(
                status_code=400,
                error_code=TripErrorCode.TRIP_CANNOT_BE_MODIFIED,
                message="Orders cannot be removed once the trip has been dispatched.",
            )

        self.repo.remove_order(
            db=db,
            trip_id=trip.id,
            order_id=order_id,
        )

        return trip

    # ------------------------------------------------------------------
    # Resource Assignment
    # ------------------------------------------------------------------

    def assign_resources(
        self,
        db: Session,
        trip_id: str,
        driver_id: str,
        vehicle_id: str,
        awaiting_inventory: bool,
    ) -> Trip:

        trip = self.get_or_raise(db, trip_id)

        if not can_assign_resources(trip):
            raise AppException(
                status_code=400,
                error_code=TripErrorCode.TRIP_CANNOT_BE_ASSIGNED,
                message="Resources cannot be assigned to this trip.",
            )

        next_status = (
            TripStatus.awaiting_inventory
            if awaiting_inventory
            else TripStatus.ready_for_dispatch
        )

        return self.repo.update(
            db=db,
            trip=trip,
            driver_id=driver_id,
            vehicle_id=vehicle_id,
            status=next_status,
        )

    # ------------------------------------------------------------------
    # Trip State
    # ------------------------------------------------------------------

    def mark_ready(
        self,
        db: Session,
        trip_id: str,
    ) -> Trip:

        trip = self.get_or_raise(db, trip_id)

        if not can_mark_ready(trip):
            raise AppException(
                status_code=400,
                error_code=TripErrorCode.TRIP_CANNOT_BE_MARKED_READY,
                message="Trip cannot be marked ready.",
            )

        return self.repo.update(
            db=db,
            trip=trip,
            status=TripStatus.ready_for_dispatch,
        )

    def dispatch(
        self,
        db: Session,
        trip_id: str,
    ) -> Trip:

        trip = self.get_or_raise(db, trip_id)

        if not can_dispatch(trip):
            raise AppException(
                status_code=400,
                error_code=TripErrorCode.TRIP_CANNOT_BE_DISPATCHED,
                message="Trip cannot be dispatched.",
            )

        if not trip.driver_id:
            raise AppException(
                status_code=400,
                error_code=TripErrorCode.DRIVER_NOT_ASSIGNED,
                message="A driver must be assigned before dispatch.",
            )

        if not trip.vehicle_id:
            raise AppException(
                status_code=400,
                error_code=TripErrorCode.VEHICLE_NOT_ASSIGNED,
                message="A vehicle must be assigned before dispatch.",
            )

        return self.repo.update(
            db=db,
            trip=trip,
            status=TripStatus.dispatched,
            dispatch_date=datetime.now(timezone.utc),
        )

    def start(
        self,
        db: Session,
        trip_id: str,
    ) -> Trip:

        trip = self.get_or_raise(db, trip_id)

        if not can_start(trip):
            raise AppException(
                status_code=400,
                error_code=TripErrorCode.TRIP_CANNOT_BE_STARTED,
                message="Trip cannot be started.",
            )

        return self.repo.update(
            db=db,
            trip=trip,
            status=TripStatus.in_transit,
            started_at=datetime.now(timezone.utc),
        )

    def complete(
        self,
        db: Session,
        trip:Trip,
        proof_notes: Optional[str] = None,
    ) -> Trip:

        # trip = self.get_or_raise(db, trip_id)

        if not can_complete(trip):
            raise AppException(
                status_code=400,
                error_code=TripErrorCode.TRIP_CANNOT_BE_COMPLETED,
                message="Trip cannot be completed.",
            )

        notes = trip.notes or ""

        if proof_notes:
            notes = (
                f"{notes}\nDelivery confirmed: {proof_notes}"
                if notes
                else f"Delivery confirmed: {proof_notes}"
            )

        return self.repo.update(
            db=db,
            trip=trip,
            status=TripStatus.completed,
            completed_at=datetime.now(timezone.utc),
            notes=notes,
        )

    def cancel(
        self,
        db: Session,
        trip_id: str,
        reason: Optional[str] = None,
    ) -> Trip:

        trip = self.get_or_raise(db, trip_id)

        if not can_cancel(trip):
            raise AppException(
                status_code=400,
                error_code=TripErrorCode.TRIP_CANNOT_BE_CANCELLED,
                message="Trip cannot be cancelled.",
            )

        return self.repo.update(
            db=db,
            trip=trip,
            status=TripStatus.cancelled,
            cancellation_reason=reason,
            cancelled_at=datetime.now(timezone.utc),
        )

    # ------------------------------------------------------------------
    # Inventory
    # ------------------------------------------------------------------

    def requires_inventory(
        self,
        db: Session,
        trip_id: str,
    ) -> bool:
        """
        Returns True if any order attached to the trip contains
        tracked inventory items.

        This method intentionally only answers the question.
        It does not reserve or check out inventory.
        """

        trip = self.get_or_raise(db, trip_id)

        return self.repo.trip_requires_inventory(
            db=db,
            trip_id=trip.id,
        )

    def requires_inventory_assignment(
        self,
        db: Session,
        trip_id: str,
    ) -> bool:
        """
        Returns True if the trip should go through the
        Inventory Assignment step before dispatch.

        Every order-delivery trip with one or more orders
        must pass through inventory assignment, regardless
        of product type.
        """

        order_ids = self.get_order_ids(
            db=db,
            trip_id=trip_id,
        )

        return len(order_ids) > 0

    # ------------------------------------------------------------------
    # Validation helpers
    # ------------------------------------------------------------------

    def ensure_has_driver(
        self,
        trip: Trip,
    ) -> None:

        if trip.driver_id is None:
            raise AppException(
                status_code=400,
                error_code=TripErrorCode.DRIVER_NOT_ASSIGNED,
                message="Trip has no assigned driver.",
            )

    def ensure_has_vehicle(
        self,
        trip: Trip,
    ) -> None:

        if trip.vehicle_id is None:
            raise AppException(
                status_code=400,
                error_code=TripErrorCode.VEHICLE_NOT_ASSIGNED,
                message="Trip has no assigned vehicle.",
            )

    def ensure_order_not_assigned(
        self,
        db: Session,
        order_id: str,
    ) -> None:

        exists = self.repo.trip_exists_for_order(
            db=db,
            order_id=order_id,
        )

        if exists:
            raise AppException(
                status_code=400,
                error_code=TripErrorCode.ORDER_ALREADY_ASSIGNED,
                message="Order is already assigned to an active trip.",
            )

    def has_assigned_resources(
        self,
        trip: Trip,
    ) -> bool:

        return (
            trip.driver_id is not None
            and trip.vehicle_id is not None
        )