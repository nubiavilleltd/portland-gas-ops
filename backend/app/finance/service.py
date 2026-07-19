from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from fastapi import HTTPException, status
from typing import Optional, Tuple
from datetime import datetime

from app.finance.models import (
    CashRequisition, CashRequisitionStatus,
    InvoiceProcessing, InvoiceProcessingStatus,
)
from app.finance.schemas import CashRequisitionCreate, InvoiceProcessingCreate
from app.employees.models import Employee
from app.shared.services.workflow_engine import WorkflowEngine
from app.shared.models.approval import ApprovalRequest


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
) -> ApprovalRequest:
    """
    Submit a cash requisition into the workflow engine (creates ApprovalRequest +
    AllRequest). Both steps auto-resolve (ops manager, specific finance manager),
    so no picked_approvers are needed.
    """
    cr = db.query(CashRequisition).filter(CashRequisition.id == cash_requisition_id).first()
    if not cr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cash requisition not found")

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
        picked_approvers=None,
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

    submit_cash_requisition_for_approval(db, cr.id)
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


def submit_invoice_for_approval(db: Session, invoice_id: str) -> ApprovalRequest:
    """Submit an invoice into the workflow (both steps auto-resolve)."""
    inv = db.query(InvoiceProcessing).filter(InvoiceProcessing.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")

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
        picked_approvers=None,
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

    submit_invoice_for_approval(db, inv.id)
    return inv
