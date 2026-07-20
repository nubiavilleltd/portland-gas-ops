from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from fastapi import HTTPException, status
from typing import Optional, Tuple
from datetime import datetime
from decimal import Decimal
import uuid

from app.hr.models import LeaveTypeSetup, LeaveRequest, LeaveRequestStatus, LeaveBalance, Payslip, PayslipStatus
from app.hr.schemas import LeaveTypeCreate, LeaveTypeUpdate, LeaveRequestCreate, PayslipGenerate
from app.employees.models import Employee
from app.shared.services.workflow_engine import WorkflowEngine
from app.shared.models.approval import ApprovalRequest


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
    # An inactive leave type cannot be requested (frontend hides it, but guard
    # against stale caches / direct API calls).
    if not leave_type.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"'{leave_type.leave_type_name}' is not available for leave requests",
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
        request_type=payload.request_type,
        department=employee.department,
        job_title=employee.job_title,
        start_date=payload.start_date,
        end_date=payload.end_date,
        days=days,
        reason=payload.reason,
        status=LeaveRequestStatus.pending,
    )

    db.add(leave_request)
    db.flush()
    return leave_request


def get_all_leave_requests(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    employee_id: Optional[str] = None,
) -> Tuple[list[LeaveRequest], int]:
    """Get all leave requests with pagination and sorting."""
    query = db.query(LeaveRequest).options(
        joinedload(LeaveRequest.leave_type),
        joinedload(LeaveRequest.document),
    )

    # Optional filter: only a single employee's requests (used by the
    # per-employee balance/history view).
    if employee_id:
        query = query.filter(LeaveRequest.employee_id == employee_id)

    # Apply sorting
    sort_column = getattr(LeaveRequest, sort_by, LeaveRequest.created_at)
    if sort_order.lower() == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    total = query.count()
    leave_requests = query.offset(skip).limit(limit).all()

    return leave_requests, total


def get_next_actors(db: Session, request_ids: list[str]) -> dict[str, dict]:
    """
    For each leave request id that is still pending in the workflow, return the
    name of the assignee holding the current step and the step name.
    Returns { request_id: {"name": str, "step_name": str} }.
    """
    if not request_ids:
        return {}

    from app.shared.models.approval import (
        ApprovalStepAssignment,
        ApprovalOverallStatus,
        WorkflowStep,
    )
    from app.shared.models.user import User

    rows = (
        db.query(
            ApprovalRequest.request_id,
            User.first_name,
            User.last_name,
            WorkflowStep.step_name,
        )
        .join(
            ApprovalStepAssignment,
            and_(
                ApprovalStepAssignment.approval_request_id == ApprovalRequest.id,
                ApprovalStepAssignment.step_number == ApprovalRequest.current_step_number,
            ),
        )
        .join(Employee, Employee.id == ApprovalStepAssignment.assigned_to)
        .join(User, User.id == Employee.user_id)
        .join(
            WorkflowStep,
            and_(
                WorkflowStep.workflow_id == ApprovalRequest.workflow_id,
                WorkflowStep.step_number == ApprovalRequest.current_step_number,
            ),
        )
        .filter(
            ApprovalRequest.request_type == "leave_request",
            ApprovalRequest.request_id.in_(request_ids),
            ApprovalRequest.overall_status == ApprovalOverallStatus.pending,
        )
        .all()
    )

    result: dict[str, dict] = {}
    for row in rows:
        name = " ".join(p for p in [row.first_name, row.last_name] if p) or "—"
        result[row.request_id] = {"name": name, "step_name": row.step_name}
    return result


def get_leave_request_by_reference(db: Session, reference: str) -> LeaveRequest:
    """Get a single leave request by reference (e.g., LRQ-2026-0001)."""
    leave_request = db.query(LeaveRequest).options(
        joinedload(LeaveRequest.leave_type),
        joinedload(LeaveRequest.document),
    ).filter(LeaveRequest.reference == reference).first()

    if not leave_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Leave request with reference '{reference}' not found",
        )

    return leave_request


def get_leave_request_by_id(db: Session, leave_request_id: str) -> LeaveRequest:
    """
    Get a single leave request by its UUID (detail routes use id, matching
    Safety & Compliance). Falls back to reference lookup for backward compat.
    """
    leave_request = db.query(LeaveRequest).options(
        joinedload(LeaveRequest.leave_type),
        joinedload(LeaveRequest.document),
    ).filter(LeaveRequest.id == leave_request_id).first()

    if not leave_request:
        # Backward compat: older links / callers may still pass a reference
        leave_request = db.query(LeaveRequest).options(
            joinedload(LeaveRequest.leave_type),
            joinedload(LeaveRequest.document),
        ).filter(LeaveRequest.reference == leave_request_id).first()

    if not leave_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Leave request '{leave_request_id}' not found",
        )

    return leave_request


def submit_leave_request_for_approval(
    db: Session,
    leave_request_id: str,
) -> ApprovalRequest:
    """
    Submit a leave request for approval by entering the workflow engine.

    Creates ApprovalRequest and AllRequest entries.
    The requester must have already specified reliever_id on the leave request.

    Returns the ApprovalRequest created by the workflow engine.
    """
    leave_request = db.query(LeaveRequest).filter(LeaveRequest.id == leave_request_id).first()
    if not leave_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave request not found",
        )

    # Get requester's employee record (they must be an employee to submit)
    requester = db.query(Employee).filter(Employee.user_id == leave_request.requester_id).first()
    if not requester:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Requester must have an employee record",
        )

    # Build title for the approval tracking
    leave_type_name = leave_request.leave_type.leave_type_name if leave_request.leave_type else "Leave"
    title = f"{leave_type_name} - {leave_request.days} days"

    # Submit to workflow engine
    engine = WorkflowEngine(db)

    # The workflow step 1 expects requester_pick (reliever selection)
    # The reliever is already specified on the leave_request
    picked_approvers = {
        1: leave_request.reliever_id  # Step 1: Reliever approval
    } if leave_request.reliever_id else None

    approval_request = engine.start(
        request_type="leave_request",
        request_id=leave_request_id,
        title=title,
        requester=requester,
        picked_approvers=picked_approvers,
    )

    return approval_request


def resubmit_leave_request(
    db: Session,
    leave_request_id: str,
    payload: LeaveRequestCreate,
    current_user_id: str,
) -> LeaveRequest:
    """
    Edit and resubmit a RETURNED leave request. Updates the editable fields,
    resets status to pending, and restarts the approval workflow from step 1
    (a new attempt). Only the original requester may resubmit.
    """
    lr = get_leave_request_by_id(db, leave_request_id)

    if lr.status != LeaveRequestStatus.returned:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only returned requests can be resubmitted",
        )

    # requester_id stores the User id — only the requester can resubmit
    if lr.requester_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the requester can resubmit this request",
        )

    # Validate leave type
    leave_type = db.query(LeaveTypeSetup).filter(LeaveTypeSetup.id == payload.leave_type_id).first()
    if not leave_type:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave type not found")
    if not leave_type.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"'{leave_type.leave_type_name}' is not available for leave requests",
        )

    if payload.end_date < payload.start_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="End date must be after start date")

    employee = db.query(Employee).filter(Employee.id == payload.employee_id).first()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    # Apply edits
    lr.employee_id = payload.employee_id
    lr.leave_type_id = payload.leave_type_id
    lr.reliever_id = payload.reliever_id
    lr.request_type = payload.request_type
    lr.department = employee.department
    lr.job_title = employee.job_title
    lr.start_date = payload.start_date
    lr.end_date = payload.end_date
    lr.days = (payload.end_date - payload.start_date).days + 1
    lr.reason = payload.reason
    if payload.document_id is not None:
        lr.document_id = payload.document_id
    lr.status = LeaveRequestStatus.pending
    db.flush()

    # Restart the workflow (engine.start creates a new attempt from step 1)
    submit_leave_request_for_approval(db, lr.id)

    return lr


# ── LEAVE BALANCE ───────────────────────────────────────────────────────────

def apply_leave_balance_on_approval(db: Session, leave_request_id: str) -> LeaveBalance:
    """
    Record the leave-balance deduction for a fully-approved leave request.

    Called once from the workflow's on_final_approval callback (leave_request only),
    inside the approval transaction — the caller owns the commit. Get-or-creates the
    LeaveBalance row for (employee, leave_type, fiscal_year) and adds this request's
    days to `used`. Fiscal year is the leave's start_date year.
    """
    lr = get_leave_request_by_id(db, leave_request_id)
    fiscal_year = lr.start_date.year

    balance = (
        db.query(LeaveBalance)
        .filter(
            LeaveBalance.employee_id == lr.employee_id,
            LeaveBalance.leave_type_id == lr.leave_type_id,
            LeaveBalance.fiscal_year == fiscal_year,
        )
        .first()
    )

    if balance is None:
        # First deduction this year — snapshot the entitlement from the leave type.
        entitlement = lr.leave_type.entitlement_days if lr.leave_type else 0
        balance = LeaveBalance(
            employee_id=lr.employee_id,
            leave_type_id=lr.leave_type_id,
            fiscal_year=fiscal_year,
            entitlement=entitlement,
            used=0,
            remaining=entitlement,
        )
        db.add(balance)

    balance.used = (balance.used or 0) + lr.days
    # Keep an accurate remaining (may reach 0 / go negative on over-use); the UI
    # clamps the displayed value at 0.
    balance.remaining = balance.entitlement - balance.used
    db.flush()
    return balance


def get_my_leave_balances(db: Session, employee_id: str, fiscal_year: int) -> list[dict]:
    """
    Merged leave-balance view for an employee: every ACTIVE leave type with its
    recorded used/remaining for the fiscal year, defaulting to the full
    entitlement for types the employee hasn't drawn on yet.
    """
    leave_types = (
        db.query(LeaveTypeSetup)
        .filter(LeaveTypeSetup.is_active.is_(True))
        .all()
    )
    balances = (
        db.query(LeaveBalance)
        .filter(
            LeaveBalance.employee_id == employee_id,
            LeaveBalance.fiscal_year == fiscal_year,
        )
        .all()
    )
    by_type = {b.leave_type_id: b for b in balances}

    result = []
    for lt in leave_types:
        bal = by_type.get(lt.id)
        result.append({
            "leave_type_id":   lt.id,
            "leave_type_name": lt.leave_type_name,
            "fiscal_year":     fiscal_year,
            "entitlement":     bal.entitlement if bal else lt.entitlement_days,
            "used":            (bal.used or 0) if bal else 0,
            "remaining":       bal.remaining if bal else lt.entitlement_days,
        })
    return result


def get_all_leave_balances(
    db: Session,
    fiscal_year: int,
    skip: int = 0,
    limit: int = 500,
) -> list[dict]:
    """
    All-employees leave-balance view for a fiscal year — one entry per employee,
    each with every ACTIVE leave type (recorded used/remaining, or a full
    entitlement default). Batched into a constant number of queries (employees +
    leave types + balances), so it does not scale per-employee (no N+1).
    """
    employees = (
        db.query(Employee)
        .options(
            joinedload(Employee.user),
            joinedload(Employee.department_rel),
        )
        .order_by(Employee.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    if not employees:
        return []

    leave_types = (
        db.query(LeaveTypeSetup)
        .filter(LeaveTypeSetup.is_active.is_(True))
        .all()
    )

    emp_ids = [e.id for e in employees]
    balances = (
        db.query(LeaveBalance)
        .filter(
            LeaveBalance.fiscal_year == fiscal_year,
            LeaveBalance.employee_id.in_(emp_ids),
        )
        .all()
    )
    by_key = {(b.employee_id, b.leave_type_id): b for b in balances}

    result = []
    for emp in employees:
        user = emp.user
        name = (
            f"{(user.first_name or '').strip()} {(user.last_name or '').strip()}".strip()
            if user else ""
        ) or emp.employee_no

        emp_balances = []
        for lt in leave_types:
            bal = by_key.get((emp.id, lt.id))
            emp_balances.append({
                "leave_type_id":   lt.id,
                "leave_type_name": lt.leave_type_name,
                "fiscal_year":     fiscal_year,
                "entitlement":     bal.entitlement if bal else lt.entitlement_days,
                "used":            (bal.used or 0) if bal else 0,
                "remaining":       bal.remaining if bal else lt.entitlement_days,
            })

        result.append({
            "employee_id": emp.id,
            "name":        name,
            "job_title":   emp.job_title,
            "department":  emp.department,
            "fiscal_year": fiscal_year,
            "balances":    emp_balances,
        })
    return result


# ── PAYSLIPS ─────────────────────────────────────────────────────────────────

_MONTHS = ["January", "February", "March", "April", "May", "June",
           "July", "August", "September", "October", "November", "December"]


def _period_yyyymm(period: str, year: int) -> str:
    """'April 2026' -> '202604' (falls back to year+01 if the month can't be parsed)."""
    month_name = period.split()[0] if period else ""
    month = _MONTHS.index(month_name) + 1 if month_name in _MONTHS else 1
    return f"{year}{month:02d}"


def _next_payroll_ref(period: str, year: int) -> str:
    """Payroll run reference: PAY-YYYYMM-XXXXXX (one per generate run)."""
    return f"PAY-{_period_yyyymm(period, year)}-{uuid.uuid4().hex[:6].upper()}"


def generate_payslips(
    db: Session,
    payload: PayslipGenerate,
    prepared_by: Optional[str],
) -> list[Payslip]:
    """
    Generate payslips for the SELECTED employees for the given period. Snapshots
    each employee's salary components, computes net, and upserts per
    (employee, period, year) — regenerating simply updates the existing row.
    """
    period, year = payload.period, payload.year
    if not payload.employee_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Select at least one employee to generate payslips for",
        )

    existing_by_emp = {
        p.employee_id: p
        for p in db.query(Payslip)
        .filter(
            Payslip.period == period,
            Payslip.year == year,
            Payslip.employee_id.in_(payload.employee_ids),
        )
        .all()
    }

    employees = (
        db.query(Employee)
        .options(joinedload(Employee.user))
        .filter(Employee.id.in_(payload.employee_ids))
        .all()
    )

    payroll_ref = _next_payroll_ref(period, year)
    zero = Decimal("0")
    result: list[Payslip] = []

    for emp in employees:
        basic     = emp.basic_salary or zero
        housing   = emp.housing_allowance or zero
        transport = emp.transport_allowance or zero
        meal      = emp.meal_allowance or zero
        paye      = emp.paye or zero
        pension   = emp.pension or zero
        nhf       = emp.nhf or zero
        loan      = emp.loan_repayment or zero
        net = (basic + housing + transport + meal) - (paye + pension + nhf + loan)

        is_new = emp.id not in existing_by_emp
        slip = existing_by_emp.get(emp.id) or Payslip(employee_id=emp.id, period=period, year=year)
        slip.payroll_ref = payroll_ref
        slip.emp_code = emp.employee_no
        slip.department = emp.department
        slip.basic, slip.housing, slip.transport, slip.meal = basic, housing, transport, meal
        slip.paye, slip.pension, slip.nhf, slip.loan = paye, pension, nhf, loan
        slip.net = net
        slip.payroll_status = PayslipStatus.processed
        slip.prepared_by = prepared_by
        if is_new:
            db.add(slip)
        result.append(slip)

    db.flush()
    return result


def get_payslip_periods(db: Session, employee_id: Optional[str] = None) -> list[str]:
    """Distinct periods that actually have payslips — for the filter dropdown.

    When ``employee_id`` is given, scope to that employee's own payslips (self-service).
    """
    from sqlalchemy import func
    query = db.query(Payslip.period)
    if employee_id:
        query = query.filter(Payslip.employee_id == employee_id)
    rows = (
        query
        .group_by(Payslip.period)
        .order_by(func.max(Payslip.created_at).desc())
        .all()
    )
    return [r[0] for r in rows]


def get_all_payslips(
    db: Session,
    period: Optional[str] = None,
    search: Optional[str] = None,
    employee_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 200,
) -> Tuple[list[Payslip], int]:
    """List payslips (eager-load employee+user for the name), optional period + name filter.

    When ``employee_id`` is given, scope to that employee's own payslips (self-service).
    """
    from app.shared.models.user import User

    query = db.query(Payslip).options(
        joinedload(Payslip.employee).joinedload(Employee.user)
    )
    if employee_id:
        query = query.filter(Payslip.employee_id == employee_id)
    if period:
        query = query.filter(Payslip.period == period)
    if search:
        like = f"%{search}%"
        query = query.join(Employee, Employee.id == Payslip.employee_id).join(
            User, User.id == Employee.user_id
        ).filter(
            (User.first_name.ilike(like)) |
            (User.last_name.ilike(like)) |
            (Payslip.emp_code.ilike(like))
        )

    total = query.count()
    rows = query.order_by(Payslip.created_at.desc()).offset(skip).limit(limit).all()
    return rows, total


def get_payslip_by_id(db: Session, payslip_id: str) -> Payslip:
    slip = db.query(Payslip).options(
        joinedload(Payslip.employee).joinedload(Employee.user)
    ).filter(Payslip.id == payslip_id).first()
    if not slip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Payslip '{payslip_id}' not found")
    return slip
