from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.fleet import FleetVehicle, MaintenanceRequest
from app.schemas.fleet import (
    FleetVehicleCreate,
    FleetVehicleUpdate,
    FleetVehicleResponse,
    MaintenanceCreate,
    MaintenanceUpdate,
    MaintenanceResponse,
)
from app.utils.helpers import generate_reference

router = APIRouter()


@router.get("/vehicles", response_model=List[FleetVehicleResponse])
def list_vehicles(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(FleetVehicle)
        .filter(FleetVehicle.is_active == True)
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.post("/vehicles", response_model=FleetVehicleResponse, status_code=status.HTTP_201_CREATED)
def create_vehicle(
    data: FleetVehicleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    vehicle = FleetVehicle(**data.dict())
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.get("/vehicles/{vehicle_id}", response_model=FleetVehicleResponse)
def get_vehicle(
    vehicle_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    vehicle = db.query(FleetVehicle).filter(FleetVehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle


@router.put("/vehicles/{vehicle_id}", response_model=FleetVehicleResponse)
def update_vehicle(
    vehicle_id: str,
    data: FleetVehicleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    vehicle = db.query(FleetVehicle).filter(FleetVehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    for field, value in data.dict(exclude_unset=True).items():
        setattr(vehicle, field, value)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.delete("/vehicles/{vehicle_id}")
def delete_vehicle(
    vehicle_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    vehicle = db.query(FleetVehicle).filter(FleetVehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    vehicle.is_active = False
    db.commit()
    return {"message": "Vehicle deactivated"}


# ─── Maintenance ─────────────────────────────────────────────

@router.get("/maintenance", response_model=List[MaintenanceResponse])
def list_maintenance(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(MaintenanceRequest)
        .filter(MaintenanceRequest.is_active == True)
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.post("/maintenance", response_model=MaintenanceResponse, status_code=status.HTTP_201_CREATED)
def create_maintenance(
    data: MaintenanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    request = MaintenanceRequest(
        **data.dict(),
        reference=generate_reference("MNT"),
        created_by=current_user.id,
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    return request


@router.put("/maintenance/{item_id}", response_model=MaintenanceResponse)
def update_maintenance(
    item_id: str,
    data: MaintenanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(MaintenanceRequest).filter(MaintenanceRequest.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Maintenance request not found")
    for field, value in data.dict(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item
