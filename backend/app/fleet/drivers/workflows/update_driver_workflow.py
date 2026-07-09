from __future__ import annotations

from sqlalchemy.orm import Session

from app.audit.schema import (
    AuditActorType,
    AuditEntityType,
)
from app.audit.service import AuditService

from app.fleet.drivers.schema import DriverUpdate
from app.fleet.drivers.service import DriverService


class UpdateDriverWorkflow:

    def __init__(self):
        self.driver_service = DriverService()
        self.audit_service = AuditService()

    def execute(
        self,
        db: Session,
        driver_id: int,
        data: DriverUpdate,
        actor_id: str,
    ):

        with db.begin():

            driver = self.driver_service.update(
                db=db,
                driver_id=driver_id,
                data=data,
            )

            self.audit_service.record(
                db=db,
                entity_type=AuditEntityType.driver,
                entity_id=str(driver.id),
                action="updated",
                description=f"Driver profile updated ({driver.license_number})",
                actor_type=AuditActorType.employee,
                actor_employee_id=actor_id,
            )

            return driver