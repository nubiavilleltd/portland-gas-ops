from __future__ import annotations

from typing import List, Optional

from app.shared.utils.number_generator import generate_entity_no
from sqlalchemy.orm import Session, joinedload

from app.fleet.drivers.model import Driver
from app.employees.models import Employee


class DriverRepository:

    def generate_driver_no(self, db: Session) -> str:
        return generate_entity_no(db, Driver, "driver_no", "DRV")

    def get_by_id(self, db: Session, driver_id: str) -> Optional[Driver]:
        return (
            db.query(Driver)
            .options(
                joinedload(Driver.employee).joinedload(Employee.user),
                joinedload(Driver.profile_image),
            )
            .filter(Driver.id == driver_id)
            .first()
        )

    def get_by_employee_id(
        self,
        db: Session,
        employee_id: str,
    ) -> Optional[Driver]:
        return (
            db.query(Driver)
            .filter(Driver.employee_id == employee_id)
            .first()
        )

    def get_by_license_number(
        self,
        db: Session,
        license_number: str,
    ) -> Optional[Driver]:
        return (
            db.query(Driver)
            .filter(Driver.license_number == license_number)
            .first()
        )

    def list(
        self,
        db: Session,
        status: Optional[str] = None,
    ) -> List[Driver]:
        q = (
            db.query(Driver)
            .options(
                joinedload(Driver.employee).joinedload(Employee.user),
                joinedload(Driver.profile_image),
            )
        )

        if status:
            q = q.filter(Driver.status == status)

        return q.order_by(Driver.created_at.desc()).all()

    def create(self, db: Session, **fields) -> Driver:
        driver = Driver(**fields)
        db.add(driver)
        db.flush()
        return driver

    def save(self, db: Session, driver: Driver) -> Driver:
        db.flush()
        return driver
    def update(
        self,
        db: Session,
        driver: Driver,
        **fields,
    ) -> Driver:

        for key, value in fields.items():
            setattr(driver, key, value)

        db.flush()

        return driver