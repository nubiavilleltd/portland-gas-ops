from __future__ import annotations

from typing import List, Optional
import json

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    Query,
    UploadFile,
)
from sqlalchemy.orm import Session

from app.core.dependencies import (
    get_current_user,
    get_db,
)

from app.shared.dependencies import require_roles
from app.shared.models.user import User

from app.fleet.vehicles.enums import VehicleStatus

from app.fleet.vehicles.schema import (
    VehicleCreate,
    VehicleResponse,
    VehicleUpdate,
)

from app.fleet.vehicles.service import VehicleService

from app.fleet.vehicles.workflows.create_vehicle_workflow import (
    CreateVehicleWorkflow,
)

from app.fleet.vehicles.workflows.update_vehicle_workflow import (
    UpdateVehicleWorkflow,
)

router = APIRouter(
    # prefix="/vehicles",
    tags=["Vehicles"],
)

vehicle_service = VehicleService()

create_vehicle_workflow = CreateVehicleWorkflow()
update_vehicle_workflow = UpdateVehicleWorkflow()


# -------------------------------------------------------------------------
# Mapping
# -------------------------------------------------------------------------

def _to_response(vehicle) -> VehicleResponse:
    return VehicleResponse.model_validate(
        vehicle,
        from_attributes=True,
    )


# -------------------------------------------------------------------------
# Queries
# -------------------------------------------------------------------------

@router.get(
    "",
    response_model=List[VehicleResponse],
)
def list_vehicles(
    status: Optional[VehicleStatus] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    vehicles = vehicle_service.list(
        db=db,
        status=status,
    )

    return [
        _to_response(vehicle)
        for vehicle in vehicles
    ]


@router.get(
    "/available",
    response_model=List[VehicleResponse],
)
def list_available_vehicles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    vehicles = vehicle_service.list_available(db)

    return [
        _to_response(vehicle)
        for vehicle in vehicles
    ]


@router.get(
    "/{vehicle_id}",
    response_model=VehicleResponse,
)
def get_vehicle(
    vehicle_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    vehicle = vehicle_service.get_or_raise(
        db=db,
        vehicle_id=vehicle_id,
    )

    return _to_response(vehicle)

# -------------------------------------------------------------------------
# Create
# -------------------------------------------------------------------------

@router.post(
    "",
    response_model=VehicleResponse,
    status_code=201,
)
async def create_vehicle(
    data: str = Form(...),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "super_admin",
            "admin",
        )
    ),
):

    payload = VehicleCreate.model_validate(
        json.loads(data)
    )

    image_data = None

    if image:
        image_data = (
            await image.read(),
            image.filename,
            image.content_type,
            image.size or 0,
        )

    vehicle = create_vehicle_workflow.execute(
        db=db,
        data=payload,
        image=image_data,
        actor_id=current_user.employee.id,
    )

    db.commit()
    db.refresh(vehicle)

    return _to_response(vehicle)


# -------------------------------------------------------------------------
# Update
# -------------------------------------------------------------------------

@router.put(
    "/{vehicle_id}",
    response_model=VehicleResponse,
)
async def update_vehicle(
    vehicle_id: str,
    data: str = Form(...),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "super_admin",
            "admin",
        )
    ),
):

    payload = VehicleUpdate.model_validate(json.loads(data))

    image_data = None

    if image:
        image_data = (
            await image.read(),
            image.filename,
            image.content_type,
            image.size or 0,
        )

    vehicle = update_vehicle_workflow.execute(
        db=db,
        vehicle_id=vehicle_id,
        data=payload,
        image=image_data,
        actor_id=current_user.employee.id,
    )

    db.commit()
    db.refresh(vehicle)

    return _to_response(vehicle)