from __future__ import annotations

from sqlalchemy.orm import Session

from app.audit.schema import AuditActorType
from app.audit.schema import AuditEntityType
from app.audit.service import AuditService

from app.inventory.service import InventoryService
from app.orders.service import OrderService

from app.fleet.drivers.service import DriverService
from app.fleet.vehicles.service import VehicleService
from app.fleet.trips.service import TripService


class CancelTripWorkflow:

    def __init__(self):
        self.trip_service = TripService()
        self.driver_service = DriverService()
        self.vehicle_service = VehicleService()
        self.order_service = OrderService()
        self.inventory_service = InventoryService()
        self.audit_service = AuditService()

    def execute(
        self,
        db: Session,
        trip_id: int,
        reason: str | None,
        actor_id: str,
    ):

        with db.begin():

            #
            # Load Trip
            #
            trip = self.trip_service.get_or_raise(
                db=db,
                trip_id=trip_id,
            )

            #
            # Cancel Trip
            #
            trip = self.trip_service.cancel(
                db=db,
                trip_id=trip.id,
                reason=reason,
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
            # Update Orders
            #
            for order_id in self.trip_service.get_order_ids(
                db=db,
                trip_id=trip.id,
            ):

                order = self.order_service.get_or_raise(
                    db=db,
                    order_id=order_id,
                )

                #
                # Delivered orders stay untouched.
                #
                if order.fulfillment_status.value == "delivered":
                    continue

                self.order_service.update_fulfillment_status(
                    db=db,
                    order_no=order.order_no,
                    status="pending",
                )

                self.order_service.set_trip(
                    db=db,
                    order_no=order.order_no,
                    trip_id=None,
                )

                self.audit_service.record(
                    db=db,
                    entity_type=AuditEntityType.order,
                    entity_id=order.id,
                    action="removed_from_trip",
                    description=f"Order removed from cancelled trip {trip.trip_no}",
                    actor_type=AuditActorType.system,
                )

            #
            # Return checked-out inventory
            #
            self.inventory_service.release_trip_inventory(
                db=db,
                trip_id=trip.id,
            )

            #
            # Audit Trip
            #
            self.audit_service.record(
                db=db,
                entity_type=AuditEntityType.trip,
                entity_id=str(trip.id),
                action="cancelled",
                description=(
                    f"Trip cancelled: {reason}"
                    if reason
                    else "Trip cancelled"
                ),
                actor_type=AuditActorType.employee,
                actor_employee_id=actor_id,
            )

            return trip