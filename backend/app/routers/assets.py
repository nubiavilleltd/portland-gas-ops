"""
Assets router — /api/assets

Endpoints:
  GET    /api/assets/                     → list assets (all staff)
  POST   /api/assets/                     → register asset (admin only, multipart)
  GET    /api/assets/{id}                 → asset detail
  PATCH  /api/assets/{id}                 → update asset (admin only, multipart)
  DELETE /api/assets/{id}                 → deactivate asset (admin only)

  GET    /api/assets/categories/          → list categories
  POST   /api/assets/categories/          → create category (admin only)
  PATCH  /api/assets/categories/{id}      → update category (admin only)
  DELETE /api/assets/categories/{id}      → delete category (admin only)

  GET    /api/assets/requests/            → list requests
  POST   /api/assets/requests/            → raise a request
  GET    /api/assets/requests/{id}        → request detail
  PATCH  /api/assets/requests/{id}/status → approve/reject/return (admin only)
"""

import json
from fastapi import APIRouter, Depends, Query, UploadFile, File, Form, HTTPException, status
from pydantic import ValidationError
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.asset import AssetStatus, AssetRequestStatus
from app.schemas.asset import (
    AssetResponse, AssetCreate, AssetUpdate,
    AssetCategoryCreate, AssetCategoryUpdate, AssetCategoryResponse,
    AssetRequestCreate, AssetRequestStatusUpdate, AssetRequestResponse, AssetRequestListItem,
    MaintenanceLogCreate, MaintenanceLogResponse,
)
from app.services import asset_service, cloudinary_service

router = APIRouter()

MAX_FILE_BYTES = 5 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/webp"}


def _require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ("admin", "super_admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user


# ── Categories ─────────────────────────────────────────────────────────────────

@router.get("/categories/", response_model=List[AssetCategoryResponse])
def list_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return asset_service.list_categories(db)


@router.post("/categories/", response_model=AssetCategoryResponse, status_code=201)
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


# ── Assets ─────────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[AssetResponse])
def list_assets(
    skip: int = Query(0, ge=0),
    limit: int = Query(40, ge=1, le=100),
    category_id: Optional[str] = Query(None),
    status_filter: Optional[AssetStatus] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assets = asset_service.list_assets(db, skip=skip, limit=limit, category_id=category_id,
                                       status_filter=status_filter, search=search)
    return [AssetResponse.from_orm_with_flags(a) for a in assets]


@router.post("/", response_model=AssetResponse, status_code=201)
async def create_asset(
    data: str = Form(...),
    image: Optional[UploadFile] = File(None),
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

    image_url = None
    if image and image.filename:
        if image.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(status_code=400, detail="Only PNG, JPG, and WebP images are allowed")
        img_bytes = await image.read()
        if len(img_bytes) > MAX_FILE_BYTES:
            raise HTTPException(status_code=400, detail="Image too large. Maximum size is 5 MB")
        image_url = cloudinary_service.upload_file(img_bytes, image.filename, folder="portland-gas/assets")

    asset = asset_service.create_asset(db, create_data, current_user, image_url=image_url)
    return AssetResponse.from_orm_with_flags(asset)


@router.get("/requests/", response_model=List[AssetRequestListItem])
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
        item.requester_name = r.requester.name if r.requester else None
        item.item_count = len(r.items)
        result.append(item)
    return result


@router.post("/requests/", response_model=AssetRequestResponse, status_code=201)
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


@router.get("/{asset_id}/maintenance-logs/", response_model=List[MaintenanceLogResponse])
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


@router.post("/{asset_id}/maintenance-logs/", response_model=MaintenanceLogResponse, status_code=201)
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
    return AssetResponse.from_orm_with_flags(asset)


@router.patch("/{asset_id}", response_model=AssetResponse)
async def update_asset(
    asset_id: str,
    data: str = Form(...),
    image: Optional[UploadFile] = File(None),
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

    image_url = None
    if image and image.filename:
        if image.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(status_code=400, detail="Only PNG, JPG, and WebP images are allowed")
        img_bytes = await image.read()
        if len(img_bytes) > MAX_FILE_BYTES:
            raise HTTPException(status_code=400, detail="Image too large. Maximum size is 5 MB")
        image_url = cloudinary_service.upload_file(img_bytes, image.filename, folder="portland-gas/assets")

    asset = asset_service.update_asset(db, asset_id, update_data, image_url=image_url)
    return AssetResponse.from_orm_with_flags(asset)


@router.delete("/{asset_id}", status_code=204)
def delete_asset(
    asset_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_admin),
):
    asset_service.delete_asset(db, asset_id)
