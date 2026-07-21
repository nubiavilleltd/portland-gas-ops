from __future__ import annotations

from typing import List, Optional

from sqlalchemy.orm import Session

from app.core.exceptions import AppException
from app.fleet.drivers.enums import DriverStatus
from app.fleet.drivers.error_codes import DriverErrorCode
from app.fleet.drivers.model import Driver
from app.fleet.drivers.repository import DriverRepository
from app.fleet.drivers.schema import DriverCreate, DriverUpdate


class DriverService:

    def __init__(self):
        self.repo = DriverRepository()

    # ------------------------------------------------------------------
    # Queries
    # ------------------------------------------------------------------

    def get_or_raise(self, db: Session, driver_id: str) -> Driver:
        driver = self.repo.get_by_id(db, driver_id)

        if not driver:
            raise AppException(
                404,
                DriverErrorCode.DRIVER_NOT_FOUND,
                f"Driver {driver_id} not found",
            )

        return driver

    def list(
        self,
        db: Session,
        *,
        status: Optional[DriverStatus] = None,
    ) -> List[Driver]:
        return self.repo.list(db, status=status)

    def list_available(self, db: Session) -> List[Driver]:
        return self.repo.list(db, status=DriverStatus.available)

    # ------------------------------------------------------------------
    # CRUD
    # ------------------------------------------------------------------

    def create(
        self,
        db: Session,
        data: DriverCreate,
        *,
        profile_image_document_id: Optional[int] = None,
    ) -> Driver:

        existing = self.repo.get_by_license_number(db, data.license_number)

        if existing:
            raise AppException(
                409,
                DriverErrorCode.LICENSE_NUMBER_ALREADY_EXISTS,
                "License number already exists.",
            )
        
        driver_no = self.repo.generate_driver_no(db)

        return self.repo.create(
            db,
            driver_no=driver_no,
            employee_id=data.employee_id,
            license_number=data.license_number,
            license_expiry_date=data.license_expiry_date,
            experience_years=data.experience_years,
            address=data.address,
            profile_image_document_id=profile_image_document_id,
            status=DriverStatus.available,
        )

    def update(
        self,
        db: Session,
        driver_id: str,
        data: DriverUpdate,
    ) -> Driver:

        driver = self.get_or_raise(db, driver_id)

        if (
            data.license_number
            and data.license_number != driver.license_number
        ):
            existing = self.repo.get_by_license_number(
                db,
                data.license_number,
            )

            if existing:
                raise AppException(
                    409,
                    DriverErrorCode.LICENSE_NUMBER_ALREADY_EXISTS,
                    "License number already exists.",
                )

        updates = data.model_dump(exclude_unset=True)

        return self.repo.update(
            db,
            driver,
            **updates,
        )

    # ------------------------------------------------------------------
    # Assignment
    # ------------------------------------------------------------------

    def assign_to_trip(
        self,
        db: Session,
        driver_id: str,
        trip_id: str,
    ) -> Driver:

        driver = self.get_or_raise(db, driver_id)

        if driver.status != DriverStatus.available:
            raise AppException(
                400,
                DriverErrorCode.DRIVER_ALREADY_ASSIGNED,
                "Driver is not available.",
            )

        return self.repo.update(
            db,
            driver,
            status=DriverStatus.assigned,
        )

    def mark_in_transit(
        self,
        db: Session,
        driver_id: str,
    ) -> Driver:

        driver = self.get_or_raise(db, driver_id)

        return self.repo.update(
            db,
            driver,
            status=DriverStatus.in_transit,
        )

    def release(
        self,
        db: Session,
        driver_id: str,
    ) -> Driver:

        driver = self.get_or_raise(db, driver_id)

        return self.repo.update(
            db,
            driver,
            status=DriverStatus.available,
        )
    
    def suspend(
        self,
        db: Session,
        driver_id: str,
    ) -> Driver:

        driver = self.get_or_raise(db, driver_id)

        # Cannot suspend while assigned or driving
        if driver.status in (
            DriverStatus.assigned,
            DriverStatus.in_transit,
        ):
            raise AppException(
                400,
                DriverErrorCode.DRIVER_NOT_AVAILABLE,
                "Driver cannot be suspended while assigned or in transit.",
            )

        # Already suspended
        if driver.status == DriverStatus.suspended:
            raise AppException(
                400,
                DriverErrorCode.DRIVER_NOT_AVAILABLE,
                "Driver is already suspended.",
            )

        return self.repo.update(
            db,
            driver,
            status=DriverStatus.suspended,
        )
    

    def reinstate(
        self,
        db: Session,
        driver_id: str,
    ) -> Driver:

        driver = self.get_or_raise(db, driver_id)

        # Only suspended drivers can be reinstated
        if driver.status != DriverStatus.suspended:
            raise AppException(
                400,
                DriverErrorCode.DRIVER_NOT_AVAILABLE,
                "Only suspended drivers can be reinstated.",
            )

        return self.repo.update(
            db,
            driver,
            status=DriverStatus.available,
        )
    

    def set_off_duty(
            self,
            db: Session,
            driver_id: str,
        ) -> Driver:

            driver = self.get_or_raise(db, driver_id)

            # Only available drivers can go off duty
            if driver.status != DriverStatus.available:
                raise AppException(
                    400,
                    DriverErrorCode.DRIVER_NOT_AVAILABLE,
                    "Only available drivers can be set off duty.",
                )

            return self.repo.update(
                db,
                driver,
                status=DriverStatus.off_duty,
            )
    
    def set_available(
        self,
        db: Session,
        driver_id: str,
    ) -> Driver:

        driver = self.get_or_raise(db, driver_id)

        # Only off-duty drivers can become available
        if driver.status != DriverStatus.off_duty:
            raise AppException(
                400,
                DriverErrorCode.DRIVER_NOT_AVAILABLE,
                "Only off-duty drivers can be set available.",
            )

        return self.repo.update(
            db,
            driver,
            status=DriverStatus.available,
        )

    # ------------------------------------------------------------------
    # Validation helpers
    # ------------------------------------------------------------------

    def ensure_available(
        self,
        db: Session,
        driver_id: str,
    ) -> Driver:

        driver = self.get_or_raise(db, driver_id)

        if driver.status != DriverStatus.available:
            raise AppException(
                400,
                DriverErrorCode.DRIVER_NOT_AVAILABLE,
                f"Driver is currently {driver.status.value}.",
            )

        return driver