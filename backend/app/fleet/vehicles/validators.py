from __future__ import annotations

from pydantic import field_validator

from app.fleet.vehicles.schema import VehicleCreate, VehicleUpdate


class VehicleCreateValidator(VehicleCreate):

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str):
        value = value.strip()

        if not value:
            raise ValueError("Vehicle name cannot be empty")

        return value

    @field_validator("plate_number")
    @classmethod
    def validate_plate_number(cls, value: str):
        value = value.strip().upper()

        if not value:
            raise ValueError("Plate number cannot be empty")

        return value

    @field_validator("fuel_type")
    @classmethod
    def validate_fuel_type(cls, value: str):
        value = value.strip()

        if not value:
            raise ValueError("Fuel type cannot be empty")

        return value


class VehicleUpdateValidator(VehicleUpdate):

    @field_validator("plate_number")
    @classmethod
    def validate_plate_number(cls, value):
        if value is None:
            return value

        value = value.strip().upper()

        if not value:
            raise ValueError("Plate number cannot be empty")

        return value