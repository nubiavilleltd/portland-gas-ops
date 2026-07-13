"""
Assets router — /api/assets

Endpoints:
  GET    /api/assets/                              → list assets
  POST   /api/assets/                              → register asset (admin, multipart)
  GET    /api/assets/{id}                          → asset detail
  PATCH  /api/assets/{id}                          → update asset (admin, multipart)
  DELETE /api/assets/{id}                          → deactivate asset (admin)

  GET    /api/assets/categories/                   → list categories (with types)
  POST   /api/assets/categories/                   → create category (admin)
  PATCH  /api/assets/categories/{id}               → update category (admin)
  DELETE /api/assets/categories/{id}               → delete category (admin)

  GET    /api/assets/types/                        → list asset types
  POST   /api/assets/types/                        → create asset type (admin)
  DELETE /api/assets/types/{id}                    → delete asset type (admin)

  POST   /api/assets/{id}/transfer                 → transfer asset (admin)
  GET    /api/assets/{id}/assignment-logs/         → logs for one asset
  GET    /api/assets/assignment-logs/              → all assignment logs

  GET    /api/assets/{id}/maintenance-logs/        → maintenance logs for asset
  POST   /api/assets/{id}/maintenance-logs/        → add maintenance log (admin)

  GET    /api/assets/requests/                     → list requests
  POST   /api/assets/requests/                     → raise a request
  GET    /api/assets/requests/{id}                 → request detail
  PATCH  /api/assets/requests/{id}/status          → approve/reject/return (admin)
"""

import json
from fastapi import APIRouter, Depends, Query, UploadFile, File, Form, HTTPException, status
from pydantic import ValidationError
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.shared.dependencies import get_current_user
from app.shared.models.user import User
from app.assets.models import AssetStatus, AssetRequestStatus, AssetAssignmentEventType
from app.assets.schemas import (
    AssetResponse, AssetCreate, AssetUpdate,
    AssetCategoryCreate, AssetCategoryUpdate, AssetCategoryResponse, AssetCategoryWithTypesResponse,
    AssetTypeCreate, AssetTypeResponse,
    AssetTransferCreate,
    AssignmentLogResponse,
    AssetRequestCreate, AssetRequestStatusUpdate, AssetRequestResponse, AssetRequestListItem,
    AssetAllocationInput,
    MaintenanceLogCreate, MaintenanceLogResponse,
)
from app.assets import service as asset_service
from app.shared.services import cloudinary_service
from app.shared.models.document import Document
from app.employees.models import Employee

router = APIRouter()

MAX_FILE_BYTES = 5 * 1024 * 1024


def _resolve_assignee_names(db: Session, assets: list) -> dict:
    """Returns {employee_id: full_name} for all assigned_to IDs in the asset list."""
    ids = list({a.assigned_to for a in assets if a.assigned_to})
    if not ids:
        return {}
    rows = db.query(Employee).filter(Employee.id.in_(ids)).all()
    return {
        emp.id: emp.user.full_name if emp.user else None
        for emp in rows
    }


def _build_asset_response(asset, name_map: dict) -> AssetResponse:
    obj = AssetResponse.from_orm_with_flags(asset)
    obj.assigned_to_name = name_map.get(asset.assigned_to) if asset.assigned_to else None
    return obj
ALLOWED_FILE_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"}


def _require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ("admin", "super_admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user


# ── Categories ─────────────────────────────────────────────────────────────────

@router.get("/categories", response_model=List[AssetCategoryWithTypesResponse])
def list_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return asset_service.list_categories(db)


@router.post("/categories", response_model=AssetCategoryResponse, status_code=201)
def create_category(
    data: AssetCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_admin),
):
    return asset_service.create_category(db, data)


@router.patch("/categories/{category_id}", response_model=AssetCategoryResponse)
def update_category(
    category_id: str,
    data: AssetCategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_admin),
):
    return asset_service.update_category(db, category_id, data)


@router.delete("/categories/{category_id}", status_code=204)
def delete_category(
    category_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_admin),
):
    asset_service.delete_category(db, category_id)


# ── Asset Types ────────────────────────────────────────────────────────────────

@router.get("/types", response_model=List[AssetTypeResponse])
def list_asset_types(
    category_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return asset_service.list_asset_types(db, category_id=category_id)


@router.post("/types", response_model=AssetTypeResponse, status_code=201)
def create_asset_type(
    data: AssetTypeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_admin),
):
    return asset_service.create_asset_type(db, data)


@router.delete("/types/{type_id}", status_code=204)
def delete_asset_type(
    type_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_admin),
):
    asset_service.delete_asset_type(db, type_id)


# ── Assignment Logs (all assets) ───────────────────────────────────────────────
# NOTE: this route must come before /{asset_id} to avoid route collision

@router.get("/assignment-logs", response_model=List[AssignmentLogResponse])
def list_all_assignment_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    asset_id: Optional[str] = Query(None),
    event_type: Optional[AssetAssignmentEventType] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logs = asset_service.list_all_assignment_logs(db, skip=skip, limit=limit, asset_id=asset_id, event_type=event_type)
    result = []
    for log in logs:
        item = AssignmentLogResponse.model_validate(log)
        item.performed_by_name = log.performed_by_user.name if log.performed_by_user else None
        result.append(item)
    return result


# ── Assets ─────────────────────────────────────────────────────────────────────

@router.get("", response_model=List[AssetResponse])
def list_assets(
    skip: int = Query(0, ge=0),
    limit: int = Query(40, ge=1, le=100),
    category_id: Optional[str] = Query(None),
    asset_type_id: Optional[str] = Query(None),
    status_filter: Optional[AssetStatus] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    mine: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee_id = None
    if mine:
        emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        employee_id = emp.id if emp else None

    assets = asset_service.list_assets(
        db, skip=skip, limit=limit, category_id=category_id,
        asset_type_id=asset_type_id, status_filter=status_filter,
        search=search, employee_id=employee_id,
    )
    name_map = _resolve_assignee_names(db, assets)
    return [_build_asset_response(a, name_map) for a in assets]


@router.post("", response_model=AssetResponse, status_code=201)
async def create_asset(
    data: str = Form(...),
    file: Optional[UploadFile] = File(None),
    to_employee_name: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_admin),
):
    try:
        parsed = json.loads(data)
    except json.JSONDecodeError:
        raise HTTPException(status_code=422, detail="Invalid JSON in 'data' field")

    try:
        create_data = AssetCreate(**parsed)
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors(include_url=False))

    attachment_id = None
    if file and file.filename:
        if file.content_type not in ALLOWED_FILE_TYPES:
            raise HTTPException(status_code=400, detail="Only PNG, JPG, WebP images or PDF files are allowed")
        file_bytes = await file.read()
        if len(file_bytes) > MAX_FILE_BYTES:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 5 MB")
        import mimetypes
        mime_type = mimetypes.guess_type(file.filename)[0] or "application/octet-stream"
        resource_type = "raw" if mime_type == "application/pdf" else "auto"
        url = cloudinary_service.upload(file_bytes, public_id=file.filename, folder="portland-gas/assets", resource_type=resource_type, overwrite=False)
        doc = Document(type="file", name=file.filename, category="asset", file_path=url, file_size=len(file_bytes), mime_type=mime_type)
        db.add(doc)
        db.flush()
        attachment_id = doc.id

    asset = asset_service.create_asset(
        db, create_data, current_user,
        attachment_id=attachment_id,
        to_employee_name=to_employee_name,
    )
    return _build_asset_response(asset, _resolve_assignee_names(db, [asset]))


@router.get("/requests", response_model=List[AssetRequestListItem])
def list_requests(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status_filter: Optional[AssetRequestStatus] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    requests = asset_service.list_requests(db, current_user, skip=skip, limit=limit, status_filter=status_filter)
    result = []
    for r in requests:
        item = AssetRequestListItem.model_validate(r)
        item.requester_name = r.requester.full_name if r.requester else None
        item.item_count = len(r.items)
        result.append(item)
    return result


@router.post("/requests", response_model=AssetRequestResponse, status_code=201)
def create_request(
    data: AssetRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    req = asset_service.create_request(db, data, current_user)
    return AssetRequestResponse.from_orm_with_names(req)


@router.get("/requests/{request_id}", response_model=AssetRequestResponse)
def get_request(
    request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    req = asset_service.get_request(db, request_id, current_user)
    return AssetRequestResponse.from_orm_with_names(req)


@router.patch("/requests/{request_id}/status", response_model=AssetRequestResponse)
def update_request_status(
    request_id: str,
    data: AssetRequestStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    req = asset_service.update_request_status(db, request_id, data, current_user)
    return AssetRequestResponse.from_orm_with_names(req)


@router.post("/requests/{request_id}/allocate", response_model=AssetRequestResponse)
def allocate_request(
    request_id: str,
    data: AssetAllocationInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_admin),
):
    req = asset_service.allocate_request(db, request_id, data, current_user)
    return AssetRequestResponse.from_orm_with_names(req)


@router.post("/{asset_id}/transfer", response_model=AssetResponse)
def transfer_asset(
    asset_id: str,
    data: AssetTransferCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_admin),
):
    asset = asset_service.transfer_asset(db, asset_id, data, current_user)
    return _build_asset_response(asset, _resolve_assignee_names(db, [asset]))


@router.get("/{asset_id}/assignment-logs", response_model=List[AssignmentLogResponse])
def list_assignment_logs(
    asset_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logs = asset_service.list_assignment_logs(db, asset_id)
    result = []
    for log in logs:
        item = AssignmentLogResponse.model_validate(log)
        item.performed_by_name = log.performed_by_user.name if log.performed_by_user else None
        result.append(item)
    return result


@router.get("/{asset_id}/maintenance-logs", response_model=List[MaintenanceLogResponse])
def list_maintenance_logs(
    asset_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logs = asset_service.list_maintenance_logs(db, asset_id)
    result = []
    for log in logs:
        item = MaintenanceLogResponse.model_validate(log)
        item.logged_by_name = log.logged_by_user.name if log.logged_by_user else None
        result.append(item)
    return result


@router.post("/{asset_id}/maintenance-logs", response_model=MaintenanceLogResponse, status_code=201)
def create_maintenance_log(
    asset_id: str,
    data: MaintenanceLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_admin),
):
    log = asset_service.create_maintenance_log(db, asset_id, data, current_user)
    item = MaintenanceLogResponse.model_validate(log)
    item.logged_by_name = log.logged_by_user.name if log.logged_by_user else None
    return item


@router.get("/{asset_id}", response_model=AssetResponse)
def get_asset(
    asset_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    asset = asset_service.get_asset(db, asset_id)
    return _build_asset_response(asset, _resolve_assignee_names(db, [asset]))


@router.patch("/{asset_id}", response_model=AssetResponse)
async def update_asset(
    asset_id: str,
    data: str = Form(...),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_admin),
):
    try:
        parsed = json.loads(data)
    except json.JSONDecodeError:
        raise HTTPException(status_code=422, detail="Invalid JSON in 'data' field")

    try:
        update_data = AssetUpdate(**parsed)
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors(include_url=False))

    attachment_id = None
    if file and file.filename:
        if file.content_type not in ALLOWED_FILE_TYPES:
            raise HTTPException(status_code=400, detail="Only PNG, JPG, WebP images or PDF files are allowed")
        file_bytes = await file.read()
        if len(file_bytes) > MAX_FILE_BYTES:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 5 MB")
        import mimetypes
        mime_type = mimetypes.guess_type(file.filename)[0] or "application/octet-stream"
        resource_type = "raw" if mime_type == "application/pdf" else "auto"
        url = cloudinary_service.upload(file_bytes, public_id=file.filename, folder="portland-gas/assets", resource_type=resource_type, overwrite=False)
        doc = Document(type="file", name=file.filename, category="asset", file_path=url, file_size=len(file_bytes), mime_type=mime_type)
        db.add(doc)
        db.flush()
        attachment_id = doc.id

    asset = asset_service.update_asset(db, asset_id, update_data, attachment_id=attachment_id)
    return _build_asset_response(asset, _resolve_assignee_names(db, [asset]))


@router.delete("/{asset_id}", status_code=204)
def delete_asset(
    asset_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_admin),
):
    asset_service.delete_asset(db, asset_id)
