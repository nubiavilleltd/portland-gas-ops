from __future__ import annotations

from pydantic import field_validator

from app.fleet.trips.schema import TripCreate


class TripCreateValidator(TripCreate):

    @field_validator("start_location", "end_location")
    @classmethod
    def validate_location(cls, value: str):
        value = value.strip()

        if not value:
            raise ValueError("Location cannot be empty")

        return value