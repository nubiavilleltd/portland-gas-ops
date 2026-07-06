from __future__ import annotations

from pydantic import field_validator
from app.fleet.drivers.schema import DriverCreate, DriverUpdate


class DriverCreateValidator(DriverCreate):

    @field_validator("license_number")
    @classmethod
    def validate_license_number(cls, value: str) -> str:
        value = value.strip().upper()

        if not value:
            raise ValueError("License number cannot be empty")

        return value


class DriverUpdateValidator(DriverUpdate):

    @field_validator("license_number")
    @classmethod
    def validate_license_number(cls, value: str | None):
        if value is None:
            return value

        value = value.strip().upper()

        if not value:
            raise ValueError("License number cannot be empty")

        return value