from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User

# TODO: Create Asset and MaintenanceSchedule models/schemas and replace stubs

router = APIRouter()


@router.get("/")
def list_assets(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # TODO: Query Asset model
    return {"items": [], "total": 0, "skip": skip, "limit": limit}


@router.get("/{item_id}")
def get_asset(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # TODO: Fetch single asset
    return {"id": item_id, "message": "Asset detail (stub)"}


@router.post("/")
def create_asset(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # TODO: Create new asset record
    return {"message": "Asset created (stub)"}


@router.put("/{item_id}")
def update_asset(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # TODO: Update asset
    return {"id": item_id, "message": "Asset updated (stub)"}


@router.delete("/{item_id}")
def delete_asset(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # TODO: Soft delete — set is_active = False
    return {"message": "Asset deactivated (stub)"}
