from __future__ import annotations

from sqlalchemy.orm import Session

from app.audit.schema import AuditActorType
from app.audit.schema import AuditEntityType
from app.audit.service import AuditService

from app.orders.service import OrderService

from app.fleet.drivers.service import DriverService
from app.fleet.vehicles.service import VehicleService
from app.fleet.trips.service import TripService


class CompleteTripWorkflow:

    def __init__(self):
        self.trip_service = TripService()
        self.driver_service = DriverService()
        self.vehicle_service = VehicleService()
        self.order_service = OrderService()
        self.audit_service = AuditService()

    def execute(
        self,
        db: Session,
        trip_id: int,
        proof_notes: str | None,
        actor_id: str,
    ):

        with db.begin():

            #
            # Get Trip
            #
            trip = self.trip_service.get_or_raise(
                db=db,
                trip_id=trip_id,
            )

            #
            # Ensure every linked order is completed
            #
            for order_id in self.trip_service.get_order_ids(
                db=db,
                trip_id=trip.id,
            ):

                order = self.order_service.get_or_raise(
                    db=db,
                    order_id=order_id,
                )

                if order.order_status.value != "completed":
                    raise ValueError(
                        f"Order '{order.order_no}' must be completed before the trip can be completed."
                    )

            #
            # Complete Trip
            #
            trip = self.trip_service.complete(
                db=db,
                trip_id=trip.id,
                proof_notes=proof_notes,
            )

            #
            # Release Driver
            #
            if trip.driver_id:

                self.driver_service.release(
                    db=db,
                    driver_id=trip.driver_id,
                )

            #
            # Release Vehicle
            #
            if trip.vehicle_id:

                self.vehicle_service.release(
                    db=db,
                    vehicle_id=trip.vehicle_id,
                )

            #
            # Audit
            #
            self.audit_service.record(
                db=db,
                entity_type=AuditEntityType.trip,
                entity_id=str(trip.id),
                action="completed",
                description="Trip completed — all deliveries confirmed",
                actor_type=AuditActorType.employee,
                actor_employee_id=actor_id,
            )

            return trip