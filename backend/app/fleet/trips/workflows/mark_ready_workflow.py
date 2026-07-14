from __future__ import annotations

from sqlalchemy.orm import Session

from app.audit.schema import AuditActorType
from app.audit.schema import AuditEntityType
from app.audit.service import AuditService

from app.fleet.trips.service import TripService
from app.fleet.trips.schema import TripInventoryAssignment
from app.orders.repository import OrderRepository
from app.inventory.repository import InventoryRepository


class MarkReadyWorkflow:

    def __init__(self):
        self.trip_service = TripService()
        self.audit_service = AuditService()
        self.order_repo = OrderRepository()
        self.inventory_repo = InventoryRepository()

    def execute(
        self,
        db: Session,
        trip_id: str,
        assignments: list[TripInventoryAssignment],
        actor_id: str,
    ):
        trip = self.trip_service.get_or_raise(
            db=db,
            trip_id=trip_id,
        )

        trip = self.trip_service.mark_ready(
            db=db,
            trip_id=trip_id,
        )

        self.audit_service.record(
            db=db,
            entity_type=AuditEntityType.trip,
            entity_id=str(trip.id),
            action="marked_ready",
            description="Trip marked ready for dispatch.",
            actor_type=AuditActorType.employee,
            actor_employee_id=actor_id,
        )

        return trip