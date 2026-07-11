from __future__ import annotations

from typing import List, Optional

from sqlalchemy.orm import Session

from app.core.exceptions import AppException
from app.fleet.vehicles.enums import VehicleStatus
from app.fleet.vehicles.error_codes import VehicleErrorCode
from app.fleet.vehicles.model import Vehicle
from app.fleet.vehicles.repository import VehicleRepository
from app.fleet.vehicles.schema import VehicleCreate, VehicleUpdate


class VehicleService:

    def __init__(self):
        self.repo = VehicleRepository()

    # ------------------------------------------------------------------
    # Queries
    # ------------------------------------------------------------------

    def get_or_raise(
        self,
        db: Session,
        vehicle_id: str,
    ) -> Vehicle:

        vehicle = self.repo.get_by_id(db, vehicle_id)

        if not vehicle:
            raise AppException(
                404,
                VehicleErrorCode.VEHICLE_NOT_FOUND,
                f"Vehicle {vehicle_id} not found.",
            )

        return vehicle

    def list(
        self,
        db: Session,
        *,
        status: Optional[VehicleStatus] = None,
    ) -> List[Vehicle]:
        return self.repo.list(db, status=status)

    def list_available(self, db: Session) -> List[Vehicle]:
        return self.repo.list(db, status=VehicleStatus.available)

    # ------------------------------------------------------------------
    # CRUD
    # ------------------------------------------------------------------

    def create(
        self,
        db: Session,
        data: VehicleCreate,
        *,
        primary_image_document_id: Optional[int] = None,
    ) -> Vehicle:

        existing = self.repo.get_by_plate_number(
            db,
            data.plate_number,
        )

        if existing:
            raise AppException(
                409,
                VehicleErrorCode.PLATE_NUMBER_ALREADY_EXISTS,
                "Plate number already exists.",
            )

        vehicle_no = self.repo.generate_vehicle_no(db)

        return self.repo.create(
            db,
            vehicle_no=vehicle_no,
            plate_number=data.plate_number,
            name=data.name,
            vehicle_type=data.vehicle_type,
            make=data.make,
            model=data.model,
            year=data.year,
            capacity=data.capacity,
            fuel_type=data.fuel_type,
            mileage=data.mileage,
            primary_image_document_id=primary_image_document_id,
            status=VehicleStatus.available,
            last_service_date=data.last_service_date,
            next_service_date=data.next_service_date,
            insurance_expiry_date=data.insurance_expiry_date,
            roadworthiness_expiry_date=data.roadworthiness_expiry_date,
        )

    def update(
        self,
        db: Session,
        vehicle_id: str,
        data: VehicleUpdate,
    ) -> Vehicle:

        vehicle = self.get_or_raise(db, vehicle_id)

        if (
            data.plate_number
            and data.plate_number != vehicle.plate_number
        ):
            existing = self.repo.get_by_plate_number(
                db,
                data.plate_number,
            )

            if existing:
                raise AppException(
                    409,
                    VehicleErrorCode.PLATE_NUMBER_ALREADY_EXISTS,
                    "Plate number already exists.",
                )

        updates = data.model_dump(exclude_unset=True)

        return self.repo.update(
            db,
            vehicle,
            **updates,
        )

    # ------------------------------------------------------------------
    # Assignment
    # ------------------------------------------------------------------

    def assign_to_trip(
        self,
        db: Session,
        vehicle_id: str,
        trip_id: str,
    ) -> Vehicle:

        vehicle = self.get_or_raise(db, vehicle_id)

        if vehicle.status != VehicleStatus.available:
            raise AppException(
                400,
                VehicleErrorCode.VEHICLE_ALREADY_ASSIGNED,
                "Vehicle is not available.",
            )

        return self.repo.update(
            db,
            vehicle,
            status=VehicleStatus.in_use,
            current_trip_id=trip_id,
        )

    def mark_in_transit(
        self,
        db: Session,
        vehicle_id: str,
    ) -> Vehicle:

        vehicle = self.get_or_raise(db, vehicle_id)

        return self.repo.update(
            db,
            vehicle,
            status=VehicleStatus.in_transit,
        )

    def release(
        self,
        db: Session,
        vehicle_id: str,
    ) -> Vehicle:

        vehicle = self.get_or_raise(db, vehicle_id)

        return self.repo.update(
            db,
            vehicle,
            status=VehicleStatus.available,
            current_trip_id=None,
        )

    # ------------------------------------------------------------------
    # Validation helpers
    # ------------------------------------------------------------------

    def ensure_available(
        self,
        db: Session,
        vehicle_id: str,
    ) -> Vehicle:

        vehicle = self.get_or_raise(db, vehicle_id)

        if vehicle.status != VehicleStatus.available:
            raise AppException(
                400,
                VehicleErrorCode.VEHICLE_NOT_AVAILABLE,
                f"Vehicle is currently {vehicle.status.value}.",
            )

        return vehicle
    