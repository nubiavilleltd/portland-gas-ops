from __future__ import annotations

from sqlalchemy.orm import Session

from app.shared.services import email_service

# from app.fleet.trips. import get_driver_assignment_context

from app.fleet.trips.email_context import get_driver_assignment_context


def notify_driver_assigned(
    db: Session,
    trip_id: str,
) -> None:
    """
    Notify a driver that they have been assigned to a trip.

    
    """

    context = get_driver_assignment_context(db, trip_id)

    if not context:
        return
    

    email_service.send_template_email(
        to_email=context["recipient_email"],
        subject=f"Trip Assigned - {context['trip_number']}",
        template_name="fleet/driver_assigned.html",
        variables=context,
    )