from __future__ import annotations
from enum import Enum

class DriverStatus(str, Enum):
    available = "available"
    assigned  = "assigned"
    in_transit = "in_transit"
    off_duty  = "off_duty"
    suspended = "suspended"

class VehicleStatus(str, Enum):
    available   = "available"
    in_use      = "in_use"
    in_transit  = "in_transit"
    maintenance = "maintenance"
    inactive    = "inactive"

class VehicleType(str, Enum):
    lpg_tanker     = "lpg_tanker"
    delivery_van   = "delivery_van"
    service_truck  = "service_truck"
    emergency_unit = "emergency_unit"

class TripType(str, Enum):
    order_delivery   = "order_delivery"
    maintenance      = "maintenance"
    inspection       = "inspection"
    station_transfer = "station_transfer"
    emergency        = "emergency"

class TripStatus(str, Enum):
    pending           = "pending"
    assigned          = "assigned"
    awaiting_inventory = "awaiting_inventory"
    ready             = "ready"
    dispatched        = "dispatched"
    in_transit        = "in_transit"
    completed         = "completed"
    cancelled         = "cancelled"