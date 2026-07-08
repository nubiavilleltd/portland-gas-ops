from __future__ import annotations

from enum import Enum


class TripType(str, Enum):
    order_delivery = "order_delivery"
    maintenance = "maintenance"
    inspection = "inspection"
    station_transfer = "station_transfer"
    emergency = "emergency"


class TripStatus(str, Enum):
    pending = "pending"
    assigned = "assigned"
    awaiting_inventory = "awaiting_inventory"
    ready_for_dispatch = "ready_for_dispatch"
    dispatched = "dispatched"
    in_transit = "in_transit"
    completed = "completed"
    cancelled = "cancelled"