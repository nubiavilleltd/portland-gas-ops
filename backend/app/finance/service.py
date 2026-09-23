from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from fastapi import HTTPException, status
from typing import Optional, Tuple
from datetime import datetime, timezone

from app.finance.models import (
    CashRequisition, CashRequisitionStatus,
    InvoiceProcessing, InvoiceProcessingStatus,
)
from app.finance.schemas import CashRequisitionCreate, InvoiceProcessingCreate
from app.employees.models import Employee
from app.shared.services.workflow_engine import WorkflowEngine
from app.shared.models.approval import ApprovalRequest, ApprovalOverallStatus


def _assert_not_already_pending(db: Session, request_type: str, request_id: str, label: str) -> None:
    """
    Block starting a second workflow on a request that is already in one.

    A double-submit would create a duplicate attempt and split the approval
    trail. A returned/rejected attempt is not pending, so resubmit still works.
    """
    existing = (
        db.query(ApprovalRequest)
        .filter(
            ApprovalRequest.request_type == request_type,
            ApprovalRequest.request_id == request_id,
            ApprovalRequest.overall_status == ApprovalOverallStatus.pending,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This {label} is already awaiting approval",
        )


# ── Reference generation ─────────────────────────────────────────────────────

def _next_cash_requisition_reference(db: Session) -> str:
    """Generate next cash requisition reference: CRQ-2026-0001"""
    year = datetime.now().year
    pattern = f"CRQ-{year}-%"
    last = db.query(CashRequisition.reference).filter(
        CashRequisition.reference.like(pattern)
    ).order_by(CashRequisition.reference.desc()).first()

    num = 1
    if last:
        try:
            num = int(last[0].split("-")[-1]) + 1
        except (ValueError, IndexError):
            pass

    return f"CRQ-{year}-{num:04d}"


# ── CRUD ─────────────────────────────────────────────────────────────────────

def create_cash_requisition(
    db: Session,
    payload: CashRequisitionCreate,
    requester_id: str,
) -> CashRequisition:
    """Create a new cash requisition (pending, awaiting workflow submission)."""
    if payload.amount is None or payload.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Amount must be greater than zero",
        )

    # Department defaults to the requester's own department when not provided.
    employee = db.query(Employee).filter(Employee.user_id == requester_id).first()
    department = payload.department or (employee.department if employee else None)
    if not department:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Department is required",
        )

    cash_requisition = CashRequisition(
        reference=_next_cash_requisition_reference(db),
        requester_id=requester_id,
        document_id=payload.document_id,
        title=payload.title,
        description=payload.description,
        department=department,
        amount=payload.amount,
        currency=payload.currency or "NGN",
        expected_retirement=payload.expected_retirement,
        status=CashRequisitionStatus.pending,
    )
    db.add(cash_requisition)
    db.flush()
    return cash_requisition


def get_all_cash_requisitions(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    sort_by: str = "created_at",
    sort_order: str = "desc",
) -> Tuple[list[CashRequisition], int]:
    """Get all cash requisitions with pagination and sorting."""
    query = db.query(CashRequisition).options(joinedload(CashRequisition.document))

    sort_column = getattr(CashRequisition, sort_by, CashRequisition.created_at)
    query = query.order_by(sort_column.asc() if sort_order.lower() == "asc" else sort_column.desc())

    total = query.count()
    rows = query.offset(skip).limit(limit).all()
    return rows, total


def get_cash_requisition_by_id(db: Session, cash_requisition_id: str) -> CashRequisition:
    """Get one cash requisition by UUID (falls back to reference for old links)."""
    cr = db.query(CashRequisition).options(
        joinedload(CashRequisition.document),
    ).filter(CashRequisition.id == cash_requisition_id).first()

    if not cr:
        cr = db.query(CashRequisition).options(
            joinedload(CashRequisition.document),
        ).filter(CashRequisition.reference == cash_requisition_id).first()

    if not cr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cash requisition '{cash_requisition_id}' not found",
        )
    return cr


def get_next_actors(db: Session, request_ids: list[str]) -> dict[str, dict]:
    """
    For each cash requisition id still pending in the workflow, return the name of
    the assignee holding the current step and the step name.
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
            ApprovalRequest.request_type == "cash_requisition",
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


# ── Workflow submission ──────────────────────────────────────────────────────

def submit_cash_requisition_for_approval(
    db: Session,
    cash_requisition_id: str,
    picked_approvers: dict[int, str] | None = None,
) -> ApprovalRequest:
    """
    Submit a cash requisition into the workflow engine (creates ApprovalRequest +
    AllRequest). Both steps auto-resolve (ops manager, specific finance manager),
    so no picked_approvers are needed.
    """
    cr = db.query(CashRequisition).filter(CashRequisition.id == cash_requisition_id).first()
    if not cr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cash requisition not found")

    _assert_not_already_pending(db, "cash_requisition", cash_requisition_id, "cash requisition")

    requester = db.query(Employee).filter(Employee.user_id == cr.requester_id).first()
    if not requester:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Requester must have an employee record",
        )

    title = f"{cr.title} — {cr.currency} {cr.amount:,.2f}"

    engine = WorkflowEngine(db)
    approval_request = engine.start(
        request_type="cash_requisition",
        request_id=cash_requisition_id,
        title=title,
        requester=requester,
        picked_approvers=picked_approvers or None,
    )
    return approval_request


def resubmit_cash_requisition(
    db: Session,
    cash_requisition_id: str,
    payload: CashRequisitionCreate,
    current_user_id: str,
) -> CashRequisition:
    """
    Edit and resubmit a RETURNED cash requisition. Only the original requester may
    resubmit. Resets status to pending and restarts the workflow from step 1.
    """
    cr = get_cash_requisition_by_id(db, cash_requisition_id)

    if cr.status != CashRequisitionStatus.returned:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only returned requests can be resubmitted",
        )
    if cr.requester_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the requester can resubmit this request",
        )
    if payload.amount is None or payload.amount <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Amount must be greater than zero")

    employee = db.query(Employee).filter(Employee.user_id == current_user_id).first()

    cr.title = payload.title
    cr.description = payload.description
    cr.department = payload.department or (employee.department if employee else cr.department)
    cr.amount = payload.amount
    cr.currency = payload.currency or "NGN"
    cr.expected_retirement = payload.expected_retirement
    if payload.document_id is not None:
        cr.document_id = payload.document_id
    cr.status = CashRequisitionStatus.pending
    db.flush()

    submit_cash_requisition_for_approval(db, cr.id, payload.picked_approvers)
    return cr


# ════════════════════════════════════════════════════════════════════════════
# INVOICE PROCESSING
# ════════════════════════════════════════════════════════════════════════════

def _next_invoice_reference(db: Session) -> str:
    """Generate next invoice reference: INV-2026-0001"""
    year = datetime.now().year
    pattern = f"INV-{year}-%"
    last = db.query(InvoiceProcessing.reference).filter(
        InvoiceProcessing.reference.like(pattern)
    ).order_by(InvoiceProcessing.reference.desc()).first()

    num = 1
    if last:
        try:
            num = int(last[0].split("-")[-1]) + 1
        except (ValueError, IndexError):
            pass

    return f"INV-{year}-{num:04d}"


def get_po_options(db: Session) -> list[dict]:
    """Approved/completed procurement request references — for the PO dropdown."""
    from app.procurement.models import ProcurementRequest
    rows = (
        db.query(ProcurementRequest.reference)
        .filter(ProcurementRequest.status.in_(["approved", "completed"]))
        .order_by(ProcurementRequest.reference.desc())
        .all()
    )
    return [{"reference": r[0]} for r in rows if r[0]]


def get_vendor_options(db: Session) -> list[dict]:
    """Active vendors (id + name) for the invoice Vendor dropdown. A column query
    (not the full ORM object) avoids the vendors.vendor_type enum, which currently
    holds invalid data that makes GET /api/vendors 500."""
    from app.vendors.models import Vendor
    rows = (
        db.query(Vendor.id, Vendor.name)
        .filter(Vendor.is_active.is_(True))
        .order_by(Vendor.name)
        .all()
    )
    return [{"id": r[0], "name": r[1]} for r in rows if r[1]]


def create_invoice(
    db: Session,
    payload: InvoiceProcessingCreate,
    requester_id: str,
) -> InvoiceProcessing:
    """Create an invoice (pending). Submit-for-approval starts the workflow."""
    if payload.amount is None or payload.amount <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Net amount must be greater than zero")
    if not payload.vendor:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Vendor is required")

    employee = db.query(Employee).filter(Employee.user_id == requester_id).first()
    department = payload.department or (employee.department if employee else None)

    invoice = InvoiceProcessing(
        reference=_next_invoice_reference(db),
        invoice_id=payload.invoice_id,
        requester_id=requester_id,
        document_id=payload.document_id,
        invoice_number=payload.invoice_number,
        title=payload.title,
        description=payload.description,
        vendor=payload.vendor,
        department=department,
        po_number=payload.po_number,
        payment_terms=payload.payment_terms,
        gross_amount=payload.gross_amount or 0,
        tax_amount=payload.tax_amount or 0,
        amount=payload.amount,
        currency=payload.currency or "NGN",
        status=InvoiceProcessingStatus.pending,
    )
    db.add(invoice)
    db.flush()
    return invoice


def get_all_invoices(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    sort_by: str = "created_at",
    sort_order: str = "desc",
) -> Tuple[list[InvoiceProcessing], int]:
    query = db.query(InvoiceProcessing).options(joinedload(InvoiceProcessing.document))
    sort_column = getattr(InvoiceProcessing, sort_by, InvoiceProcessing.created_at)
    query = query.order_by(sort_column.asc() if sort_order.lower() == "asc" else sort_column.desc())
    total = query.count()
    return query.offset(skip).limit(limit).all(), total


def get_invoice_by_id(db: Session, invoice_id: str) -> InvoiceProcessing:
    inv = db.query(InvoiceProcessing).options(
        joinedload(InvoiceProcessing.document),
    ).filter(InvoiceProcessing.id == invoice_id).first()
    if not inv:
        inv = db.query(InvoiceProcessing).options(
            joinedload(InvoiceProcessing.document),
        ).filter(InvoiceProcessing.reference == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Invoice '{invoice_id}' not found")
    return inv


def get_invoice_next_actors(db: Session, request_ids: list[str]) -> dict[str, dict]:
    """Next-actor name + step for pending invoices in the workflow."""
    if not request_ids:
        return {}
    from app.shared.models.approval import ApprovalStepAssignment, ApprovalOverallStatus, WorkflowStep
    from app.shared.models.user import User

    rows = (
        db.query(ApprovalRequest.request_id, User.first_name, User.last_name, WorkflowStep.step_name)
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
            ApprovalRequest.request_type == "invoice",
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


def submit_invoice_for_approval(db: Session, invoice_id: str, picked_approvers: dict[int, str] | None = None) -> ApprovalRequest:
    """Submit an invoice into the workflow (both steps auto-resolve)."""
    inv = db.query(InvoiceProcessing).filter(InvoiceProcessing.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")

    _assert_not_already_pending(db, "invoice", invoice_id, "invoice")

    requester = db.query(Employee).filter(Employee.user_id == inv.requester_id).first()
    if not requester:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Requester must have an employee record")

    title = f"{inv.title} — {inv.vendor} — {inv.currency} {inv.amount:,.2f}"

    engine = WorkflowEngine(db)
    return engine.start(
        request_type="invoice",
        request_id=invoice_id,
        title=title,
        requester=requester,
        picked_approvers=picked_approvers or None,
    )


def resubmit_invoice(
    db: Session,
    invoice_id: str,
    payload: InvoiceProcessingCreate,
    current_user_id: str,
) -> InvoiceProcessing:
    """Edit and resubmit a RETURNED invoice. Only the requester may resubmit."""
    inv = get_invoice_by_id(db, invoice_id)
    if inv.status != InvoiceProcessingStatus.returned:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only returned invoices can be resubmitted")
    if inv.requester_id != current_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the requester can resubmit this invoice")
    if payload.amount is None or payload.amount <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Net amount must be greater than zero")

    employee = db.query(Employee).filter(Employee.user_id == current_user_id).first()

    inv.invoice_number = payload.invoice_number
    inv.title = payload.title
    inv.description = payload.description
    inv.vendor = payload.vendor
    inv.department = payload.department or (employee.department if employee else inv.department)
    inv.po_number = payload.po_number
    inv.payment_terms = payload.payment_terms
    inv.gross_amount = payload.gross_amount or 0
    inv.tax_amount = payload.tax_amount or 0
    inv.amount = payload.amount
    inv.currency = payload.currency or "NGN"
    if payload.document_id is not None:
        inv.document_id = payload.document_id
    inv.status = InvoiceProcessingStatus.pending
    db.flush()

    submit_invoice_for_approval(db, inv.id, payload.picked_approvers)
    return inv


# ── Invoice settlement (final workflow step) ─────────────────────────────────
#
# The LAST step of the invoice workflow does not "approve" in the ordinary
# sense — it settles. Its approver either marks the invoice paid (which IS
# that step's approval, completing the workflow) or cancels it outright.
#
# Everything here derives the final step from the workflow at run time, so
# adding, removing or reordering steps moves the settlement point automatically
# and no code needs to change.


def get_invoice_approval_request(db: Session, invoice_id: str) -> Optional[ApprovalRequest]:
    """The invoice's live (pending) workflow attempt, if any."""
    return (
        db.query(ApprovalRequest)
        .filter(
            ApprovalRequest.request_type == "invoice",
            ApprovalRequest.request_id == invoice_id,
            ApprovalRequest.overall_status == ApprovalOverallStatus.pending,
        )
        .order_by(ApprovalRequest.created_at.desc())
        .first()
    )


def get_final_step_number(db: Session, workflow_id: str) -> Optional[int]:
    """Highest step_number in a workflow — the settlement step, whatever it is."""
    from sqlalchemy import func as sa_func
    from app.shared.models.approval import WorkflowStep

    return (
        db.query(sa_func.max(WorkflowStep.step_number))
        .filter(WorkflowStep.workflow_id == workflow_id)
        .scalar()
    )


def _load_settleable_invoice(db: Session, invoice_id: str) -> Tuple[InvoiceProcessing, ApprovalRequest]:
    """
    Fetch an invoice that is legitimately at its settlement point.

    Guards, in order: the invoice is in a live workflow, that workflow has
    steps, and it is currently sitting on the LAST one. Actor identity is left
    to the engine, which already rejects anyone not assigned to the step.
    """
    inv = get_invoice_by_id(db, invoice_id)

    if inv.status in (
        InvoiceProcessingStatus.paid,
        InvoiceProcessingStatus.cancelled,
        InvoiceProcessingStatus.denied,
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"This invoice is already {inv.status.value}",
        )

    approval_req = get_invoice_approval_request(db, inv.id)
    if not approval_req:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This invoice is not in an active approval workflow",
        )

    final_step = get_final_step_number(db, approval_req.workflow_id)
    if final_step is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The invoice workflow has no steps configured",
        )

    if approval_req.current_step_number != final_step:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This invoice has not reached the final approval step yet",
        )

    return inv, approval_req


def mark_invoice_paid(
    db: Session,
    invoice_id: str,
    actor: Employee,
    payment_reference: Optional[str] = None,
    payment_notes: Optional[str] = None,
) -> InvoiceProcessing:
    """
    Settle the invoice as PAID. This is the final step's approval: it drives the
    workflow engine's approve() so history, audit trail, all_requests and the
    requester notification are all recorded exactly as a normal approval would be.
    """
    inv, approval_req = _load_settleable_invoice(db, invoice_id)

    def on_final_approval() -> None:
        # Runs only when the engine confirms this was the last step — so the
        # invoice can never be marked paid by a mid-workflow approval.
        inv.status = InvoiceProcessingStatus.paid
        inv.paid_at = datetime.now(timezone.utc)
        inv.paid_by = actor.id
        inv.payment_reference = payment_reference
        inv.payment_notes = payment_notes

    engine = WorkflowEngine(db)
    engine.approve(
        approval_req.id,
        actor,
        payment_notes or "Marked as paid",
        on_final_approval=on_final_approval,
        # The final step pays rather than approves, so the requester should be
        # told the invoice is paid — not that it was "fully approved".
        completion_notification=(
            "Invoice Paid",
            f"Your invoice \"{inv.title}\" has been marked as paid."
            + (f" Payment reference: {payment_reference}." if payment_reference else ""),
        ),
    )

    if inv.status != InvoiceProcessingStatus.paid:
        # Defensive: the step moved on instead of completing, so this was not
        # actually the final step. Refuse rather than leave a half-settled row.
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This invoice has not reached the final approval step yet",
        )

    db.flush()
    return inv


def cancel_invoice(
    db: Session,
    invoice_id: str,
    actor: Employee,
    reason: str,
) -> InvoiceProcessing:
    """
    Settle the invoice as CANCELLED — terminal, and the requester cannot
    resubmit. Driven through the engine's reject() so the workflow attempt is
    closed out properly instead of being left pending forever.
    """
    if not reason or not reason.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A reason is required to cancel an invoice",
        )

    inv, approval_req = _load_settleable_invoice(db, invoice_id)

    def on_rejected() -> None:
        inv.status = InvoiceProcessingStatus.cancelled
        inv.cancelled_at = datetime.now(timezone.utc)
        inv.cancelled_by = actor.id
        inv.cancellation_reason = reason.strip()

    engine = WorkflowEngine(db)
    engine.reject(
        approval_req.id,
        actor,
        reason.strip(),
        on_rejected=on_rejected,
        rejection_notification=(
            "Invoice Cancelled",
            f"Your invoice \"{inv.title}\" has been cancelled and will not be paid."
            f" Reason: {reason.strip()}",
        ),
    )

    db.flush()
    return inv


def get_invoice_settlement_info(db: Session, inv: InvoiceProcessing) -> dict:
    """
    Detail-view extras: who settled the invoice, and whether it is currently
    sitting on the final (settlement) step. Two small queries, no per-row loop.
    """
    from app.shared.models.user import User

    info: dict = {"settled_by_name": None, "is_final_step": False}

    settler_id = inv.paid_by or inv.cancelled_by
    if settler_id:
        row = (
            db.query(User.first_name, User.last_name)
            .join(Employee, Employee.user_id == User.id)
            .filter(Employee.id == settler_id)
            .first()
        )
        if row:
            info["settled_by_name"] = f"{row[0] or ''} {row[1] or ''}".strip() or None

    approval_req = get_invoice_approval_request(db, inv.id)
    if approval_req:
        final_step = get_final_step_number(db, approval_req.workflow_id)
        info["is_final_step"] = (
            final_step is not None and approval_req.current_step_number == final_step
        )

    return info


def invoice_is_at_final_step(db: Session, invoice_id: str) -> bool:
    """
    True when the invoice's live workflow is sitting on its LAST step.

    That step settles (mark as paid / cancel) rather than approves, so arriving
    there means every approval step is already done — which is why the invoice
    reads "approved" from that point on rather than "in progress". Derived from
    the workflow at call time, so it holds for any number of approval steps.
    """
    approval_req = get_invoice_approval_request(db, invoice_id)
    if not approval_req:
        return False
    final_step = get_final_step_number(db, approval_req.workflow_id)
    return final_step is not None and approval_req.current_step_number == final_step


# ── Finance dashboard ────────────────────────────────────────────────────────
#
# One aggregate view over invoice processing and cash requisitions: what is
# waiting on an approver, what is approved and awaiting payment, and what has
# actually been paid.
#
# Amounts are reported PER CURRENCY, never blended. The data carries NGN, EUR,
# GBP and USD side by side, so a single summed figure would be meaningless.
#
# Scoped through all_requests, which carries workspace_id — invoice_processing
# and cash_requisitions do not have it yet. Every invoice has a registry row, so
# the join drops nothing that has entered a workflow (drafts are excluded, which
# is correct for a dashboard about approvals and payments).


_AWAITING_APPROVAL = ("pending", "in_progress")


def _money_rows(rows) -> list[dict]:
    """[(currency, count, total)] -> serialisable per-currency buckets."""
    return [
        {"currency": cur or "NGN", "count": int(n or 0), "amount": float(total or 0)}
        for cur, n, total in rows
    ]


def get_finance_dashboard(
    db: Session,
    workspace_id: Optional[str] = None,
    currency: Optional[str] = None,
) -> dict:
    """
    currency: restrict every figure to one currency. The list of currencies in
    play is always returned unfiltered, so the selector never collapses to the
    one already chosen.
    """
    from sqlalchemy import func as sa_func
    from app.shared.models.approval import AllRequest, ApprovalRequest, ApprovalHistory
    from app.shared.models.user import User

    def scoped(model, request_type: str):
        q = db.query(model).join(
            AllRequest,
            and_(
                AllRequest.request_type == request_type,
                AllRequest.request_id == model.id,
            ),
        )
        if workspace_id:
            q = q.filter(AllRequest.workspace_id == workspace_id)
        return q

    def by_status_currency(model, request_type: str, statuses):
        return (
            scoped(model, request_type)
            .with_entities(
                model.status,
                model.currency,
                sa_func.count(model.id),
                sa_func.coalesce(sa_func.sum(model.amount), 0),
            )
            .filter(model.status.in_(statuses))
            .group_by(model.status, model.currency)
            .all()
        )

    # ── 1-2. Invoice and cash-requisition aggregates ────────────────────────
    inv_rows = by_status_currency(
        InvoiceProcessing,
        "invoice",
        list(_AWAITING_APPROVAL) + ["approved", "paid", "cancelled", "denied", "returned"],
    )
    cash_rows = by_status_currency(
        CashRequisition,
        "cash_requisition",
        list(_AWAITING_APPROVAL) + ["approved", "denied", "returned"],
    )

    def collapse(rows, wanted: tuple[str, ...]) -> list[dict]:
        acc: dict[str, list] = {}
        for status, row_currency, count, total in rows:
            value = status.value if hasattr(status, "value") else str(status)
            if value not in wanted:
                continue
            cur = row_currency or "NGN"
            if currency and cur != currency:
                continue
            bucket = acc.setdefault(cur, [cur, 0, 0.0])
            bucket[1] += int(count or 0)
            bucket[2] += float(total or 0)
        return _money_rows([(c, n, t) for c, n, t in acc.values()])

    # ── 3. Recently paid, with who settled it ───────────────────────────────
    # (first page only — see get_paid_invoices for the paginated feed)
    recent_q = (
        scoped(InvoiceProcessing, "invoice")
        .with_entities(
            InvoiceProcessing.reference,
            InvoiceProcessing.title,
            InvoiceProcessing.vendor,
            InvoiceProcessing.amount,
            InvoiceProcessing.currency,
            InvoiceProcessing.paid_at,
            InvoiceProcessing.payment_reference,
            User.first_name,
            User.last_name,
            InvoiceProcessing.id,
        )
        .outerjoin(Employee, Employee.id == InvoiceProcessing.paid_by)
        .outerjoin(User, User.id == Employee.user_id)
        .filter(InvoiceProcessing.status == InvoiceProcessingStatus.paid)
    )
    if currency:
        # Filtered in SQL, not after the fact — otherwise the limit would slice
        # the newest 8 overall and then discard most of them.
        recent_q = recent_q.filter(InvoiceProcessing.currency == currency)
    recent_q = recent_q.order_by(InvoiceProcessing.paid_at.desc()).limit(8).all()
    recently_paid = [
        {
            "reference": r[0],
            "title": r[1],
            "vendor": r[2],
            "amount": float(r[3] or 0),
            "currency": r[4] or "NGN",
            "paid_at": r[5].isoformat() if r[5] else None,
            "payment_reference": r[6],
            "paid_by_name": (f"{r[7] or ''} {r[8] or ''}".strip() or None),
            "id": r[9],
        }
        for r in recent_q
    ]

    # ── 4. Ageing of approved-but-unpaid invoices ───────────────────────────
    # "Approved at" is the last recorded approval on the live workflow attempt,
    # not updated_at, which any later edit would move.
    approved_at_sub = (
        db.query(
            ApprovalRequest.request_id.label("rid"),
            sa_func.max(ApprovalHistory.acted_at).label("approved_at"),
        )
        .join(ApprovalHistory, ApprovalHistory.approval_request_id == ApprovalRequest.id)
        .filter(
            ApprovalRequest.request_type == "invoice",
            ApprovalHistory.action == "approved",
        )
        .group_by(ApprovalRequest.request_id)
        .subquery()
    )
    ageing_rows = (
        scoped(InvoiceProcessing, "invoice")
        .with_entities(
            InvoiceProcessing.currency,
            InvoiceProcessing.amount,
            approved_at_sub.c.approved_at,
            InvoiceProcessing.id,
            InvoiceProcessing.reference,
            InvoiceProcessing.title,
            InvoiceProcessing.vendor,
            InvoiceProcessing.invoice_number,
        )
        .outerjoin(approved_at_sub, approved_at_sub.c.rid == InvoiceProcessing.id)
        .filter(InvoiceProcessing.status == InvoiceProcessingStatus.approved)
        .all()
    )

    now = datetime.now(timezone.utc)
    buckets = [("0-7 days", 0, 7), ("8-30 days", 8, 30), ("Over 30 days", 31, 10**6)]
    ageing: list[dict] = []
    for label, lo, hi in buckets:
        acc: dict[str, list] = {}
        members: list[dict] = []
        for row in ageing_rows:
            row_currency, amount, approved_at = row[0], row[1], row[2]
            cur = row_currency or "NGN"
            if currency and cur != currency:
                continue
            if approved_at is None:
                days = 0
            else:
                ref = approved_at if approved_at.tzinfo else approved_at.replace(tzinfo=timezone.utc)
                days = (now - ref).days
            if lo <= days <= hi:
                bucket = acc.setdefault(cur, [cur, 0, 0.0])
                bucket[1] += 1
                bucket[2] += float(amount or 0)
                # The invoices behind the number, so the bucket can be opened
                # up rather than leaving the reader to go hunting for them.
                members.append({
                    "id": row[3],
                    "reference": row[4],
                    "title": row[5],
                    "vendor": row[6],
                    "invoice_number": row[7],
                    "amount": float(amount or 0),
                    "currency": cur,
                    "approved_at": approved_at.isoformat() if approved_at else None,
                    "days_waiting": days,
                })
        members.sort(key=lambda m: m["days_waiting"], reverse=True)
        ageing.append({
            "bucket": label,
            "count": sum(b[1] for b in acc.values()),
            "by_currency": _money_rows([(c, n, t) for c, n, t in acc.values()]),
            "invoices": members,
        })

    def summarise(rows, wanted):
        per_currency = collapse(rows, wanted)
        return {
            "count": sum(b["count"] for b in per_currency),
            "by_currency": per_currency,
        }

    currencies = sorted(
        {(c or "NGN") for _, c, _, _ in inv_rows} | {(c or "NGN") for _, c, _, _ in cash_rows}
    )

    return {
        "currencies": currencies,
        "currency": currency,
        "awaiting_approval": {
            "invoices": summarise(inv_rows, _AWAITING_APPROVAL),
            "cash_requisitions": summarise(cash_rows, _AWAITING_APPROVAL),
        },
        "awaiting_payment": summarise(inv_rows, ("approved",)),
        "paid": summarise(inv_rows, ("paid",)),
        "cancelled": summarise(inv_rows, ("cancelled",)),
        "recently_paid": recently_paid,
        "ageing": ageing,
    }


def get_paid_invoices(
    db: Session,
    workspace_id: Optional[str] = None,
    currency: Optional[str] = None,
    skip: int = 0,
    limit: int = 8,
) -> dict:
    """
    Paginated feed of settled invoices — what was paid, by whom, and when.

    Its own endpoint rather than part of the dashboard payload: paging through
    the list should not re-run the aggregate queries behind the summary cards.
    """
    from app.shared.models.approval import AllRequest
    from app.shared.models.user import User

    base = db.query(InvoiceProcessing).join(
        AllRequest,
        and_(
            AllRequest.request_type == "invoice",
            AllRequest.request_id == InvoiceProcessing.id,
        ),
    ).filter(InvoiceProcessing.status == InvoiceProcessingStatus.paid)

    if workspace_id:
        base = base.filter(AllRequest.workspace_id == workspace_id)
    if currency:
        base = base.filter(InvoiceProcessing.currency == currency)

    total = base.count()

    rows = (
        base.with_entities(
            InvoiceProcessing.reference,
            InvoiceProcessing.title,
            InvoiceProcessing.vendor,
            InvoiceProcessing.amount,
            InvoiceProcessing.currency,
            InvoiceProcessing.paid_at,
            InvoiceProcessing.payment_reference,
            User.first_name,
            User.last_name,
            InvoiceProcessing.id,
        )
        .outerjoin(Employee, Employee.id == InvoiceProcessing.paid_by)
        .outerjoin(User, User.id == Employee.user_id)
        .order_by(InvoiceProcessing.paid_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return {
        "data": [
            {
                "reference": r[0],
                "title": r[1],
                "vendor": r[2],
                "amount": float(r[3] or 0),
                "currency": r[4] or "NGN",
                "paid_at": r[5].isoformat() if r[5] else None,
                "payment_reference": r[6],
                "paid_by_name": (f"{r[7] or ''} {r[8] or ''}".strip() or None),
            "id": r[9],
            }
            for r in rows
        ],
        "total": total,
        "skip": skip,
        "limit": limit,
    }
