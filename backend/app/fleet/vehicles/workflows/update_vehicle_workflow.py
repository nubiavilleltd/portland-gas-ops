from __future__ import annotations

from sqlalchemy.orm import Session

from app.audit.schema import (
    AuditActorType,
    AuditEntityType,
)
from app.audit.service import AuditService

from app.shared.services.cloudinary_service import (
    ResourceType,
    get_storage_service,
)

from app.fleet.vehicles.schema import VehicleUpdate
from app.fleet.vehicles.service import VehicleService


class UpdateVehicleWorkflow:

    def __init__(self):
        self.vehicle_service = VehicleService()
        self.storage = get_storage_service()

    def execute(
        self,
        *,
        db: Session,
        vehicle_id: str,
        data: VehicleUpdate,
        image: tuple[bytes, str, str, int] | None,
        actor_id: str,
    ):

        vehicle = self.vehicle_service.update(
            db=db,
            vehicle_id=vehicle_id,
            data=data,
        )

        if image:

            file_bytes, filename, mime_type, file_size = image

            result = self.storage.upload(
                file_bytes=file_bytes,
                filename=filename,
                folder=f"vehicles/{vehicle.id}",
                resource_type=ResourceType.IMAGE,
                overwrite=False,
            )

            document = self.vehicle_service.repo.create_image_document(
                db=db,
                vehicle_id=vehicle.id,
                filename=filename,
                url=result.url,
                file_size=result.file_size,
                mime_type=mime_type,
                uploaded_by=actor_id,
            )

            self.vehicle_service.repo.update(
                db=db,
                vehicle=vehicle,
                primary_image_document_id=document.id,
            )

        AuditService.record(
            db=db,
            entity_type=AuditEntityType.vehicle,
            entity_id=str(vehicle.id),
            action="vehicle_updated",
            description=f"Vehicle '{vehicle.vehicle_no}' updated.",
            actor_type=AuditActorType.employee,
            actor_employee_id=actor_id,
        )

        return vehicle