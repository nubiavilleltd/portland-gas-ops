from __future__ import annotations

from sqlalchemy.orm import Session

from app.audit.schema import (
    AuditActorType,
    AuditEntityType,
)
from app.audit.service import AuditService

from app.fleet.drivers.schema import DriverCreate
from app.fleet.drivers.service import DriverService


class CreateDriverWorkflow:

    def __init__(self):
        self.driver_service = DriverService()
        self.audit_service = AuditService()

    def execute(
        self,
        db: Session,
        data: DriverCreate,
        actor_employee_id: str,
        actor_name: str,
        profile_image_document_id: int | None = None,
    ):

        driver = self.driver_service.create(
            db=db,
            data=data,
            profile_image_document_id=profile_image_document_id,
        )

        self.audit_service.record(
            db=db,
            entity_type=AuditEntityType.driver,
            entity_id=str(driver.id),
            action="created",
            description=f"Driver profile created ({driver.license_number})",
            actor_type=AuditActorType.employee,
            actor_employee_id=actor_employee_id,
            actor_name=actor_name,
        )

        return driver