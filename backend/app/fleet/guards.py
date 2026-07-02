from __future__ import annotations
from app.fleet.model import Trip
from app.fleet.enums import TripStatus

def can_assign_resources(trip: Trip) -> bool:
    return trip.status in (TripStatus.pending, TripStatus.assigned)

def can_dispatch(trip: Trip) -> bool:
    return trip.status in (TripStatus.assigned, TripStatus.ready)

def can_start(trip: Trip) -> bool:
    return trip.status == TripStatus.dispatched

def can_complete(trip: Trip) -> bool:
    return trip.status == TripStatus.in_transit

def can_cancel(trip: Trip) -> bool:
    return trip.status != TripStatus.completed

def can_add_order(trip: Trip) -> bool:
    return trip.status in (TripStatus.pending, TripStatus.assigned,
                           TripStatus.awaiting_inventory, TripStatus.ready)

def can_mark_ready(trip: Trip) -> bool:
    return trip.status == TripStatus.awaiting_inventory