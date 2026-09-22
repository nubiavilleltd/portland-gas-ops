from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, func
from fastapi import HTTPException, status
from typing import Optional, Tuple
from datetime import datetime, date, timedelta
from decimal import Decimal
import uuid

from app.hr.models import (
    LeaveTypeSetup, LeaveRequest, LeaveRequestStatus, LeaveBalance, Payslip, PayslipStatus,
    EmployeeLoan, LoanRepaymentCharge, LoanStatus, LoanMode,
    TaxConfig, TaxBand,
)
from app.hr.tax import Earnings, compute_statutory_deductions
from app.hr.schemas import (
    LeaveTypeCreate, LeaveTypeUpdate, LeaveRequestCreate, PayslipGenerate,
    LoanCreate, LoanUpdate,
)
from app.employees.models import Employee
from app.shared.services.workflow_engine import WorkflowEngine
from app.shared.models.approval import ApprovalRequest, ApprovalOverallStatus


def _business_days(start: date, end: date) -> int:
    """Working days (Mon–Fri) from start to end inclusive; weekends (Sat/Sun) excluded.
    Mirrors the frontend leave-day count so the previewed number equals what is deducted."""
    if not start or not end or end < start:
        return 0
    total = 0
    d = start
    while d <= end:
        if d.weekday() < 5:   # 0=Mon .. 4=Fri; 5,6 = Sat,Sun
            total += 1
        d += timedelta(days=1)
    return total


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
        is_uncapped=payload.is_uncapped,
        open_ended=payload.open_ended,
        notice_days=payload.notice_days,
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


def _reliever_from_picks(picked_approvers: dict[int, str] | None) -> str | None:
    """
    The reliever is the approver chosen for the workflow's requester_pick step.
    Leave has a single requester_pick step, so take the lowest step number.
    """
    if not picked_approvers:
        return None
    first_step = min(picked_approvers)
    return picked_approvers[first_step]


def _requester_pick_steps(db: Session, request_type: str, workspace_id: str) -> list[int]:
    """
    Step numbers of the requester_pick steps on the workflow assigned to
    request_type. Used so we never hard-code a step number — an admin can
    reorder steps without breaking submission.
    """
    from app.shared.models.approval import (
        WorkflowAssignment, WorkflowStep, AssigneeType,
    )

    assignment = (
        db.query(WorkflowAssignment)
        .filter(
            WorkflowAssignment.request_type == request_type,
            WorkflowAssignment.workspace_id == workspace_id,
        )
        .first()
    )
    if not assignment:
        return []

    steps = (
        db.query(WorkflowStep)
        .filter(
            WorkflowStep.workflow_id == assignment.workflow_id,
            WorkflowStep.assignee_type == AssigneeType.requester_pick,
        )
        .order_by(WorkflowStep.step_number)
        .all()
    )
    return [s.step_number for s in steps]


# Statuses that mean the employee is already committed to (or in the middle of
# securing) that leave — a new request overlapping any of these is blocked.
# Draft and denied never block.
_BLOCKING_LEAVE_STATUSES = (
    LeaveRequestStatus.approved,
    LeaveRequestStatus.pending,
    LeaveRequestStatus.in_progress,
    LeaveRequestStatus.awaiting_approval,
    LeaveRequestStatus.returned,
)


def _find_overlapping_leave(
    db: Session,
    employee_id: str,
    start_date: date,
    end_date: date,
    exclude_id: Optional[str] = None,
) -> Optional[LeaveRequest]:
    """Return the first approved/in-flight leave for this employee whose date
    range intersects [start_date, end_date], or None. Two ranges overlap when
    each starts on or before the other ends."""
    query = db.query(LeaveRequest).filter(
        LeaveRequest.employee_id == employee_id,
        LeaveRequest.status.in_(_BLOCKING_LEAVE_STATUSES),
        LeaveRequest.start_date <= end_date,
        LeaveRequest.end_date >= start_date,
    )
    if exclude_id:
        query = query.filter(LeaveRequest.id != exclude_id)
    return query.order_by(LeaveRequest.start_date).first()


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

    # Open-ended types (e.g. Sick Leave) may omit the End Date. Start + optional
    # Expected Return: if no end date, it counts as 1 day until updated.
    if payload.end_date is None and not leave_type.open_ended:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End date is required for this leave type",
        )
    effective_end = payload.end_date or payload.start_date
    if effective_end < payload.start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End date must be after start date",
        )

    # Notice period — the start date may not fall within the leave type's
    # advance-notice window (calendar days from today). 0 = no notice period.
    notice_days = leave_type.notice_days or 0
    if notice_days > 0:
        earliest_start = date.today() + timedelta(days=notice_days)
        if payload.start_date < earliest_start:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"{leave_type.leave_type_name} requires {notice_days} day"
                    f"{'s' if notice_days != 1 else ''} notice — the earliest start "
                    f"date is {earliest_start.strftime('%d %b %Y')}."
                ),
            )

    # Overlap — the employee cannot already be on (or awaiting) leave for any of
    # these dates. Blocks against approved and in-flight requests of any type.
    conflict = _find_overlapping_leave(
        db, payload.employee_id, payload.start_date, effective_end,
    )
    if conflict is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"This overlaps an existing leave ({conflict.reference}, "
                f"{conflict.start_date.strftime('%d %b')}–"
                f"{conflict.end_date.strftime('%d %b %Y')}). "
                "You already have leave booked for these dates."
            ),
        )

    # Calculate days (working days only — weekends excluded, inclusive)
    days = _business_days(payload.start_date, effective_end)

    # Generate reference
    reference = _next_leave_request_reference(db)

    # The reliever is the approver picked for the workflow's requester_pick step.
    # The form sends picked_approvers; fall back to an explicit reliever_id.
    reliever_id = payload.reliever_id or _reliever_from_picks(payload.picked_approvers)
    if not reliever_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Select a reliever before submitting this request",
        )
    if reliever_id == payload.employee_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The person on leave cannot be their own reliever — pick someone else.",
        )

    # Create request
    leave_request = LeaveRequest(
        reference=reference,
        requester_id=requester_id,
        employee_id=payload.employee_id,
        leave_type_id=payload.leave_type_id,
        reliever_id=reliever_id,
        document_id=payload.document_id,
        request_type=payload.request_type,
        department=employee.department,
        job_title=employee.job_title,
        start_date=payload.start_date,
        end_date=effective_end,
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
    year: Optional[int] = None,
) -> Tuple[list[LeaveRequest], int]:
    """Get all leave requests with pagination and sorting.

    `year` filters to requests whose leave falls in that fiscal year
    (start_date year — the same basis used for leave balances).
    """
    # Eager-load every relationship the response schema reads, so serializing
    # each row does not trigger per-row lazy loads (N+1). On remote MySQL this
    # is the difference between one query and ~5 per row.
    query = db.query(LeaveRequest).options(
        joinedload(LeaveRequest.leave_type),
        joinedload(LeaveRequest.document),
        joinedload(LeaveRequest.employee).joinedload(Employee.user),
        joinedload(LeaveRequest.reliever).joinedload(Employee.user),
        joinedload(LeaveRequest.requester),
    )

    # Optional filter: only a single employee's requests (used by the
    # per-employee balance/history view).
    if employee_id:
        query = query.filter(LeaveRequest.employee_id == employee_id)

    if year is not None:
        from sqlalchemy import extract
        query = query.filter(extract("year", LeaveRequest.start_date) == year)

    # Apply sorting
    sort_column = getattr(LeaveRequest, sort_by, LeaveRequest.created_at)
    if sort_order.lower() == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    total = query.count()
    leave_requests = query.offset(skip).limit(limit).all()

    # Prefetch the latest approval_request_id for every row in ONE query, so the
    # per-row `approval_request_id` property doesn't fire a query each (N+1).
    ar_ids = _latest_approval_request_ids(db, [lr.id for lr in leave_requests])
    for lr in leave_requests:
        lr.__dict__["_ar_id_prefetched"] = ar_ids.get(lr.id)

    return leave_requests, total


def _latest_approval_request_ids(db: Session, request_ids: list[str]) -> dict[str, str]:
    """{ leave_request_id: latest approval_request_id } in one query.

    A resubmit creates multiple ApprovalRequest attempts; the newest attempt is
    the active workflow, so we keep the highest attempt_number per request.
    """
    if not request_ids:
        return {}
    from app.shared.models.approval import ApprovalRequest
    rows = (
        db.query(
            ApprovalRequest.request_id,
            ApprovalRequest.id,
        )
        .filter(
            ApprovalRequest.request_type == "leave_request",
            ApprovalRequest.request_id.in_(request_ids),
        )
        .order_by(ApprovalRequest.request_id, ApprovalRequest.attempt_number.desc())
        .all()
    )
    out: dict[str, str] = {}
    for request_id, approval_id in rows:
        if request_id not in out:  # first seen wins = highest attempt (ordered desc)
            out[request_id] = approval_id
    return out


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
    picked_approvers: dict[int, str] | None = None,
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

    # Guard against starting a second workflow on a request that is already in
    # one — a double-submit would create a duplicate attempt and split the
    # approval trail. A returned/rejected attempt is NOT pending, so resubmit
    # still works.
    existing = (
        db.query(ApprovalRequest)
        .filter(
            ApprovalRequest.request_type == "leave_request",
            ApprovalRequest.request_id == leave_request_id,
            ApprovalRequest.overall_status == ApprovalOverallStatus.pending,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This leave request is already awaiting approval",
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

    # Prefer the picks the requester made on the form. If none were sent
    # (older clients, or a draft submitted later), fall back to assigning the
    # stored reliever to whichever step is requester_pick — resolved from the
    # workflow config rather than hard-coded, so reordering steps is safe.
    if picked_approvers:
        resolved_picks = picked_approvers
    elif leave_request.reliever_id:
        pick_steps = _requester_pick_steps(db, "leave_request", requester.workspace_id)
        resolved_picks = {step: leave_request.reliever_id for step in pick_steps[:1]}
    else:
        resolved_picks = None

    approval_request = engine.start(
        request_type="leave_request",
        request_id=leave_request_id,
        title=title,
        requester=requester,
        picked_approvers=resolved_picks,
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

    if payload.end_date is None and not leave_type.open_ended:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="End date is required for this leave type")
    effective_end = payload.end_date or payload.start_date
    if effective_end < payload.start_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="End date must be after start date")

    # Notice period — same rule as a fresh request.
    notice_days = leave_type.notice_days or 0
    if notice_days > 0:
        earliest_start = date.today() + timedelta(days=notice_days)
        if payload.start_date < earliest_start:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"{leave_type.leave_type_name} requires {notice_days} day"
                    f"{'s' if notice_days != 1 else ''} notice — the earliest start "
                    f"date is {earliest_start.strftime('%d %b %Y')}."
                ),
            )

    # Overlap — ignore THIS request (it's being edited), block against any other
    # approved/in-flight leave for the same employee.
    conflict = _find_overlapping_leave(
        db, payload.employee_id, payload.start_date, effective_end, exclude_id=lr.id,
    )
    if conflict is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"This overlaps an existing leave ({conflict.reference}, "
                f"{conflict.start_date.strftime('%d %b')}–"
                f"{conflict.end_date.strftime('%d %b %Y')}). "
                "You already have leave booked for these dates."
            ),
        )

    employee = db.query(Employee).filter(Employee.id == payload.employee_id).first()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    # Apply edits
    reliever_id = payload.reliever_id or _reliever_from_picks(payload.picked_approvers)
    if not reliever_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Select a reliever before resubmitting this request",
        )
    if reliever_id == payload.employee_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The person on leave cannot be their own reliever — pick someone else.",
        )

    lr.employee_id = payload.employee_id
    lr.leave_type_id = payload.leave_type_id
    lr.reliever_id = reliever_id
    lr.request_type = payload.request_type
    lr.department = employee.department
    lr.job_title = employee.job_title
    lr.start_date = payload.start_date
    lr.end_date = effective_end
    lr.days = _business_days(payload.start_date, effective_end)
    lr.reason = payload.reason
    if payload.document_id is not None:
        lr.document_id = payload.document_id
    lr.status = LeaveRequestStatus.pending
    db.flush()

    # Restart the workflow (engine.start creates a new attempt from step 1)
    submit_leave_request_for_approval(db, lr.id, payload.picked_approvers)

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


def mark_leave_returned(
    db: Session,
    leave_request_id: str,
    end_date,
    current_user_id: str,
) -> LeaveRequest:
    """
    Employee marks that they are back from an open-ended leave (e.g. Sick Leave).
    Finalizes the actual End Date + number of days, stamps returned_at, and keeps
    the recorded balance `used` accurate by the change in days.
    """
    from datetime import datetime, timezone

    lr = get_leave_request_by_id(db, leave_request_id)

    if lr.requester_id != current_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Only the requester can mark this leave as returned")
    if not (lr.leave_type and lr.leave_type.open_ended):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="This leave type does not require marking a return")
    if lr.status != LeaveRequestStatus.approved:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Only approved leave can be marked as returned")
    if lr.returned_at is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="This leave has already been marked as returned")
    if end_date < lr.start_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="The last day of leave cannot be before the start date")

    old_days = lr.days or 0
    lr.end_date = end_date
    lr.days = _business_days(lr.start_date, end_date)
    lr.returned_at = datetime.now(timezone.utc)

    # Keep recorded usage accurate — adjust the balance by the change in days.
    delta = lr.days - old_days
    if delta:
        balance = (
            db.query(LeaveBalance)
            .filter(
                LeaveBalance.employee_id == lr.employee_id,
                LeaveBalance.leave_type_id == lr.leave_type_id,
                LeaveBalance.fiscal_year == lr.start_date.year,
            )
            .first()
        )
        if balance:
            balance.used = (balance.used or 0) + delta
            balance.remaining = balance.entitlement - balance.used

    db.flush()
    return lr


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


_MONTH_NAMES = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
]


def _period_start(period: str, year: int) -> date:
    """
    First day of a payroll period, for resolving the tax rules that applied.

    Periods are stored as free text ("September 2026"), so fall back to the
    start of the year when the month cannot be read rather than failing a run.
    """
    first_word = (period or "").strip().split()[0].lower() if period else ""
    month = _MONTH_NAMES.index(first_word) + 1 if first_word in _MONTH_NAMES else 1
    return date(year, month, 1)


def _next_payroll_ref(period: str, year: int) -> str:
    """Payroll run reference: PAY-YYYYMM-XXXXXX (one per generate run)."""
    return f"PAY-{_period_yyyymm(period, year)}-{uuid.uuid4().hex[:6].upper()}"


def _loan_installment(loan: EmployeeLoan, repaid: Decimal, zero: Decimal) -> Decimal:
    """The amount an active, started loan deducts this period, before it is booked.

    Standing loans (no total) always deduct their monthly amount; installment/one-off
    loans are capped at the outstanding balance so the final payment never overshoots.
    Shared by the generation (write) path and the preview (read-only) path so the two
    can never disagree.
    """
    if loan.total_amount is None:
        return loan.monthly_amount or zero
    outstanding = (loan.total_amount or zero) - repaid
    if outstanding < zero:
        outstanding = zero
    return min(loan.monthly_amount or zero, outstanding)


def _accrue_loan_deduction(
    db: Session,
    loans: list[EmployeeLoan],
    slip: Payslip,
    period: str,
    year: int,
    run_yyyymm: int,
    repaid_to_date: dict[str, Decimal],
    charge_this_period: dict[str, LoanRepaymentCharge],
    zero: Decimal,
) -> Decimal:
    """Sum this period's deduction across an employee's loans.

    A period already charged for a loan is reused (idempotent — regeneration never
    double-charges, and the charge still counts even after the loan completes). New
    charges accrue only for active loans, are capped at the outstanding balance, and
    auto-complete an installment loan once its total is repaid. Returns the total loan
    deduction to place on the payslip.
    """
    total = zero
    for loan in loans:
        existing = charge_this_period.get(loan.id)
        if existing is not None:
            # Already charged this period — reuse regardless of the loan's current status.
            total += existing.amount or zero
            continue

        # Only active loans accrue a NEW charge; completed/cancelled loans not charged
        # this period contribute nothing.
        if loan.status != LoanStatus.active:
            continue

        # Respect the loan's start period (NULL ⇒ deduct from the first run).
        if loan.start_period_yyyymm is not None and loan.start_period_yyyymm > run_yyyymm:
            continue

        installment = _loan_installment(loan, repaid_to_date.get(loan.id, zero), zero)

        if installment > zero:
            charge = LoanRepaymentCharge(
                loan_id=loan.id, payslip=slip, period=period, year=year, amount=installment,
            )
            db.add(charge)
            repaid_to_date[loan.id] = repaid_to_date.get(loan.id, zero) + installment
            charge_this_period[loan.id] = charge
            if loan.total_amount is not None and repaid_to_date[loan.id] >= loan.total_amount:
                loan.status = LoanStatus.completed

        total += installment
    return total


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
    run_yyyymm = int(_period_yyyymm(period, year))
    result: list[Payslip] = []

    # Batch-load structured loans + their charge ledger once (remote MySQL: avoid N+1).
    # Load ALL loans (any status), not just active: a completed loan still owns the
    # charge it made in a past period, so regenerating that period must reuse it.
    loans_by_emp: dict[str, list[EmployeeLoan]] = {}
    for ln in (
        db.query(EmployeeLoan)
        .filter(EmployeeLoan.employee_id.in_(payload.employee_ids))
        .all()
    ):
        loans_by_emp.setdefault(ln.employee_id, []).append(ln)

    repaid_to_date: dict[str, Decimal] = {}          # loan_id -> total charged across all periods
    charge_this_period: dict[str, LoanRepaymentCharge] = {}  # loan_id -> charge for THIS run
    loan_ids = [ln.id for lst in loans_by_emp.values() for ln in lst]
    if loan_ids:
        for ch in (
            db.query(LoanRepaymentCharge)
            .filter(LoanRepaymentCharge.loan_id.in_(loan_ids))
            .all()
        ):
            repaid_to_date[ch.loan_id] = repaid_to_date.get(ch.loan_id, zero) + (ch.amount or zero)
            if ch.period == period and ch.year == year:
                charge_this_period[ch.loan_id] = ch

    # Statutory rules in force for the period being run — not today's rules, so
    # regenerating an old period reproduces what it originally paid.
    tax_config = resolve_tax_config(db, _period_start(period, year))

    for emp in employees:
        basic     = emp.basic_salary or zero
        housing   = emp.housing_allowance or zero
        transport = emp.transport_allowance or zero
        meal      = emp.meal_allowance or zero

        # Computed from the configured rules rather than copied off the employee
        # row. The stored figures were only ever written when someone saved
        # through the employee form, so any other write path left them at zero
        # and payroll silently under-deducted.
        computed = None
        if tax_config is not None:
            computed = compute_statutory_deductions(
                Earnings(basic=basic, housing=housing, transport=transport, meal=meal),
                tax_config,
            )
            paye    = computed.paye
            pension = computed.pension
            nhf     = computed.nhf
        else:
            # No configuration set up yet — fall back to whatever is on the
            # employee so payroll still runs rather than zeroing everyone.
            paye    = emp.paye or zero
            pension = emp.pension or zero
            nhf     = emp.nhf or zero

        is_new = emp.id not in existing_by_emp
        slip = existing_by_emp.get(emp.id) or Payslip(employee_id=emp.id, period=period, year=year)
        if is_new:
            db.add(slip)

        # Loan deduction: sum structured loans (installments auto-stop once repaid; charges
        # recorded per period so regeneration is idempotent). The structured model owns this
        # employee's loan line when they have an active loan OR a charge already booked for this
        # period; otherwise fall back to the legacy flat loan_repayment field — unchanged behaviour.
        emp_loans = loans_by_emp.get(emp.id, [])
        structured = any(ln.status == LoanStatus.active for ln in emp_loans) or \
            any(ln.id in charge_this_period for ln in emp_loans)
        if structured:
            loan = _accrue_loan_deduction(
                db, emp_loans, slip, period, year, run_yyyymm,
                repaid_to_date, charge_this_period, zero,
            )
        else:
            loan = emp.loan_repayment or zero

        # Snapshot the deducted loan's context onto the slip (one active loan per the
        # one-loan rule) so the payslip PDF is a self-contained historical record.
        slip.loan_description = None
        slip.loan_total = None
        slip.loan_outstanding = None
        if structured:
            charged = [ln for ln in emp_loans if ln.id in charge_this_period]
            if charged:
                cl = charged[0]
                slip.loan_description = cl.description or cl.mode.value.replace("_", " ").title()
                slip.loan_total = cl.total_amount
                if cl.total_amount is not None:
                    # repaid_to_date includes this period's charge → outstanding AFTER payment.
                    slip.loan_outstanding = cl.total_amount - repaid_to_date.get(cl.id, zero)

        net = (basic + housing + transport + meal) - (paye + pension + nhf + loan)

        slip.payroll_ref = payroll_ref
        slip.emp_code = emp.employee_no
        slip.department = emp.department
        slip.basic, slip.housing, slip.transport, slip.meal = basic, housing, transport, meal
        slip.paye, slip.pension, slip.nhf, slip.loan = paye, pension, nhf, loan

        # Snapshot how PAYE was reached. Cleared when there is no calculation
        # behind the figure, so a slip never shows working that is not its own.
        if computed is not None:
            slip.tax_config_name = tax_config.name
            slip.annual_gross = computed.annual_gross
            slip.annual_pension = computed.annual_pension
            slip.annual_nhf = computed.annual_nhf
            slip.consolidated_relief = computed.consolidated_relief
            slip.taxable_income = computed.taxable_income
            slip.annual_tax = computed.annual_tax
            slip.tax_bands = [
                {
                    "sequence": b.sequence,
                    "rate": float(b.rate),
                    "amount_taxed": float(b.amount_taxed),
                    "tax": float(b.tax),
                }
                for b in computed.bands
            ]
        else:
            slip.tax_config_name = None
            slip.annual_gross = None
            slip.annual_pension = None
            slip.annual_nhf = None
            slip.consolidated_relief = None
            slip.taxable_income = None
            slip.annual_tax = None
            slip.tax_bands = None
        slip.net = net
        slip.payroll_status = PayslipStatus.processed
        slip.prepared_by = prepared_by
        result.append(slip)

    db.flush()
    return result


# ─── Employee loans: CRUD + read-only period projection ───────────────────────


def _decorate_loan(loan: EmployeeLoan, amount_repaid: Decimal) -> EmployeeLoan:
    """Attach computed amount_repaid/outstanding onto the ORM instance so LoanRead
    (from_attributes) can serialize them. Outstanding is None for standing loans."""
    zero = Decimal("0")
    loan.amount_repaid = amount_repaid or zero
    if loan.total_amount is None:
        loan.outstanding = None
    else:
        out = (loan.total_amount or zero) - (amount_repaid or zero)
        loan.outstanding = out if out > zero else zero
    return loan


def _repaid_by_loan(db: Session, loan_ids: list[str]) -> dict[str, Decimal]:
    """loan_id -> total amount charged across all periods (one batched query)."""
    zero = Decimal("0")
    totals: dict[str, Decimal] = {}
    if not loan_ids:
        return totals
    for ch in db.query(LoanRepaymentCharge).filter(LoanRepaymentCharge.loan_id.in_(loan_ids)).all():
        totals[ch.loan_id] = totals.get(ch.loan_id, zero) + (ch.amount or zero)
    return totals


def outstanding_by_employee(db: Session, employee_ids: list[str]) -> dict[str, Decimal]:
    """Total outstanding balance across each employee's ACTIVE installment/one-off loans
    (standing loans have no fixed balance, so they're excluded). Batched — no N+1."""
    zero = Decimal("0")
    result: dict[str, Decimal] = {}
    if not employee_ids:
        return result
    loans = (
        db.query(EmployeeLoan)
        .filter(
            EmployeeLoan.employee_id.in_(employee_ids),
            EmployeeLoan.status == LoanStatus.active,
        )
        .all()
    )
    if not loans:
        return result
    repaid = _repaid_by_loan(db, [ln.id for ln in loans])
    for loan in loans:
        if loan.total_amount is None:   # standing loans have no outstanding balance
            continue
        out = (loan.total_amount or zero) - repaid.get(loan.id, zero)
        if out < zero:
            out = zero
        result[loan.employee_id] = result.get(loan.employee_id, zero) + out
    return result


def list_employee_loans(db: Session, employee_id: str) -> list[EmployeeLoan]:
    loans = (
        db.query(EmployeeLoan)
        .filter(EmployeeLoan.employee_id == employee_id)
        .order_by(EmployeeLoan.created_at.desc())
        .all()
    )
    repaid = _repaid_by_loan(db, [ln.id for ln in loans])
    zero = Decimal("0")
    return [_decorate_loan(ln, repaid.get(ln.id, zero)) for ln in loans]


def _get_loan_or_404(db: Session, loan_id: str) -> EmployeeLoan:
    loan = db.query(EmployeeLoan).filter(EmployeeLoan.id == loan_id).first()
    if not loan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loan not found")
    return loan


def create_employee_loan(
    db: Session, employee_id: str, payload: LoanCreate, created_by: Optional[str],
) -> EmployeeLoan:
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    # One active loan at a time — an employee must finish or cancel the current loan first.
    active_exists = (
        db.query(EmployeeLoan)
        .filter(EmployeeLoan.employee_id == employee_id, EmployeeLoan.status == LoanStatus.active)
        .first()
    )
    if active_exists:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This employee already has an active loan. Complete or cancel it before adding another.",
        )

    loan = EmployeeLoan(
        employee_id=employee_id,
        description=payload.description,
        mode=LoanMode(payload.mode),
        monthly_amount=Decimal(str(payload.monthly_amount)),
        total_amount=Decimal(str(payload.total_amount)) if payload.total_amount is not None else None,
        start_period_yyyymm=payload.start_period_yyyymm,
        status=LoanStatus.active,
        created_by=created_by,
    )
    db.add(loan)
    db.commit()
    db.refresh(loan)
    return _decorate_loan(loan, Decimal("0"))


def update_employee_loan(db: Session, loan_id: str, payload: LoanUpdate) -> EmployeeLoan:
    loan = _get_loan_or_404(db, loan_id)
    if payload.monthly_amount is not None:
        loan.monthly_amount = Decimal(str(payload.monthly_amount))
    if payload.total_amount is not None:
        loan.total_amount = Decimal(str(payload.total_amount))
    if payload.start_period_yyyymm is not None:
        loan.start_period_yyyymm = payload.start_period_yyyymm
    if payload.description is not None:
        loan.description = payload.description
    if payload.status is not None:
        loan.status = LoanStatus(payload.status)
    db.commit()
    db.refresh(loan)
    repaid = _repaid_by_loan(db, [loan.id]).get(loan.id, Decimal("0"))
    return _decorate_loan(loan, repaid)


def delete_employee_loan(db: Session, loan_id: str) -> None:
    loan = _get_loan_or_404(db, loan_id)
    has_charges = (
        db.query(LoanRepaymentCharge).filter(LoanRepaymentCharge.loan_id == loan_id).first() is not None
    )
    if has_charges:
        # Preserve deduction history — cancel rather than hard-delete a charged loan.
        loan.status = LoanStatus.cancelled
    else:
        db.delete(loan)
    db.commit()


def list_loan_charges(db: Session, loan_id: str) -> list[LoanRepaymentCharge]:
    """Repayment history for a loan — one row per period it was deducted, oldest first."""
    _get_loan_or_404(db, loan_id)
    return (
        db.query(LoanRepaymentCharge)
        .filter(LoanRepaymentCharge.loan_id == loan_id)
        .order_by(LoanRepaymentCharge.year.asc(), LoanRepaymentCharge.created_at.asc())
        .all()
    )


def project_loans_for_period(
    db: Session, period: str, year: int, employee_ids: Optional[list[str]] = None,
) -> dict[str, Decimal]:
    """Read-only projection of each employee's loan line for a period: what
    ``generate_payslips`` WOULD deduct, without writing anything. Powers the payslip
    generate preview so it matches the slip that generation later produces."""
    zero = Decimal("0")
    run_yyyymm = int(_period_yyyymm(period, year))

    q = db.query(EmployeeLoan)
    if employee_ids:
        q = q.filter(EmployeeLoan.employee_id.in_(employee_ids))
    loans = q.all()
    if not loans:
        return {}

    loan_ids = [ln.id for ln in loans]
    repaid = _repaid_by_loan(db, loan_ids)
    charge_this_period: dict[str, Decimal] = {}
    for ch in db.query(LoanRepaymentCharge).filter(LoanRepaymentCharge.loan_id.in_(loan_ids)).all():
        if ch.period == period and ch.year == year:
            charge_this_period[ch.loan_id] = ch.amount or zero

    by_emp: dict[str, list[EmployeeLoan]] = {}
    for loan in loans:
        by_emp.setdefault(loan.employee_id, []).append(loan)

    # Mirror generate_payslips per-employee: the structured model owns the loan line
    # (even if it sums to 0) whenever the employee has an active loan or a charge this
    # period — so callers know to suppress the legacy loan_repayment field. Employees
    # with only completed/cancelled loans and no charge this period are omitted (legacy applies).
    result: dict[str, Decimal] = {}
    for emp_id, emp_loans in by_emp.items():
        has_charge = any(ln.id in charge_this_period for ln in emp_loans)
        has_active = any(ln.status == LoanStatus.active for ln in emp_loans)
        if not (has_charge or has_active):
            continue
        total = zero
        for loan in emp_loans:
            existing = charge_this_period.get(loan.id)
            if existing is not None:
                total += existing                # already booked this period — reuse
            elif loan.status != LoanStatus.active:
                continue
            elif loan.start_period_yyyymm is not None and loan.start_period_yyyymm > run_yyyymm:
                continue
            else:
                total += _loan_installment(loan, repaid.get(loan.id, zero), zero)
        result[emp_id] = total
    return result


def get_leave_balance_years(db: Session) -> list[int]:
    """Distinct fiscal years that actually have leave-balance rows — for the
    year filter dropdown. Newest first."""
    rows = (
        db.query(LeaveBalance.fiscal_year)
        .distinct()
        .order_by(LeaveBalance.fiscal_year.desc())
        .all()
    )
    return [r[0] for r in rows]


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


# ── Payroll cost by department ───────────────────────────────────────────────


def get_payroll_periods_with_year(db: Session) -> list[dict]:
    """Distinct payroll periods, newest first, for the period selector."""
    rows = (
        db.query(Payslip.period, Payslip.year, func.count(Payslip.id))
        .group_by(Payslip.period, Payslip.year)
        .all()
    )
    out = [
        {"period": period, "year": int(year), "payslips": int(count)}
        for period, year, count in rows
    ]
    # "September 2026" sorts wrong alphabetically, so order by the real month.
    months = [
        "january", "february", "march", "april", "may", "june",
        "july", "august", "september", "october", "november", "december",
    ]

    def key(item: dict):
        first = (item["period"] or "").strip().split()[0].lower()
        month = months.index(first) + 1 if first in months else 0
        return (item["year"], month)

    return sorted(out, key=key, reverse=True)


def get_payroll_cost_by_department(
    db: Session,
    period: Optional[str] = None,
    year: Optional[int] = None,
    all_periods: bool = False,
) -> dict:
    """
    Payroll cost grouped by department, for one period or across all of them.

    Groups on Payslip.department — the department captured when payroll ran —
    not the employee's current department. A report run today therefore still
    shows what it showed last month, even after someone transfers.

    all_periods: aggregate every period instead of one. Defaults to the most
    recent period when neither is given.
    """
    periods = get_payroll_periods_with_year(db)

    # Every department that has ever appeared on a payslip, so the selector
    # does not shrink to whatever the chosen period happens to contain.
    all_departments = [
        row[0]
        for row in db.query(
            func.coalesce(func.nullif(Payslip.department, ""), "Unassigned")
        ).distinct().all()
    ]
    all_departments.sort()

    if not periods:
        return {"periods": [], "all_departments": [], "period": None, "year": None,
                "all_periods": False, "departments": [], "totals": {}, "employees": []}

    if all_periods:
        period, year = None, None
    elif period is None or year is None:
        period, year = periods[0]["period"], periods[0]["year"]

    period_filter = (
        []
        if all_periods
        else [Payslip.period == period, Payslip.year == year]
    )

    money = lambda col: func.coalesce(func.sum(col), 0)  # noqa: E731
    gross = Payslip.basic + Payslip.housing + Payslip.transport + Payslip.meal
    deductions = Payslip.paye + Payslip.pension + Payslip.nhf + Payslip.loan

    rows = (
        db.query(
            func.coalesce(func.nullif(Payslip.department, ""), "Unassigned").label("department"),
            func.count(Payslip.id).label("staff"),
            money(gross).label("gross"),
            money(Payslip.basic).label("basic"),
            money(Payslip.housing).label("housing"),
            money(Payslip.transport).label("transport"),
            money(Payslip.meal).label("meal"),
            money(Payslip.paye).label("paye"),
            money(Payslip.pension).label("pension"),
            money(Payslip.nhf).label("nhf"),
            money(Payslip.loan).label("loan"),
            money(deductions).label("deductions"),
            money(Payslip.net).label("net"),
        )
        .filter(*period_filter)
        .group_by("department")
        .all()
    )

    departments = [
        {
            "department": r.department,
            "staff": int(r.staff),
            "gross": float(r.gross),
            "basic": float(r.basic),
            "housing": float(r.housing),
            "transport": float(r.transport),
            "meal": float(r.meal),
            "paye": float(r.paye),
            "pension": float(r.pension),
            "nhf": float(r.nhf),
            "loan": float(r.loan),
            "deductions": float(r.deductions),
            "net": float(r.net),
        }
        for r in rows
    ]
    departments.sort(key=lambda d: d["net"], reverse=True)

    total_net = sum(d["net"] for d in departments)
    for d in departments:
        d["share_of_net"] = round(d["net"] / total_net * 100, 1) if total_net else 0.0

    totals = {
        "staff": sum(d["staff"] for d in departments),
        "gross": sum(d["gross"] for d in departments),
        "deductions": sum(d["deductions"] for d in departments),
        "paye": sum(d["paye"] for d in departments),
        "pension": sum(d["pension"] for d in departments),
        "nhf": sum(d["nhf"] for d in departments),
        "loan": sum(d["loan"] for d in departments),
        "net": total_net,
        "departments": len(departments),
    }

    # The people behind each department's number, so a row can be opened up.
    from app.shared.models.user import User

    emp_rows = (
        db.query(
            func.coalesce(func.nullif(Payslip.department, ""), "Unassigned").label("department"),
            Payslip.id,
            Payslip.emp_code,
            Payslip.basic, Payslip.housing, Payslip.transport, Payslip.meal,
            Payslip.paye, Payslip.pension, Payslip.nhf, Payslip.loan, Payslip.net,
            User.first_name, User.last_name,
        )
        .join(Employee, Employee.id == Payslip.employee_id)
        .join(User, User.id == Employee.user_id)
        .filter(*period_filter)
        .all()
    )
    employees = [
        {
            "department": r.department,
            "payslip_id": r.id,
            "emp_code": r.emp_code,
            "name": f"{r.first_name or ''} {r.last_name or ''}".strip() or r.emp_code,
            "gross": float((r.basic or 0) + (r.housing or 0) + (r.transport or 0) + (r.meal or 0)),
            "deductions": float((r.paye or 0) + (r.pension or 0) + (r.nhf or 0) + (r.loan or 0)),
            "net": float(r.net or 0),
        }
        for r in emp_rows
    ]
    employees.sort(key=lambda e: e["net"], reverse=True)

    return {
        "periods": periods,
        "all_departments": all_departments,
        "period": period,
        "year": year,
        "all_periods": all_periods,
        "departments": departments,
        "totals": totals,
        "employees": employees,
    }


# ─── Tax configuration ────────────────────────────────────────────────────────


def _apply_bands(config: TaxConfig, bands: list) -> None:
    """Replace a config's band table. Sequence is normalised to 1..n in order."""
    config.bands.clear()
    for i, band in enumerate(sorted(bands, key=lambda b: b.sequence), start=1):
        config.bands.append(
            TaxBand(sequence=i, width=band.width, rate=band.rate)
        )


def list_tax_configs(db: Session) -> list[TaxConfig]:
    """Newest effective date first — the one payroll would pick is at the top."""
    return (
        db.query(TaxConfig)
        .options(joinedload(TaxConfig.bands))
        .order_by(TaxConfig.effective_from.desc())
        .all()
    )


def get_tax_config(db: Session, config_id: str) -> TaxConfig:
    config = (
        db.query(TaxConfig)
        .options(joinedload(TaxConfig.bands))
        .filter(TaxConfig.id == config_id)
        .first()
    )
    if not config:
        raise HTTPException(status_code=404, detail="Tax configuration not found")
    return config


def create_tax_config(db: Session, payload) -> TaxConfig:
    data = payload.model_dump(exclude={"bands"})
    config = TaxConfig(**data)
    _apply_bands(config, payload.bands or [])
    db.add(config)
    db.flush()
    return config


def update_tax_config(db: Session, config_id: str, payload) -> TaxConfig:
    config = get_tax_config(db, config_id)
    data = payload.model_dump(exclude_unset=True, exclude={"bands"})
    for field, value in data.items():
        setattr(config, field, value)
    if payload.bands is not None:
        _apply_bands(config, payload.bands)
    db.flush()
    return config


def delete_tax_config(db: Session, config_id: str) -> None:
    config = get_tax_config(db, config_id)
    db.delete(config)
    db.flush()


def resolve_tax_config(db: Session, on_date: Optional[date] = None) -> Optional[TaxConfig]:
    """
    The active config in force on a date — the newest whose effective_from is on
    or before it. Payroll resolves per period, so a historical run keeps using
    the rules that applied then rather than whatever is current.
    """
    when = on_date or date.today()
    return (
        db.query(TaxConfig)
        .options(joinedload(TaxConfig.bands))
        .filter(TaxConfig.is_active.is_(True), TaxConfig.effective_from <= when)
        .order_by(TaxConfig.effective_from.desc())
        .first()
    )
