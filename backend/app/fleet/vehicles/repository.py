from __future__ import annotations

from typing import List, Optional

from app.shared.utils.number_generator import generate_entity_no
from sqlalchemy.orm import Session, joinedload

from app.fleet.vehicles.model import Vehicle
from app.shared.models.document import Document


class VehicleRepository:

    def get_by_id(
        self,
        db: Session,
        vehicle_id: str,
    ) -> Optional[Vehicle]:
        return (
            db.query(Vehicle)
            .options(joinedload(Vehicle.primary_image))
            .filter(Vehicle.id == vehicle_id)
            .first()
        )

    def get_by_vehicle_no(
        self,
        db: Session,
        vehicle_no: str,
    ) -> Optional[Vehicle]:
        return (
            db.query(Vehicle)
            .filter(Vehicle.vehicle_no == vehicle_no)
            .first()
        )

    def get_by_plate_number(
        self,
        db: Session,
        plate_number: str,
    ) -> Optional[Vehicle]:
        return (
            db.query(Vehicle)
            .filter(Vehicle.plate_number == plate_number)
            .first()
        )

    def list(
        self,
        db: Session,
        status: Optional[str] = None,
    ) -> List[Vehicle]:

        q = (
            db.query(Vehicle)
            .options(joinedload(Vehicle.primary_image))
        )

        if status:
            q = q.filter(Vehicle.status == status)

        return q.order_by(Vehicle.created_at.desc()).all()

    def create(
        self,
        db: Session,
        **fields,
    ) -> Vehicle:

        vehicle = Vehicle(**fields)
        db.add(vehicle)
        db.flush()
        return vehicle
    def update(
        self,
        db: Session,
        vehicle: Vehicle,
        **fields,
    ) -> Vehicle:

        for key, value in fields.items():
            setattr(vehicle, key, value)

        db.flush()

        return vehicle

    def save(
        self,
        db: Session,
        vehicle: Vehicle,
    ) -> Vehicle:

        db.flush()
        return vehicle

    def generate_vehicle_no(
        self,
        db: Session,
    ) -> str:

        return generate_entity_no(
            db=db,
            model=Vehicle,
            field_name="vehicle_no",
            prefix="VEH",
        )


    def create_image_document(
        self,
        db: Session,
        *,
        vehicle_id: str,
        filename: str,
        url: str,
        file_size: int,
        mime_type: str,
        uploaded_by: str | None,
    ) -> Document:

        document = Document(
            type="file",
            name=filename,
            category=f"vehicle:{vehicle_id}",
            file_path=url,
            file_size=file_size,
            mime_type=mime_type,
            uploaded_by=uploaded_by,
            parent_id=None,
        )

        db.add(document)
        db.flush()

        return document
