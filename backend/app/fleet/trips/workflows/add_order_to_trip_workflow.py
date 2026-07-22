from __future__ import annotations

from sqlalchemy.orm import Session
from app.core.exceptions import AppException

from app.audit.schema import AuditActorType
from app.audit.schema import AuditEntityType
from app.audit.service import AuditService

from app.orders.service import OrderService

from app.fleet.trips.enums import TripStatus
from app.fleet.trips.service import TripService
from app.fleet.trips.error_codes import TripErrorCode



   
class AddOrderToTripWorkflow:

    def __init__(self):
        self.trip_service = TripService()
        self.order_service = OrderService()
        self.audit_service = AuditService()

    def execute(
        self,
        db: Session,
        trip_id: str,
        order_id: str,
        actor_employee_id:str,
        actor_name:str
    ):

        #
        # Load Trip
        #
        trip = self.trip_service.get_or_raise(
            db=db,
            trip_id=trip_id,
        )

        #
        # Load Order
        #
        order = self.order_service.get_or_raise(
            db=db,
            order_id=order_id,
        )

        #
        # Ensure the order is not already assigned
        #
        self.trip_service.ensure_order_not_assigned(
            db=db,
            order_id=order.id,
        )

        #
        # Order must still be pending
        #
        if order.fulfillment_status.value != "pending":
            raise AppException(
                status_code=400,
                error_code=TripErrorCode.ORDER_CANNOT_BE_LINKED,
                message=f"Order '{order.order_no}' cannot be assigned to a trip.",
            )

        #
        # Link Order
        #
        self.trip_service.add_order(
            db=db,
            trip_id=trip.id,
            order_id=order.id,
        )

        self.order_service.set_trip(
            db=db,
            order_id=order.id,
            trip_id=str(trip.id),
        )

        #
        # If the trip already has assigned resources,
        # immediately assign the order as well.
        #
        if self.trip_service.has_assigned_resources(trip):

            self.order_service.update_fulfillment_status(
                db=db,
                order_id=order.id,
                status="assigned",
            )

            #
            # If the newly-added order introduces tracked inventory,
            # the trip must return to Awaiting Inventory.
            #
            if self.trip_service.requires_inventory(
                db=db,
                trip_id=trip.id,
            ):

                self.trip_service.update(
                    db=db,
                    trip=trip,
                    status=TripStatus.awaiting_inventory,
                )

        #
        # Audit Order
        #

 
        self.audit_service.record(
            db=db,
            entity_type=AuditEntityType.order,
            entity_id=order.id,
            action="assigned_to_trip",
            description=f"Order assigned to trip {trip.trip_no}",
            actor_type=AuditActorType.employee,
            actor_employee_id=actor_employee_id,
            actor_name=actor_name,
        )

        #
        # Audit Trip
        #
        self.audit_service.record(
            db=db,
            entity_type=AuditEntityType.trip,
            entity_id=str(trip.id),
            action="order_added",
            description=f"Order {order.order_no} added to trip {trip.trip_no}",
            actor_type=AuditActorType.employee,
            actor_employee_id=actor_employee_id,
            actor_name=actor_name,
        )

        return trip
    