"""
Asset management service.

Handles asset registry, categories, and asset requests (loan/requisition).
Quantity tracking: available_quantity decreases on approval, restores on return/rejection.
"""

import logging
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import datetime, date
import calendar

from app.assets.models import (
    Asset, AssetCategory, AssetRequest, AssetRequestItem,
    AssetStatus, AssetRequestStatus, AssetRequestType,
    AssetMaintenanceLog, MaintenanceType,
)
from app.shared.models.user import User
from app.assets.schemas import (
    AssetCreate, AssetUpdate,
    AssetCategoryCreate, AssetCategoryUpdate,
    AssetRequestCreate, AssetRequestStatusUpdate,
    MaintenanceLogCreate,
)
from app.shared.utils.helpers import generate_reference

logger = logging.getLogger(__name__)


def _compute_next_due(from_date: date, frequency_months: int) -> date:
    """Add frequency_months months to from_date, clamping to last day of month."""
    month = from_date.month - 1 + frequency_months
    year = from_date.year + month // 12
    month = month % 12 + 1
    day = min(from_date.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


# ── Asset Categories ───────────────────────────────────────────────────────────

def list_categories(db: Session):
    return db.query(AssetCategory).filter(AssetCategory.is_active == True).order_by(AssetCategory.name).all()


def get_category(db: Session, category_id: str) -> AssetCategory:
    cat = db.query(AssetCategory).filter(AssetCategory.id == category_id, AssetCategory.is_active == True).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return cat


def create_category(db: Session, data: AssetCategoryCreate) -> AssetCategory:
    existing = db.query(AssetCategory).filter(AssetCategory.name == data.name).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category name already exists")
    cat = AssetCategory(**data.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


def update_category(db: Session, category_id: str, data: AssetCategoryUpdate) -> AssetCategory:
    cat = get_category(db, category_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(cat, field, value)
    db.commit()
    db.refresh(cat)
    return cat


def delete_category(db: Session, category_id: str):
    cat = get_category(db, category_id)
    cat.is_active = False
    db.commit()


# ── Assets ─────────────────────────────────────────────────────────────────────

def list_assets(
    db: Session,
    skip: int = 0,
    limit: int = 40,
    category_id: str | None = None,
    status_filter: AssetStatus | None = None,
    search: str | None = None,
):
    query = db.query(Asset).filter(Asset.is_active == True)
    if category_id:
        query = query.filter(Asset.category_id == category_id)
    if status_filter:
        query = query.filter(Asset.status == status_filter)
    if search:
        query = query.filter(Asset.name.ilike(f"%{search}%"))
    return query.order_by(Asset.created_at.desc()).offset(skip).limit(limit).all()


def get_asset(db: Session, asset_id: str) -> Asset:
    asset = db.query(Asset).filter(Asset.id == asset_id, Asset.is_active == True).first()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    return asset


def create_asset(db: Session, data: AssetCreate, current_user: User, image_url: str | None = None) -> Asset:
    if data.category_id:
        get_category(db, data.category_id)

    asset_data = data.model_dump()

    # Compute initial next_maintenance_due if schedule is provided
    next_maintenance_due = None
    if data.maintenance_type and data.maintenance_frequency_months:
        base = data.purchase_date or date.today()
        next_maintenance_due = _compute_next_due(base, data.maintenance_frequency_months)

    asset = Asset(
        **asset_data,
        available_quantity=data.total_quantity,
        image_url=image_url,
        added_by=current_user.id,
        next_maintenance_due=next_maintenance_due,
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset


def update_asset(db: Session, asset_id: str, data: AssetUpdate, image_url: str | None = None) -> Asset:
    asset = get_asset(db, asset_id)

    update_data = data.model_dump(exclude_unset=True)

    # If total_quantity is being updated, adjust available_quantity proportionally
    if "total_quantity" in update_data:
        diff = update_data["total_quantity"] - asset.total_quantity
        asset.available_quantity = max(0, asset.available_quantity + diff)

    for field, value in update_data.items():
        setattr(asset, field, value)

    if image_url:
        asset.image_url = image_url

    # Recalculate next_maintenance_due if schedule was updated
    freq = asset.maintenance_frequency_months
    if freq and asset.maintenance_type:
        # Only recalculate if no logs exist yet (don't override log-set dates)
        if not asset.maintenance_logs:
            base = asset.purchase_date or date.today()
            asset.next_maintenance_due = _compute_next_due(base, freq)
    elif not asset.maintenance_type or not freq:
        asset.next_maintenance_due = None

    db.commit()
    db.refresh(asset)
    return asset


def delete_asset(db: Session, asset_id: str):
    asset = get_asset(db, asset_id)
    asset.is_active = False
    db.commit()


# ── Asset Requests ─────────────────────────────────────────────────────────────

def list_requests(
    db: Session,
    current_user: User,
    skip: int = 0,
    limit: int = 20,
    status_filter: AssetRequestStatus | None = None,
):
    query = db.query(AssetRequest).filter(AssetRequest.is_active == True)

    # Staff see only their own requests
    if current_user.role not in ("admin", "super_admin"):
        query = query.filter(AssetRequest.requested_by == current_user.id)

    if status_filter:
        query = query.filter(AssetRequest.status == status_filter)

    return query.order_by(AssetRequest.created_at.desc()).offset(skip).limit(limit).all()


def get_request(db: Session, request_id: str, current_user: User) -> AssetRequest:
    req = db.query(AssetRequest).filter(
        AssetRequest.id == request_id,
        AssetRequest.is_active == True,
    ).first()

    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")

    if current_user.role not in ("admin", "super_admin") and req.requested_by != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return req


def create_request(db: Session, data: AssetRequestCreate, current_user: User) -> AssetRequest:
    # Validate return_date required for loans
    if data.request_type == AssetRequestType.loan and not data.return_date:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Return date is required for loan requests",
        )

    # Validate each item: asset exists + sufficient quantity
    for item_data in data.items:
        asset = get_asset(db, item_data.asset_id)
        if asset.available_quantity < item_data.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient quantity for '{asset.name}'. Available: {asset.available_quantity}",
            )

    req = AssetRequest(
        reference=generate_reference("AR"),
        request_type=data.request_type,
        purpose=data.purpose,
        return_date=data.return_date,
        requested_by=current_user.id,
    )
    db.add(req)
    db.flush()

    for item_data in data.items:
        item = AssetRequestItem(
            request_id=req.id,
            **item_data.model_dump(),
        )
        db.add(item)

    db.commit()
    db.refresh(req)
    return req


def update_request_status(
    db: Session,
    request_id: str,
    data: AssetRequestStatusUpdate,
    current_user: User,
) -> AssetRequest:
    if current_user.role not in ("admin", "super_admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")

    req = db.query(AssetRequest).filter(
        AssetRequest.id == request_id,
        AssetRequest.is_active == True,
    ).first()

    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")

    VALID_TRANSITIONS = {
        AssetRequestStatus.pending:  [AssetRequestStatus.approved, AssetRequestStatus.rejected],
        AssetRequestStatus.approved: [AssetRequestStatus.returned],
        AssetRequestStatus.rejected: [],
        AssetRequestStatus.returned: [],
    }

    if data.status not in VALID_TRANSITIONS.get(req.status, []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transition from '{req.status.value}' to '{data.status.value}'",
        )

    # On approval: reduce available_quantity for each item
    if data.status == AssetRequestStatus.approved:
        for item in req.items:
            asset = db.query(Asset).filter(Asset.id == item.asset_id).first()
            if asset:
                if asset.available_quantity < item.quantity:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Insufficient quantity for '{asset.name}' at time of approval",
                    )
                asset.available_quantity -= item.quantity
                # Update status to in_use if no quantity left
                if asset.available_quantity == 0:
                    asset.status = AssetStatus.in_use

    # On return: restore available_quantity (loans only)
    if data.status == AssetRequestStatus.returned:
        for item in req.items:
            asset = db.query(Asset).filter(Asset.id == item.asset_id).first()
            if asset:
                asset.available_quantity = min(
                    asset.total_quantity,
                    asset.available_quantity + item.quantity,
                )
                if asset.available_quantity > 0 and asset.status == AssetStatus.in_use:
                    asset.status = AssetStatus.available

    req.status = data.status
    if data.rejection_reason:
        req.rejection_reason = data.rejection_reason
    if data.status == AssetRequestStatus.approved:
        req.approved_by = current_user.id
        req.approved_at = datetime.utcnow()

    db.commit()
    db.refresh(req)
    return req


# ── Maintenance Logs ───────────────────────────────────────────────────────────

def list_maintenance_logs(db: Session, asset_id: str) -> list:
    get_asset(db, asset_id)  # 404 if not found
    return (
        db.query(AssetMaintenanceLog)
        .filter(AssetMaintenanceLog.asset_id == asset_id)
        .order_by(AssetMaintenanceLog.performed_date.desc())
        .all()
    )


def create_maintenance_log(
    db: Session,
    asset_id: str,
    data: MaintenanceLogCreate,
    current_user: User,
) -> AssetMaintenanceLog:
    asset = get_asset(db, asset_id)

    log = AssetMaintenanceLog(
        id=str(__import__('uuid').uuid4()),
        asset_id=asset_id,
        performed_date=data.performed_date,
        maintenance_type=data.maintenance_type,
        technician=data.technician,
        cost=data.cost,
        notes=data.notes,
        logged_by=current_user.id,
    )
    db.add(log)

    # Update asset's next_maintenance_due based on this log
    if asset.maintenance_frequency_months:
        asset.next_maintenance_due = _compute_next_due(
            data.performed_date, asset.maintenance_frequency_months
        )

    # If asset was under_maintenance, mark it available again
    if asset.status == AssetStatus.under_maintenance:
        asset.status = AssetStatus.available

    db.commit()
    db.refresh(log)
    return log
