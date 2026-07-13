from __future__ import annotations

from sqlalchemy.orm import Session

from app.audit.schema import AuditActorType
from app.audit.schema import AuditEntityType
from app.audit.service import AuditService

from app.orders.service import OrderService

from app.fleet.drivers.service import DriverService
from app.fleet.vehicles.service import VehicleService
from app.fleet.trips.service import TripService


class AssignResourcesWorkflow:

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
        driver_id: str,
        vehicle_id: str,
        actor_id: str,
    ):

        #
        # Validate trip
        #
        trip = self.trip_service.get_or_raise(
            db=db,
            trip_id=trip_id,
        )

        #
        # Ensure resources are available
        #
        driver = self.driver_service.ensure_available(
            db=db,
            driver_id=driver_id,
        )

        vehicle = self.vehicle_service.ensure_available(
            db=db,
            vehicle_id=vehicle_id,
        )

        #
        # Does this trip require inventory?
        #
        awaiting_inventory = self.trip_service.requires_inventory(
            db=db,
            trip_id=trip.id,
        )

        #
        # Assign trip resources
        #
        trip = self.trip_service.assign_resources(
            db=db,
            trip_id=trip.id,
            driver_id=driver.id,
            vehicle_id=vehicle.id,
            awaiting_inventory=awaiting_inventory,
        )

        #
        # Update driver & vehicle
        #
        self.driver_service.assign_to_trip(
            db=db,
            driver_id=driver.id,
            trip_id=trip.id,
        )

        self.vehicle_service.assign_to_trip(
            db=db,
            vehicle_id=vehicle.id,
            trip_id=trip.id,
        )

        #
        # Update linked orders
        #
        for order_id in self.trip_service.get_order_ids(
            db=db,
            trip_id=trip.id,
        ):

            order = self.order_service.get_or_raise(
                db=db,
                order_id=order_id,
            )

            self.order_service.update_fulfillment_status(
                db=db,
                order_no=order.order_no,
                status="assigned",
            )

        #
        # Audit
        #
        self.audit_service.record(
            db=db,
            entity_type=AuditEntityType.trip,
            entity_id=str(trip.id),
            action="resources_assigned",
            description=(
                f"Driver '{driver.employee.full_name}' "
                f"and vehicle '{vehicle.name}' assigned."
            ),
            actor_type=AuditActorType.employee,
            actor_employee_id=actor_id,
        )

        return trip