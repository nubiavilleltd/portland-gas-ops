from __future__ import annotations

from sqlalchemy.orm import Session

from app.audit.schema import AuditActorType
from app.audit.schema import AuditEntityType
from app.audit.service import AuditService

from app.orders.service import OrderService

from app.fleet.drivers.service import DriverService
from app.fleet.vehicles.service import VehicleService
from app.fleet.trips.service import TripService


class StartTripWorkflow:

    def __init__(self):
        self.trip_service = TripService()
        self.driver_service = DriverService()
        self.vehicle_service = VehicleService()
        self.order_service = OrderService()
        self.audit_service = AuditService()

    def execute(
        self,
        db: Session,
        trip_id: str,
        actor_employee_id: str,
        actor_name: str,
    ):

        trip = self.trip_service.start(
            db=db,
            trip_id=trip_id,
        )

        #
        # Driver
        #
        if trip.driver_id:

            self.driver_service.mark_in_transit(
                db=db,
                driver_id=trip.driver_id,
            )

        #
        # Vehicle
        #
        if trip.vehicle_id:

            self.vehicle_service.mark_in_transit(
                db=db,
                vehicle_id=trip.vehicle_id,
            )

        #
        # Orders
        #
        order_ids = self.trip_service.get_order_ids(
            db=db,
            trip_id=trip.id,
        )

        for order_id in order_ids:

            order = self.order_service.get_or_raise(
                db=db,
                order_id=order_id,
            )

            if order.fulfillment_status.value != "delivered":

                self.order_service.update_fulfillment_status(
                    db=db,
                    order_id=order.id,
                    status="in_transit",
                )

                self.audit_service.record(
                    db=db,
                    entity_type=AuditEntityType.order,
                    entity_id=order.id,
                    action="in_transit",
                    description="Order is now in transit.",
                    actor_type=AuditActorType.system,
                    actor_employee_id=None,
                    actor_name=None
                )

        #
        # Trip Audit
        #
        self.audit_service.record(
            db=db,
            entity_type=AuditEntityType.trip,
            entity_id=str(trip.id),
            action="started",
            description="Driver confirmed departure. Trip is now in transit.",
            actor_type=AuditActorType.employee,
            actor_employee_id=actor_employee_id,
            actor_name=actor_name,
        )

        return trip