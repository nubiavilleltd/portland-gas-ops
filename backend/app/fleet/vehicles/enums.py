from __future__ import annotations

from enum import Enum


class VehicleStatus(str, Enum):
    available = "available"
    in_use = "in_use"
    in_transit = "in_transit"
    maintenance = "maintenance"
    inactive = "inactive"


class VehicleType(str, Enum):
    lpg_tanker = "lpg_tanker"
    delivery_van = "delivery_van"
    service_truck = "service_truck"
    emergency_unit = "emergency_unit"