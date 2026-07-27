from __future__ import annotations

from enum import Enum


class DriverErrorCode(str, Enum):
    DRIVER_NOT_FOUND = "DRIVER_NOT_FOUND"
    DRIVER_NOT_AVAILABLE = "DRIVER_NOT_AVAILABLE"
    DRIVER_ALREADY_ASSIGNED = "DRIVER_ALREADY_ASSIGNED"

    LICENSE_NUMBER_IN_USE = "LICENSE_NUMBER_IN_USE"