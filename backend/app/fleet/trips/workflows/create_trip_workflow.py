from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.exceptions import AppException

from app.audit.schema import AuditActorType
from app.audit.schema import AuditEntityType
from app.audit.service import AuditService

from app.orders.service import OrderService

from app.fleet.trips.service import TripService
from app.fleet.trips.schema import TripCreate
from app.fleet.trips.error_codes import TripErrorCode


class CreateTripWorkflow:

    def __init__(self):
        self.trip_service = TripService()
        self.order_service = OrderService()
        self.audit_service = AuditService()

    def execute(
        self,
        db: Session,
        data: TripCreate,
        actor_employee_id: str,
        actor_name: str,
    ):

        #
        # Create Trip
        #
        trip = self.trip_service.create(
            db=db,
            data=data,
        )

        #
        # Link Orders
        #
        for order_uuid in data.order_ids:

            order = self.order_service.get_or_raise(
                db=db,
                order_id=order_uuid,
            )

            if order.fulfillment_status.value != "pending":
                raise AppException(
                    status_code=400,
                    error_code=TripErrorCode.ORDER_CANNOT_BE_LINKED,
                    message=f"Order '{order.order_no}' cannot be assigned to a trip.",
                )

            self.trip_service.add_order(
                db=db,
                trip_id=trip.id,
                order_id=order.id,
            )

            self.order_service.assign_to_trip(
                db=db,
                order_id=order.id,
                trip_id=str(trip.id),
            )

            self.order_service.progress_fulfillment_status(
                db=db,
                order=order,
                status="assigned",
            )

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
        # Trip Audit
        #
        self.audit_service.record(
            db=db,
            entity_type=AuditEntityType.trip,
            entity_id=str(trip.id),
            action="created",
            description=f"Trip created ({trip.trip_no})",
            actor_type=AuditActorType.employee,
            actor_employee_id=actor_employee_id,
            actor_name=actor_name,
        )

        return trip