from __future__ import annotations
from fastapi import APIRouter, Depends, Query, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import Optional, List
import json

from app.core.dependencies import get_db, get_current_user
from app.shared.dependencies import require_roles
from app.shared.models.user import User
from app.fleet.service import FleetService
from app.fleet.schema import (
    DriverCreate, DriverUpdate, DriverResponse,
    VehicleCreate, VehicleUpdate, VehicleResponse,
    TripCreate, AssignResourcesRequest, CancelTripRequest, CompleteTripRequest,
    AddOrderToTripRequest, TripResponse, TripListResponse,
)
from app.fleet.enums import DriverStatus, VehicleStatus, TripStatus
from app.audit.schema import AuditLogResponse, AuditEntityType
from app.audit.service import AuditService

router  = APIRouter()
service = FleetService()


def _driver_to_response(d) -> DriverResponse:
    data = DriverResponse.model_validate(d, from_attributes=True)
    data.full_name = d.employee.full_name if d.employee else ""
    data.email = d.employee.email if d.employee else ""
    data.phone_number = d.employee.phone if hasattr(d.employee, "phone") else ""
    data.profile_image_url = None  # resolved via documents lookup if needed
    return data


def _vehicle_to_response(v) -> VehicleResponse:
    data = VehicleResponse.model_validate(v)
    data.image_url = None
    return data


def _trip_to_response(t) -> TripResponse:
    data = TripResponse.model_validate(t)
    data.driver_name = t.driver.employee.full_name if (t.driver and t.driver.employee) else None
    data.vehicle_name = t.vehicle.name if t.vehicle else None
    data.order_ids = [to.order_id for to in t.trip_orders]
    return data


# ── Drivers ────────────────────────────────────────────────────────────────────

@router.get("/drivers", response_model=List[DriverResponse])
def list_drivers(
    status: Optional[DriverStatus] = Query(None),
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
):
    return [_driver_to_response(d) for d in service.list_drivers(db, status.value if status else None)]


@router.get("/drivers/available", response_model=List[DriverResponse])
def list_available_drivers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return [_driver_to_response(d) for d in service.list_available_drivers(db)]


@router.get("/drivers/{driver_id}", response_model=DriverResponse)
def get_driver(driver_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return _driver_to_response(service.get_driver_or_raise(db, driver_id))


@router.post("/drivers", response_model=DriverResponse, status_code=201)
async def create_driver(
    data: str = Form(...), profile_image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db), current_user: User = Depends(require_roles("super_admin", "admin")),
):
    payload = DriverCreate.model_validate(json.loads(data))

    # Create employee record first (driver extends employee)
    from app.employees.service import create_employee_for_driver  # assumes helper exists in employees domain
    employee = create_employee_for_driver(db, payload.full_name, payload.email, payload.phone_number, payload.address)

    profile_doc_id = None
    if profile_image:
        file_bytes = await profile_image.read()
        from app.shared.services.cloudinary_service import upload
        url = upload(file_bytes, public_id=f"driver-{employee.id}-profile", folder="portland-gas/drivers", resource_type="image")
        from app.shared.models.document import Document
        doc = Document(parent_type="employee", parent_id=employee.id, type="profile_photo", file_path=url)
        db.add(doc)
        db.flush()
        profile_doc_id = doc.id

    driver = service.create_driver(db, payload, employee_id=employee.id, profile_image_document_id=profile_doc_id)
    db.commit()
    db.refresh(driver)
    return _driver_to_response(driver)


@router.put("/drivers/{driver_id}", response_model=DriverResponse)
def update_driver(
    driver_id: int, data: DriverUpdate,
    db: Session = Depends(get_db), current_user: User = Depends(require_roles("super_admin", "admin")),
):
    driver = service.update_driver(db, driver_id, data)
    db.commit()
    db.refresh(driver)
    return _driver_to_response(driver)


# ── Vehicles ───────────────────────────────────────────────────────────────────

@router.get("/vehicles", response_model=List[VehicleResponse])
def list_vehicles(
    status: Optional[VehicleStatus] = Query(None),
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
):
    return [_vehicle_to_response(v) for v in service.list_vehicles(db, status.value if status else None)]


@router.get("/vehicles/available", response_model=List[VehicleResponse])
def list_available_vehicles(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return [_vehicle_to_response(v) for v in service.list_available_vehicles(db)]


@router.get("/vehicles/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return _vehicle_to_response(service.get_vehicle_or_raise(db, vehicle_id))


@router.post("/vehicles", response_model=VehicleResponse, status_code=201)
async def create_vehicle(
    data: str = Form(...), image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db), current_user: User = Depends(require_roles("super_admin", "admin")),
):
    payload = VehicleCreate.model_validate(json.loads(data))

    primary_doc_id = None
    if image:
        file_bytes = await image.read()
        from app.shared.services.cloudinary_service import upload
        url = upload(file_bytes, public_id=f"vehicle-{payload.plate_number}", folder="portland-gas/vehicles", resource_type="image")
        from app.shared.models.document import Document
        doc = Document(parent_type="vehicle", parent_id=None, type="vehicle_doc", file_path=url)
        db.add(doc)
        db.flush()
        primary_doc_id = doc.id

    vehicle = service.create_vehicle(db, payload, primary_image_document_id=primary_doc_id)
    db.commit()
    db.refresh(vehicle)
    return _vehicle_to_response(vehicle)


@router.put("/vehicles/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(
    vehicle_id: int, data: VehicleUpdate,
    db: Session = Depends(get_db), current_user: User = Depends(require_roles("super_admin", "admin")),
):
    vehicle = service.update_vehicle(db, vehicle_id, data)
    db.commit()
    db.refresh(vehicle)
    return _vehicle_to_response(vehicle)


# ── Trips ──────────────────────────────────────────────────────────────────────

@router.get("/trips", response_model=List[TripResponse])
def list_trips(
    status: Optional[TripStatus] = Query(None),
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
):
    return [_trip_to_response(t) for t in service.list_trips(db, status.value if status else None)]


@router.get("/trips/{trip_id}", response_model=TripResponse)
def get_trip(trip_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return _trip_to_response(service.get_trip_or_raise(db, trip_id))


@router.post("/trips", response_model=TripResponse, status_code=201)
def create_trip(
    data: TripCreate, db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("super_admin", "admin")),
):
    trip = service.create_trip(db, data, created_by=current_user.id)
    db.commit()
    db.refresh(trip)
    return _trip_to_response(trip)


@router.post("/trips/{trip_id}/assign", response_model=TripResponse)
def assign_resources(
    trip_id: int, data: AssignResourcesRequest, db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("super_admin", "admin")),
):
    trip = service.assign_resources(db, trip_id, data.driver_id, data.vehicle_id, actor_id=current_user.id)
    db.commit()
    db.refresh(trip)
    return _trip_to_response(trip)


@router.post("/trips/{trip_id}/mark-ready", response_model=TripResponse)
def mark_ready(
    trip_id: int, db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("super_admin", "admin")),
):
    trip = service.mark_ready(db, trip_id, actor_id=current_user.id)
    db.commit()
    db.refresh(trip)
    return _trip_to_response(trip)


@router.post("/trips/{trip_id}/dispatch", response_model=TripResponse)
def dispatch_trip(
    trip_id: int, db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("super_admin", "admin")),
):
    trip = service.dispatch(db, trip_id, actor_id=current_user.id)
    db.commit()
    db.refresh(trip)
    return _trip_to_response(trip)


@router.post("/trips/{trip_id}/start", response_model=TripResponse)
def start_trip(
    trip_id: int, db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    trip = service.start(db, trip_id, actor_id=current_user.id)
    db.commit()
    db.refresh(trip)
    return _trip_to_response(trip)


@router.post("/trips/{trip_id}/complete", response_model=TripResponse)
def complete_trip(
    trip_id: int, data: CompleteTripRequest, db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("super_admin", "admin")),
):
    trip = service.complete(db, trip_id, data.proof_notes, actor_id=current_user.id)
    db.commit()
    db.refresh(trip)
    return _trip_to_response(trip)


@router.post("/trips/{trip_id}/cancel", response_model=TripResponse)
def cancel_trip(
    trip_id: int, data: CancelTripRequest, db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("super_admin", "admin")),
):
    trip = service.cancel(db, trip_id, data.reason, actor_id=current_user.id)
    db.commit()
    db.refresh(trip)
    return _trip_to_response(trip)


@router.post("/trips/{trip_id}/orders", response_model=TripResponse)
def add_order_to_trip(
    trip_id: int, data: AddOrderToTripRequest, db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("super_admin", "admin")),
):
    trip = service.add_order(db, trip_id, data.order_id, actor_id=current_user.id)
    db.commit()
    db.refresh(trip)
    return _trip_to_response(trip)


@router.get("/trips/{trip_id}/audit", response_model=List[AuditLogResponse])
def get_trip_audit(
    trip_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
):
    return AuditService.get_by_entity(db, AuditEntityType.trip, str(trip_id))