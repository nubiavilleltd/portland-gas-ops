from __future__ import annotations

from enum import Enum


class DriverStatus(str, Enum):
    available = "available"
    assigned = "assigned"
    in_transit = "in_transit"
    off_duty = "off_duty"
    suspended = "suspended"