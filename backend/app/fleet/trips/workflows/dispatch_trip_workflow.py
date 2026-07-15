from __future__ import annotations

from sqlalchemy.orm import Session

from app.audit.schema import AuditActorType
from app.audit.schema import AuditEntityType
from app.audit.service import AuditService

from app.inventory.service import InventoryService
from app.orders.service import OrderService

from app.fleet.trips.service import TripService


class DispatchTripWorkflow:

    def __init__(self):
        self.trip_service = TripService()
        self.order_service = OrderService()
        self.inventory_service = InventoryService()
        self.audit_service = AuditService()

    def execute(
        self,
        db: Session,
        trip_id: str,
        actor_id: str,
    ):

        #
        # Dispatch Trip
        #
        trip = self.trip_service.dispatch(
            db=db,
            trip_id=trip_id,
        )

        #
        # Update linked orders
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
                    order_no=order.order_no,
                    status="dispatched",
                )

                self.audit_service.record(
                    db=db,
                    entity_type=AuditEntityType.order,
                    entity_id=order.id,
                    action="dispatched",
                    description=f"Order dispatched on trip {trip.trip_no}",
                    actor_type=AuditActorType.system,
                )

        #
        # Check out inventory (tracked products only)
        #
        self.inventory_service.check_out_for_trip(
            db=db,
            trip_id=trip.id,
            actor_id=actor_id,
        )

        #
        # Trip Audit
        #
        self.audit_service.record(
            db=db,
            entity_type=AuditEntityType.trip,
            entity_id=str(trip.id),
            action="dispatched",
            description=f"Trip dispatched with {len(order_ids)} order(s)",
            actor_type=AuditActorType.employee,
            actor_employee_id=actor_id,
        )

        return trip