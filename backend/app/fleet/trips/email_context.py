from __future__ import annotations

from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.employees.models import Employee
from app.fleet.trips.model import Trip, TripOrder
from app.orders.model import Order
from app.fleet.drivers.model import Driver


def _load_trip(
    db: Session,
    trip_id: str,
) -> Trip | None:
    """
    Load a trip with all relationships commonly required for Fleet emails.
    """

    print("calling load_trip", trip_id)

    return (
        db.query(Trip)
        .options(
            joinedload(Trip.driver)
                .joinedload(Driver.employee)
                .joinedload(Employee.user),

            joinedload(Trip.vehicle),

            joinedload(Trip.trip_orders)
                .joinedload(TripOrder.order)
                .joinedload(Order.customer),
        )
        .filter(Trip.id == trip_id)
        .first()
    )


def _base_trip_context(
    trip: Trip,
) -> dict[str, object]:
    """Template variables shared across Fleet trip emails."""

    return {
        "trip_number": trip.trip_no,
        "trip_type": trip.trip_type.value.replace("_", " ").title(),
        "start_location": trip.start_location,
        "end_location": trip.end_location,
        "scheduled_date": (
            trip.scheduled_date.strftime("%d %b %Y")
            if trip.scheduled_date
            else "-"
        ),
        "notes": trip.notes or "-",
        "trip_url": (
            f"{settings.FRONTEND_URL.rstrip('/')}/fleet/trips/{trip.id}"
        ),
    }


def get_driver_assignment_context(
    db: Session,
    trip_id: str,
) -> dict[str, object] | None:
    """
    Build the template context for the Driver Assigned email.
    """

    print("get_driver_assignment_context get called", trip_id)

    trip = _load_trip(db, trip_id)

    print("trip loaded", trip)

    print("driver:", trip.driver)
    print("driver email:", trip.driver.email if trip.driver else None)
    print("driver name:", trip.driver.full_name if trip.driver else None)

    if not trip:
        return None

    if (
        not trip.driver
        or not trip.driver.email
    ):
        return None

    context = _base_trip_context(trip)

    context.update(
        {
            "recipient_email": trip.driver.email,
            "driver_name": trip.driver.full_name,
            "vehicle_name": (
                trip.vehicle.name
                if trip.vehicle
                else "Not Assigned"
            ),
        }
    )

    return context