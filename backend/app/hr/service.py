from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from fastapi import HTTPException, status
from typing import Optional, Tuple
from datetime import datetime

from app.hr.models import LeaveTypeSetup, LeaveRequest, LeaveRequestStatus
from app.hr.schemas import LeaveTypeCreate, LeaveTypeUpdate, LeaveRequestCreate
from app.employees.models import Employee


# ── CREATE ──────────────────────────────────────────────────────────────────

def create_leave_type(
    db: Session,
    payload: LeaveTypeCreate,
) -> LeaveTypeSetup:
    """Create a new leave type with validation."""
    # Check if leave type name already exists
    existing = db.query(LeaveTypeSetup).filter(
        LeaveTypeSetup.leave_type_name == payload.leave_type_name
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Leave type '{payload.leave_type_name}' already exists",
        )

    # Create new instance
    leave_type = LeaveTypeSetup(
        leave_type_name=payload.leave_type_name,
        entitlement_days=payload.entitlement_days,
        description=payload.description,
        is_active=payload.is_active,
    )

    db.add(leave_type)
    db.flush()
    return leave_type


# ── READ (ALL) ──────────────────────────────────────────────────────────────

def get_all_leave_types(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = None,
) -> Tuple[list[LeaveTypeSetup], int]:
    """Get all leave types with optional filtering and pagination."""
    query = db.query(LeaveTypeSetup)

    # Filter by is_active if provided
    if is_active is not None:
        query = query.filter(LeaveTypeSetup.is_active == is_active)

    # Count total before pagination
    total = query.count()

    # Apply pagination
    leave_types = query.offset(skip).limit(limit).all()

    return leave_types, total


# ── READ (ONE) ──────────────────────────────────────────────────────────────

def get_leave_type(db: Session, leave_type_id: int) -> LeaveTypeSetup:
    """Get a single leave type by ID."""
    leave_type = db.query(LeaveTypeSetup).filter(
        LeaveTypeSetup.id == leave_type_id
    ).first()

    if not leave_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Leave type with ID {leave_type_id} not found",
        )

    return leave_type


# ── UPDATE ──────────────────────────────────────────────────────────────────

def update_leave_type(
    db: Session,
    leave_type_id: int,
    payload: LeaveTypeUpdate,
) -> LeaveTypeSetup:
    """Update an existing leave type."""
    leave_type = get_leave_type(db, leave_type_id)

    # Check if name is being changed and already exists elsewhere
    if payload.leave_type_name:
        existing = db.query(LeaveTypeSetup).filter(
            and_(
                LeaveTypeSetup.leave_type_name == payload.leave_type_name,
                LeaveTypeSetup.id != leave_type_id,  # Don't check against itself
            )
        ).first()

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Leave type '{payload.leave_type_name}' already exists",
            )

    # Update only provided fields
    update_data = payload.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(leave_type, field, value)

    db.add(leave_type)
    db.flush()
    return leave_type


# ── DEACTIVATE (Soft Delete) ────────────────────────────────────────────────

def deactivate_leave_type(
    db: Session,
    leave_type_id: int,
) -> LeaveTypeSetup:
    """Deactivate a leave type (soft delete)."""
    leave_type = get_leave_type(db, leave_type_id)

    leave_type.is_active = False
    db.add(leave_type)
    db.flush()
    return leave_type


# ── REACTIVATE ──────────────────────────────────────────────────────────────

def reactivate_leave_type(
    db: Session,
    leave_type_id: int,
) -> LeaveTypeSetup:
    """Reactivate a deactivated leave type."""
    leave_type = get_leave_type(db, leave_type_id)

    leave_type.is_active = True
    db.add(leave_type)
    db.flush()
    return leave_type


# ── LEAVE REQUEST CRUD ──────────────────────────────────────────────────────

def _next_leave_request_reference(db: Session) -> str:
    """Generate next leave request reference: LRQ-2026-0001"""
    year = datetime.now().year
    pattern = f"LRQ-{year}-%"
    last = db.query(LeaveRequest.reference).filter(
        LeaveRequest.reference.like(pattern)
    ).order_by(LeaveRequest.reference.desc()).first()

    num = 1
    if last:
        try:
            num = int(last[0].split("-")[-1]) + 1
        except (ValueError, IndexError):
            pass

    return f"LRQ-{year}-{num:04d}"


def create_leave_request(
    db: Session,
    payload: LeaveRequestCreate,
    requester_id: str,
) -> LeaveRequest:
    """Create a new leave request in draft status."""
    # Validate employee exists
    employee = db.query(Employee).filter(Employee.id == payload.employee_id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee not found",
        )

    # Validate leave type exists
    leave_type = db.query(LeaveTypeSetup).filter(
        LeaveTypeSetup.id == payload.leave_type_id
    ).first()
    if not leave_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Leave type not found",
        )

    # Validate dates
    if payload.end_date < payload.start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End date must be after start date",
        )

    # Calculate days (inclusive, calendar days)
    delta = payload.end_date - payload.start_date
    days = delta.days + 1

    # Generate reference
    reference = _next_leave_request_reference(db)

    # Create request
    leave_request = LeaveRequest(
        reference=reference,
        requester_id=requester_id,
        employee_id=payload.employee_id,
        leave_type_id=payload.leave_type_id,
        reliever_id=payload.reliever_id,
        document_id=payload.document_id,
        department=employee.department.value if employee.department else None,
        job_title=employee.job_title,
        start_date=payload.start_date,
        end_date=payload.end_date,
        days=days,
        reason=payload.reason,
        status=LeaveRequestStatus.awaiting_approval,
    )

    db.add(leave_request)
    db.flush()
    return leave_request


def get_all_leave_requests(
    db: Session,
    skip: int = 0,
    limit: int = 100,
) -> Tuple[list[LeaveRequest], int]:
    """Get all leave requests with pagination."""
    query = db.query(LeaveRequest).options(
        joinedload(LeaveRequest.employee).joinedload(Employee.user),
        joinedload(LeaveRequest.leave_type),
        joinedload(LeaveRequest.reliever),
    )

    total = query.count()
    leave_requests = query.offset(skip).limit(limit).all()

    return leave_requests, total


def get_leave_request_by_reference(db: Session, reference: str) -> LeaveRequest:
    """Get a single leave request by reference (e.g., LRQ-2026-0001)."""
    leave_request = db.query(LeaveRequest).options(
        joinedload(LeaveRequest.employee).joinedload(Employee.user),
        joinedload(LeaveRequest.leave_type),
        joinedload(LeaveRequest.reliever),
    ).filter(LeaveRequest.reference == reference).first()

    if not leave_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Leave request with reference '{reference}' not found",
        )

    return leave_request
