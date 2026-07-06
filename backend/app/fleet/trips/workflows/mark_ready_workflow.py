from __future__ import annotations

from sqlalchemy.orm import Session

from app.audit.schema import AuditActorType
from app.audit.schema import AuditEntityType
from app.audit.service import AuditService

from app.fleet.trips.service import TripService


class MarkReadyWorkflow:

    def __init__(self):
        self.trip_service = TripService()
        self.audit_service = AuditService()

    def execute(
        self,
        db: Session,
        trip_id: int,
        actor_id: str,
    ):

        with db.begin():

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