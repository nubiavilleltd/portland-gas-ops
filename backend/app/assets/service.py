"""
Asset management service.

Handles asset registry, categories, asset types, transfers, and asset requests.
Quantity tracking: available_quantity decreases on approval, restores on return/rejection.
Assignment logs are auto-created on: register, assign, transfer.
"""

import uuid
import logging
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import datetime, date
import calendar

from app.assets.models import (
    Asset, AssetCategory, AssetType,
    AssetRequest, AssetRequestItem,
    AssetStatus, AssetRequestStatus, AssetRequestType,
    AssetMaintenanceLog, MaintenanceType,
    AssetAssignmentLog, AssetAssignmentEventType,
)
from app.shared.models.user import User
from app.assets.schemas import (
    AssetCreate, AssetUpdate,
    AssetCategoryCreate, AssetCategoryUpdate,
    AssetTypeCreate,
    AssetRequestCreate, AssetRequestStatusUpdate,
    MaintenanceLogCreate,
    AssetTransferCreate,
)
from app.shared.utils.helpers import generate_reference

logger = logging.getLogger(__name__)


def _generate_asset_tag(prefix: str) -> str:
    """Generate a unique asset tag: PREFIX-XXXXXX (6 random hex chars)."""
    return f"{prefix.upper()}-{uuid.uuid4().hex[:6].upper()}"


def _compute_next_due(from_date: date, frequency_months: int) -> date:
    """Add frequency_months months to from_date, clamping to last day of month."""
    month = from_date.month - 1 + frequency_months
    year = from_date.year + month // 12
    month = month % 12 + 1
    day = min(from_date.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


def _log_assignment_event(
    db: Session,
    asset: Asset,
    event_type: AssetAssignmentEventType,
    performed_by_id: str,
    from_employee_id: str | None = None,
    from_employee_name: str | None = None,
    from_location: str | None = None,
    to_employee_id: str | None = None,
    to_employee_name: str | None = None,
    to_location: str | None = None,
    notes: str | None = None,
):
    log = AssetAssignmentLog(
        id=str(uuid.uuid4()),
        asset_id=asset.id,
        asset_tag=asset.asset_tag,
        event_type=event_type,
        from_employee_id=from_employee_id,
        from_employee_name=from_employee_name,
        from_location=from_location,
        to_employee_id=to_employee_id,
        to_employee_name=to_employee_name,
        to_location=to_location,
        notes=notes,
        performed_by=performed_by_id,
    )
    db.add(log)


# ── Asset Categories ───────────────────────────────────────────────────────────

def list_categories(db: Session):
    return db.query(AssetCategory).filter(AssetCategory.is_active == True).order_by(AssetCategory.name).all()


def get_category(db: Session, category_id: str) -> AssetCategory:
    cat = db.query(AssetCategory).filter(AssetCategory.id == category_id, AssetCategory.is_active == True).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return cat


def create_category(db: Session, data: AssetCategoryCreate) -> AssetCategory:
    existing = db.query(AssetCategory).filter(AssetCategory.name == data.name, AssetCategory.is_active == True).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A category with this name already exists")
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

    active_type_count = (
        db.query(AssetType)
        .filter(AssetType.category_id == category_id, AssetType.is_active == True)
        .count()
    )
    if active_type_count > 0:
        noun = "type" if active_type_count == 1 else "types"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot remove this category — it still has {active_type_count} active {noun}. Remove all types first.",
        )

    active_asset_count = (
        db.query(Asset)
        .filter(Asset.category_id == category_id, Asset.is_active == True)
        .count()
    )
    if active_asset_count > 0:
        noun = "asset" if active_asset_count == 1 else "assets"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot remove this category — {active_asset_count} active {noun} still belong to it.",
        )

    cat.is_active = False
    db.commit()


# ── Asset Types ────────────────────────────────────────────────────────────────

def list_asset_types(db: Session, category_id: str | None = None):
    query = db.query(AssetType).filter(AssetType.is_active == True)
    if category_id:
        query = query.filter(AssetType.category_id == category_id)
    return query.order_by(AssetType.name).all()


def create_asset_type(db: Session, data: AssetTypeCreate) -> AssetType:
    get_category(db, data.category_id)  # 404 if category doesn't exist
    existing = db.query(AssetType).filter(
        AssetType.category_id == data.category_id,
        AssetType.name == data.name,
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Asset type already exists in this category")
    asset_type = AssetType(**data.model_dump())
    db.add(asset_type)
    db.commit()
    db.refresh(asset_type)
    return asset_type


def delete_asset_type(db: Session, type_id: str):
    asset_type = db.query(AssetType).filter(AssetType.id == type_id, AssetType.is_active == True).first()
    if not asset_type:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset type not found")

    active_count = (
        db.query(Asset)
        .filter(Asset.asset_type_id == type_id, Asset.is_active == True)
        .count()
    )
    if active_count > 0:
        noun = "asset" if active_count == 1 else "assets"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot remove this type — {active_count} active {noun} still use it. Reassign or retire those assets first.",
        )

    asset_type.is_active = False
    db.commit()


# ── Assets ─────────────────────────────────────────────────────────────────────

def list_assets(
    db: Session,
    skip: int = 0,
    limit: int = 40,
    category_id: str | None = None,
    asset_type_id: str | None = None,
    status_filter: AssetStatus | None = None,
    search: str | None = None,
    employee_id: str | None = None,  # when set: return available OR assigned to this employee
    include_inactive: bool = False,
):
    from sqlalchemy import or_
    query = db.query(Asset)
    if not include_inactive:
        query = query.filter(Asset.is_active == True)
    if employee_id:
        query = query.filter(
            or_(Asset.status == AssetStatus.available, Asset.assigned_to == employee_id)
        )
    elif status_filter:
        query = query.filter(Asset.status == status_filter)
    if category_id:
        query = query.filter(Asset.category_id == category_id)
    if asset_type_id:
        query = query.filter(Asset.asset_type_id == asset_type_id)
    if search:
        query = query.filter(Asset.name.ilike(f"%{search}%"))
    return query.order_by(Asset.created_at.desc()).offset(skip).limit(limit).all()


def get_asset(db: Session, asset_id: str, include_inactive: bool = False) -> Asset:
    query = db.query(Asset).filter(Asset.id == asset_id)
    if not include_inactive:
        query = query.filter(Asset.is_active == True)
    asset = query.first()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    return asset


def create_asset(
    db: Session,
    data: AssetCreate,
    current_user: User,
    attachment_id: int | None = None,
    to_employee_name: str | None = None,
) -> Asset:
    if data.category_id:
        get_category(db, data.category_id)

    # Generate asset_tag if asset_type has a prefix
    asset_tag = None
    if data.asset_type_id:
        asset_type = db.query(AssetType).filter(AssetType.id == data.asset_type_id).first()
        if asset_type:
            asset_tag = _generate_asset_tag(asset_type.prefix)

    asset_data = data.model_dump()

    next_maintenance_due = None
    if data.maintenance_type and data.maintenance_frequency_months:
        base = data.purchase_date or date.today()
        next_maintenance_due = _compute_next_due(base, data.maintenance_frequency_months)

    # Auto-determine status: assigned if employee is set, otherwise available
    auto_status = AssetStatus.assigned if data.assigned_to else AssetStatus.available
    asset_data["status"] = auto_status

    asset = Asset(
        **asset_data,
        available_quantity=data.total_quantity,
        attachment_id=attachment_id,
        asset_tag=asset_tag,
        added_by=current_user.id,
        next_maintenance_due=next_maintenance_due,
    )
    db.add(asset)
    db.flush()  # get asset.id before logging

    # Generate QR code PNG and save to documents table
    try:
        import qrcode, io
        from app.shared.models.document import Document
        from app.shared.services import cloudinary_service
        import mimetypes

        from app.core.config import settings
        qr_url_data = f"{settings.FRONTEND_URL}/assets/{asset.id}"
        qr = qrcode.QRCode(box_size=8, border=2)
        qr.add_data(qr_url_data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        qr_bytes = buf.read()

        filename = f"{asset.asset_tag or asset.id}-qr.png"
        url = cloudinary_service.upload(
            qr_bytes,
            public_id=filename,
            folder="portland-gas/asset-qrcodes",
            resource_type="image",
            overwrite=False,
        )
        qr_doc = Document(
            type="file",
            name=filename,
            category="asset-qr",
            file_path=url,
            file_size=len(qr_bytes),
            mime_type="image/png",
        )
        db.add(qr_doc)
        db.flush()
        asset.qr_document_id = qr_doc.id
    except Exception:
        logger.exception("QR code generation failed for asset %s", asset.id)

    # Auto-log: registered
    _log_assignment_event(
        db, asset,
        event_type=AssetAssignmentEventType.registered,
        performed_by_id=current_user.id,
        to_location=data.location,
        notes="Asset registered",
    )

    # Auto-log: assigned (if assigned_to is set at creation)
    if data.assigned_to:
        _log_assignment_event(
            db, asset,
            event_type=AssetAssignmentEventType.assigned,
            performed_by_id=current_user.id,
            to_employee_id=data.assigned_to,
            to_employee_name=to_employee_name,
            to_location=data.location,
        )

    db.commit()
    db.refresh(asset)
    return asset


def update_asset(db: Session, asset_id: str, data: AssetUpdate, attachment_id: int | None = None, performed_by_id: str | None = None) -> Asset:
    asset = get_asset(db, asset_id)

    update_data = data.model_dump(exclude_unset=True)

    if "total_quantity" in update_data:
        diff = update_data["total_quantity"] - asset.total_quantity
        asset.available_quantity = max(0, asset.available_quantity + diff)

    # Detect status change before applying updates
    new_status = update_data.get("status")
    old_status = asset.status
    status_changed = new_status is not None and new_status != old_status

    for field, value in update_data.items():
        setattr(asset, field, value)

    if attachment_id is not None:
        asset.attachment_id = attachment_id

    freq = asset.maintenance_frequency_months
    if freq and asset.maintenance_type:
        if not asset.maintenance_logs:
            base = asset.purchase_date or date.today()
            asset.next_maintenance_due = _compute_next_due(base, freq)
    elif not asset.maintenance_type or not freq:
        asset.next_maintenance_due = None

    if status_changed and performed_by_id:
        old_label = old_status.value.replace("_", " ") if hasattr(old_status, "value") else str(old_status).replace("_", " ")
        new_label = new_status.value.replace("_", " ") if hasattr(new_status, "value") else str(new_status).replace("_", " ")
        _log_assignment_event(
            db, asset,
            event_type=AssetAssignmentEventType.status_changed,
            performed_by_id=performed_by_id,
            notes=f"Status changed from {old_label} to {new_label}",
        )

    db.commit()
    db.refresh(asset)
    return asset


def delete_asset(db: Session, asset_id: str, performed_by_id: str | None = None):
    asset = get_asset(db, asset_id)
    if asset.assigned_to:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate an asset that is currently assigned. Transfer or return it first.",
        )
    asset.is_active = False
    if performed_by_id:
        _log_assignment_event(
            db, asset,
            event_type=AssetAssignmentEventType.status_changed,
            performed_by_id=performed_by_id,
            notes="Asset deactivated",
        )
    db.commit()


# ── Transfer ───────────────────────────────────────────────────────────────────

def transfer_asset(
    db: Session,
    asset_id: str,
    data: AssetTransferCreate,
    current_user: User,
) -> Asset:
    asset = get_asset(db, asset_id)

    from_employee_id   = asset.assigned_to
    from_location      = asset.location

    # Resolve from_employee_name from the User/Employee table if possible
    from_employee_name = None
    if from_employee_id:
        from_user = db.query(User).filter(User.id == from_employee_id).first()
        if from_user:
            from_employee_name = from_user.name

    asset.assigned_to = data.to_employee_id
    asset.location    = data.to_location
    asset.status      = AssetStatus.assigned

    _log_assignment_event(
        db, asset,
        event_type=AssetAssignmentEventType.transferred,
        performed_by_id=current_user.id,
        from_employee_id=from_employee_id,
        from_employee_name=from_employee_name,
        from_location=from_location,
        to_employee_id=data.to_employee_id,
        to_employee_name=data.to_employee_name,
        to_location=data.to_location,
        notes=data.notes,
    )

    db.commit()
    db.refresh(asset)
    return asset


# ── Assignment Logs ────────────────────────────────────────────────────────────

def list_assignment_logs(db: Session, asset_id: str) -> list:
    get_asset(db, asset_id)  # 404 if not found
    return (
        db.query(AssetAssignmentLog)
        .filter(AssetAssignmentLog.asset_id == asset_id)
        .order_by(AssetAssignmentLog.performed_at.desc())
        .all()
    )


def list_all_assignment_logs(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    asset_id: str | None = None,
    event_type: AssetAssignmentEventType | None = None,
) -> list:
    query = db.query(AssetAssignmentLog)
    if asset_id:
        query = query.filter(AssetAssignmentLog.asset_id == asset_id)
    if event_type:
        query = query.filter(AssetAssignmentLog.event_type == event_type)
    return query.order_by(AssetAssignmentLog.performed_at.desc()).offset(skip).limit(limit).all()


# ── Asset Requests ─────────────────────────────────────────────────────────────

def check_asset_availability_for_approval(db: Session, request_id: str) -> None:
    """
    Re-validate availability for every item in the request at the moment of final approval.

    Called from the workflow engine's on_final_approval callback — BEFORE db.commit() —
    so raising HTTPException here aborts the approval and rolls back the transaction.
    This prevents approving a request when stock has been consumed by another request
    since submission.
    """
    req = db.query(AssetRequest).filter(
        AssetRequest.id == request_id,
        AssetRequest.is_active == True,  # noqa: E712
    ).first()
    if not req:
        return

    for item in req.items:
        if item.asset_type_id:
            available = db.query(Asset).filter(
                Asset.asset_type_id == item.asset_type_id,
                Asset.status == AssetStatus.available,
                Asset.is_active == True,  # noqa: E712
            ).count()
            if available < item.quantity:
                asset_type = db.query(AssetType).filter(AssetType.id == item.asset_type_id).first()
                name = asset_type.name if asset_type else "the requested item"
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Cannot approve: only {available} unit(s) of '{name}' are currently "
                        f"available, but {item.quantity} were requested. Stock may have been "
                        "allocated to another request. Deny this request and ask the requester "
                        "to resubmit when inventory is replenished."
                    ),
                )
        elif item.asset_id:
            asset_obj = db.query(Asset).filter(
                Asset.id == item.asset_id,
                Asset.is_active == True,  # noqa: E712
            ).first()
            if not asset_obj or asset_obj.status != AssetStatus.available:
                name = asset_obj.name if asset_obj else str(item.asset_id)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Cannot approve: asset '{name}' is no longer available. "
                        "Deny this request."
                    ),
                )


def list_requests(
    db: Session,
    current_user: User,
    skip: int = 0,
    limit: int = 20,
    status_filter: AssetRequestStatus | None = None,
):
    query = db.query(AssetRequest).filter(AssetRequest.is_active == True)

    if current_user.role not in ("admin", "super_admin"):
        query = query.filter(AssetRequest.requested_by == current_user.id)

    if status_filter:
        query = query.filter(AssetRequest.status == status_filter)

    return query.order_by(AssetRequest.created_at.desc()).offset(skip).limit(limit).all()


def _is_current_workflow_approver(db: Session, request_id: str, user_id: str) -> bool:
    """Return True if this user is the assigned approver on the current pending workflow step."""
    from app.employees.models import Employee
    from app.shared.models.approval import ApprovalRequest, ApprovalStepAssignment, ApprovalOverallStatus
    emp = db.query(Employee).filter(Employee.user_id == user_id).first()
    if not emp:
        return False
    return (
        db.query(ApprovalStepAssignment.id)
        .join(ApprovalRequest, ApprovalRequest.id == ApprovalStepAssignment.approval_request_id)
        .filter(
            ApprovalRequest.request_type == "asset",
            ApprovalRequest.request_id == request_id,
            ApprovalRequest.overall_status == ApprovalOverallStatus.pending,
            ApprovalStepAssignment.step_number == ApprovalRequest.current_step_number,
            ApprovalStepAssignment.assigned_to == emp.id,
        )
        .first() is not None
    )


def get_request(db: Session, request_id: str, current_user: User) -> AssetRequest:
    req = db.query(AssetRequest).filter(
        AssetRequest.id == request_id,
        AssetRequest.is_active == True,
    ).first()

    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")

    is_admin = current_user.role in ("admin", "super_admin")
    is_requester = req.requested_by == current_user.id
    is_approver = _is_current_workflow_approver(db, request_id, current_user.id)

    if not (is_admin or is_requester or is_approver):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return req


def create_request(db: Session, data: AssetRequestCreate, current_user: User) -> AssetRequest:
    if data.request_type == AssetRequestType.loan and not data.return_date:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Return date is required for loan requests",
        )

    # Validate each item
    for item_data in data.items:
        if item_data.asset_type_id:
            asset_type = db.query(AssetType).filter(AssetType.id == item_data.asset_type_id, AssetType.is_active == True).first()
            if not asset_type:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid asset type selected")
            available = db.query(Asset).filter(
                Asset.asset_type_id == item_data.asset_type_id,
                Asset.status == AssetStatus.available,
                Asset.is_active == True,
            ).count()
            if available < item_data.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Only {available} unit(s) of '{asset_type.name}' are available, but {item_data.quantity} were requested",
                )
        elif item_data.asset_id:
            asset = get_asset(db, item_data.asset_id)
            if asset.available_quantity < item_data.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient quantity for '{asset.name}'. Available: {asset.available_quantity}",
                )

    # Resolve the requester's Employee record — required by the workflow engine
    from app.employees.models import Employee
    requester_emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not requester_emp:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Your employee profile is not set up. Contact HR before submitting a request.",
        )

    req = AssetRequest(
        reference=generate_reference("AR", db, AssetRequest, AssetRequest.reference),
        request_type=data.request_type,
        purpose=data.purpose,
        return_date=data.return_date,
        requested_by=current_user.id,
    )
    db.add(req)
    db.flush()

    for item_data in data.items:
        item = AssetRequestItem(
            id=str(uuid.uuid4()),
            request_id=req.id,
            asset_type_id=item_data.asset_type_id,
            asset_id=item_data.asset_id,
            quantity=item_data.quantity,
            notes=item_data.notes,
        )
        db.add(item)

    # Start the approval workflow — emails fire automatically after commit
    from app.shared.services.workflow_engine import WorkflowEngine
    engine = WorkflowEngine(db)
    engine.start(
        request_type="asset",
        request_id=req.id,
        title=f"{req.reference} — {data.request_type.value.title()} Request",
        requester=requester_emp,
    )

    db.commit()
    db.refresh(req)
    return req


def update_request_status(
    db: Session,
    request_id: str,
    data: AssetRequestStatusUpdate,
    current_user: User,
) -> AssetRequest:
    req = db.query(AssetRequest).filter(
        AssetRequest.id == request_id,
        AssetRequest.is_active == True,
    ).first()

    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")

    is_admin = current_user.role in ("admin", "super_admin")
    is_requester = req.requested_by == current_user.id

    # Admin actions: approve, reject, allocate
    # Requester action: return (their own loan)
    if data.status == AssetRequestStatus.returned:
        if not is_requester:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the requester can mark a loan as returned")
    else:
        if not is_admin:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")

    VALID_TRANSITIONS = {
        AssetRequestStatus.pending:   [AssetRequestStatus.approved, AssetRequestStatus.rejected],
        AssetRequestStatus.approved:  [AssetRequestStatus.allocated, AssetRequestStatus.rejected],
        AssetRequestStatus.allocated: [AssetRequestStatus.returned],
        AssetRequestStatus.rejected:  [],
        AssetRequestStatus.returned:  [],
    }

    if data.status not in VALID_TRANSITIONS.get(req.status, []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transition from '{req.status.value}' to '{data.status.value}'",
        )

    # On return: find assets assigned to this requester via this request and free them
    if data.status == AssetRequestStatus.returned:
        from app.employees.models import Employee
        requester_emp = db.query(Employee).filter(Employee.user_id == req.requested_by).first()
        if requester_emp:
            for item in req.items:
                # If a specific asset was allocated to this item, free it directly
                if item.asset_id and not item.asset_type_id:
                    specific = db.query(Asset).filter(
                        Asset.id == item.asset_id,
                        Asset.assigned_to == requester_emp.id,
                        Asset.status == AssetStatus.assigned,
                    ).first()
                    if specific:
                        specific.status = AssetStatus.available
                        specific.assigned_to = None
                        _log_assignment_event(
                            db, specific,
                            event_type=AssetAssignmentEventType.returned,
                            performed_by_id=current_user.id,
                            from_employee_id=requester_emp.id,
                            from_employee_name=requester_emp.user.full_name if requester_emp.user else None,
                            notes=f"Returned to stock via request {req.reference}",
                        )
                    continue
                type_id = item.asset_type_id or (item.asset.asset_type_id if item.asset else None)
                if not type_id:
                    continue
                assigned_assets = db.query(Asset).filter(
                    Asset.asset_type_id == type_id,
                    Asset.assigned_to == requester_emp.id,
                    Asset.status == AssetStatus.assigned,
                ).limit(item.quantity).all()
                for asset in assigned_assets:
                    asset.status = AssetStatus.available
                    asset.assigned_to = None
                    _log_assignment_event(
                        db, asset,
                        event_type=AssetAssignmentEventType.returned,
                        performed_by_id=current_user.id,
                        from_employee_id=requester_emp.id,
                        from_employee_name=requester_emp.user.full_name if requester_emp.user else None,
                        notes=f"Returned to stock via request {req.reference}",
                    )

    req.status = data.status
    if data.rejection_reason:
        req.rejection_reason = data.rejection_reason
    if data.status == AssetRequestStatus.approved:
        req.approved_by = current_user.id
        req.approved_at = datetime.utcnow()
    if data.status == AssetRequestStatus.allocated:
        req.allocated_by = current_user.id
        req.allocated_at = datetime.utcnow()

    _req_id        = req.id
    _req_ref       = req.reference
    _requested_by  = req.requested_by
    _is_loan_return = data.status == AssetRequestStatus.returned

    db.commit()
    db.refresh(req)

    # Email the requester confirming their loan was returned
    if _is_loan_return:
        try:
            from app.shared.models.user import User as _User
            from app.shared.services import email_service as _email
            from app.core.config import settings as _settings
            requester_user = db.query(_User).filter(_User.id == _requested_by).first()
            if requester_user and requester_user.email:
                req_url = f"{_settings.FRONTEND_URL}/assets/requests/{_req_id}"
                _email.send_approval_result(
                    to_email=requester_user.email,
                    requester_name=requester_user.full_name or requester_user.email,
                    request_type_label="Asset",
                    request_title=_req_ref,
                    action="loan_returned",
                    comment=None,
                    action_url=req_url,
                    result_message_override=(
                        f"Your loan return for asset request {_req_ref} has been recorded. "
                        "Thank you for returning the asset(s). The item(s) are now back in the registry."
                    ),
                )
        except Exception:
            logger.exception("Failed to send loan return email for request %s", _req_id)

    return req


def allocate_request(db: Session, request_id: str, data, current_user: User) -> AssetRequest:
    from datetime import datetime
    req = db.query(AssetRequest).filter(AssetRequest.id == request_id, AssetRequest.is_active == True).first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    if req.status != AssetRequestStatus.approved:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only approved requests can be allocated")

    from app.employees.models import Employee
    requester_emp = db.query(Employee).filter(Employee.user_id == req.requested_by).first()

    for alloc in data.allocations:
        item = db.query(AssetRequestItem).filter(
            AssetRequestItem.id == alloc.item_id,
            AssetRequestItem.request_id == request_id,
        ).first()
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Request item {alloc.item_id} not found")
        if len(alloc.asset_ids) != item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Expected {item.quantity} asset(s) for item {alloc.item_id}, got {len(alloc.asset_ids)}",
            )
        for asset_id in alloc.asset_ids:
            asset = db.query(Asset).filter(Asset.id == asset_id, Asset.is_active == True).first()
            if not asset:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Asset {asset_id} not found")
            if asset.status != AssetStatus.available:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Asset {asset.asset_tag or asset_id} is not available")
            asset.status = AssetStatus.assigned
            if requester_emp:
                asset.assigned_to = requester_emp.id
            _log_assignment_event(
                db, asset,
                event_type=AssetAssignmentEventType.assigned,
                performed_by_id=current_user.id,
                to_employee_id=requester_emp.id if requester_emp else None,
                to_employee_name=req.requester.full_name if req.requester else None,
            )

        # Link the first allocated asset back to the item so the detail endpoint
        # can return it. For quantity > 1 the schema supports one asset per item;
        # the primary/first unit is sufficient to identify what was issued.
        if alloc.asset_ids:
            item.asset_id = alloc.asset_ids[0]

    req.status = AssetRequestStatus.allocated
    req.allocated_by = current_user.id
    req.allocated_at = datetime.utcnow()
    db.commit()
    db.refresh(req)

    # Email the requester confirming their assets have been allocated
    try:
        from app.shared.models.user import User as _User
        from app.shared.services import email_service as _email
        from app.core.config import settings as _settings
        requester_user = db.query(_User).filter(_User.id == req.requested_by).first()
        if requester_user and requester_user.email:
            req_url = f"{_settings.FRONTEND_URL}/assets/requests/{req.id}"
            _email.send_approval_result(
                to_email=requester_user.email,
                requester_name=requester_user.full_name or requester_user.email,
                request_type_label="Asset",
                request_title=req.reference,
                action="approved",
                comment=None,
                action_url=req_url,
                result_message_override=(
                    f"Your asset request {req.reference} has been approved and the assets "
                    "have been allocated to you. Please contact the Asset Management team "
                    "to arrange collection."
                ),
            )
    except Exception:
        logger.exception("Failed to send allocation email for request %s", req.id)

    return req


# ── Maintenance Logs ───────────────────────────────────────────────────────────

def list_maintenance_logs(db: Session, asset_id: str) -> list:
    get_asset(db, asset_id)
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
        id=str(uuid.uuid4()),
        asset_id=asset_id,
        performed_date=data.performed_date,
        maintenance_type=data.maintenance_type,
        technician=data.technician,
        cost=data.cost,
        notes=data.notes,
        logged_by=current_user.id,
    )
    db.add(log)

    if asset.maintenance_frequency_months:
        asset.next_maintenance_due = _compute_next_due(
            data.performed_date, asset.maintenance_frequency_months
        )

    if asset.status == AssetStatus.under_maintenance:
        asset.status = AssetStatus.available

    db.commit()
    db.refresh(log)
    return log


def update_maintenance_log(
    db: Session,
    log_id: str,
    data: MaintenanceLogCreate,
) -> AssetMaintenanceLog:
    log = db.query(AssetMaintenanceLog).filter(AssetMaintenanceLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Maintenance log not found")
    log.performed_date = data.performed_date
    log.maintenance_type = data.maintenance_type
    log.technician = data.technician
    log.cost = data.cost
    log.notes = data.notes
    db.commit()
    db.refresh(log)
    return log


def delete_maintenance_log(db: Session, log_id: str) -> None:
    log = db.query(AssetMaintenanceLog).filter(AssetMaintenanceLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Maintenance log not found")
    db.delete(log)
    db.commit()
