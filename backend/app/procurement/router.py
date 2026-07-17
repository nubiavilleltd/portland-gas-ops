"""
Procurement router — /api/procurement

Endpoints:
  GET    /                              list requests (staff see own; admin see all)
  POST   /                              create draft request
  GET    /purchase-orders/              list all purchase orders
  GET    /{id}                          request detail
  PATCH  /{id}                          update draft request
  POST   /{id}/submit                   draft → pending
  POST   /{id}/approve                  pending → approved  (admin)
  POST   /{id}/reject                   → rejected           (admin)
  POST   /{id}/return                   → returned           (admin)
  POST   /{id}/issue-po                 approved → awaiting_confirmation, creates PO (admin)
  GET    /purchase-orders/{po_id}       PO detail
  PATCH  /purchase-orders/{po_id}/status  update PO delivery status (admin)
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Form, File, UploadFile
from sqlalchemy import and_
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.shared.dependencies import get_current_user
from app.shared.models.user import User
from app.procurement.schemas import (
    ProcurementCreate, ProcurementUpdate,
    IssuePORequest, POStatusUpdate,
    ProcurementResponse, ProcurementListItem, PurchaseOrderResponse,
)
from app.procurement.repository import ProcurementRepository
from app.procurement.service import ProcurementService
from app.employees.service import get_employee_by_user_id

router = APIRouter()


def _svc(db: Session) -> ProcurementService:
    return ProcurementService(ProcurementRepository(db))


def _next_actors(db: Session, request_ids: list[str]) -> dict[str, dict]:
    """
    Given a list of procurement request IDs (all expected to be pending),
    returns a dict mapping each request_id to its current step actor:
        { request_id: {"name": str, "step_name": str} }

    Done in a single JOIN query — no N+1.
    """
    if not request_ids:
        return {}

    from app.shared.models.approval import (
        AllRequest, ApprovalRequest, ApprovalStepAssignment,
        ApprovalOverallStatus, WorkflowStep,
    )
    from app.employees.models import Employee as EmpModel
    from app.shared.models.user import User as UserModel

    rows = (
        db.query(
            AllRequest.request_id,
            UserModel.first_name,
            UserModel.last_name,
            WorkflowStep.step_name,
        )
        .join(ApprovalRequest, ApprovalRequest.id == AllRequest.approval_request_id)
        .join(
            ApprovalStepAssignment,
            and_(
                ApprovalStepAssignment.approval_request_id == ApprovalRequest.id,
                ApprovalStepAssignment.step_number == ApprovalRequest.current_step_number,
            ),
        )
        .join(EmpModel, EmpModel.id == ApprovalStepAssignment.assigned_to)
        .join(UserModel, UserModel.id == EmpModel.user_id)
        .join(
            WorkflowStep,
            and_(
                WorkflowStep.workflow_id == ApprovalRequest.workflow_id,
                WorkflowStep.step_number == ApprovalRequest.current_step_number,
            ),
        )
        .filter(
            AllRequest.request_type == "procurement",
            AllRequest.request_id.in_(request_ids),
            ApprovalRequest.overall_status == ApprovalOverallStatus.pending,
        )
        .all()
    )

    result: dict[str, dict] = {}
    for row in rows:
        name = " ".join(p for p in [row.first_name, row.last_name] if p) or "—"
        result[row.request_id] = {"name": name, "step_name": row.step_name}
    return result


# ── Purchase orders (declared before /{id} to avoid path conflicts) ───────────

@router.get("/purchase-orders", response_model=List[PurchaseOrderResponse])
def list_purchase_orders(
    request_id: Optional[str] = Query(None, description="Filter POs by procurement request"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _svc(db).list_pos(request_id=request_id)


@router.get("/purchase-orders/{po_id}", response_model=PurchaseOrderResponse)
def get_purchase_order(
    po_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _svc(db).get_po(po_id)


@router.patch("/purchase-orders/{po_id}/status", response_model=PurchaseOrderResponse)
def update_po_status(
    po_id: str,
    data: POStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    po = _svc(db).update_po_status(po_id, data, current_user)
    db.commit()
    db.refresh(po)
    return po


# ── Procurement requests ──────────────────────────────────────────────────────

@router.get("", response_model=List[ProcurementListItem])
def list_requests(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = get_employee_by_user_id(current_user.id, db)
    requests = _svc(db).list_requests(current_user, employee, skip=skip, limit=limit, status_filter=status)

    # Single JOIN query to get the next actor for every pending or awaiting_confirmation row
    # (awaiting_confirmation requests have step 5 still active in the workflow)
    active_ids = [r.id for r in requests if r.status in ("pending", "awaiting_confirmation")]
    actor_map = _next_actors(db, active_ids)

    result = []
    for r in requests:
        item = ProcurementListItem.model_validate(r)
        info = actor_map.get(r.id)
        if info:
            item.next_actor_name = info["name"]
            item.current_step_name = info["step_name"]
        first_po = r.purchase_orders[0] if r.purchase_orders else None
        if first_po:
            item.po_number = first_po.po_number
            if first_po.document and first_po.document.file_path:
                item.po_document_url = first_po.document.file_path
        result.append(item)
    return result


_ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "image/jpeg",
    "image/png",
}
_MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("", response_model=ProcurementResponse, status_code=201)
async def create_request(
    data: str = Form(..., description="JSON-encoded ProcurementCreate payload"),
    attachment: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    file_bytes: Optional[bytes] = None
    filename:   Optional[str]   = None

    if attachment and attachment.filename:
        file_bytes = await attachment.read()

        # Validate file size
        if len(file_bytes) > _MAX_FILE_SIZE:
            from fastapi import HTTPException
            raise HTTPException(
                status_code=422,
                detail={"error_code": "FILE_TOO_LARGE", "message": "Attachment must be 10 MB or smaller"},
            )

        # Validate MIME type
        content_type = attachment.content_type or ""
        if content_type not in _ALLOWED_MIME_TYPES:
            from fastapi import HTTPException
            raise HTTPException(
                status_code=422,
                detail={
                    "error_code": "INVALID_FILE_TYPE",
                    "message": "Only PDF, Word, Excel, JPEG, and PNG files are allowed",
                },
            )

        filename = attachment.filename

    parsed = ProcurementCreate.model_validate_json(data)
    employee = get_employee_by_user_id(current_user.id, db)
    req = _svc(db).create_request(parsed, employee, file_bytes=file_bytes, filename=filename)
    db.commit()
    db.refresh(req)

    return req


@router.get("/{request_id}", response_model=ProcurementResponse)
def get_request(
    request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = get_employee_by_user_id(current_user.id, db)
    req = _svc(db).get_request(request_id, current_user, employee)
    result = ProcurementResponse.model_validate(req)
    if req.status in ("pending", "awaiting_confirmation"):
        info = _next_actors(db, [request_id]).get(request_id)
        if info:
            result.next_actor_name = info["name"]
            result.current_step_name = info["step_name"]
    return result


@router.patch("/{request_id}", response_model=ProcurementResponse)
def update_request(
    request_id: str,
    data: ProcurementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = get_employee_by_user_id(current_user.id, db)
    req = _svc(db).update_request(request_id, data, employee)
    db.commit()
    db.refresh(req)
    return req


@router.delete("/{request_id}/attachment", response_model=ProcurementResponse)
def remove_attachment(
    request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = get_employee_by_user_id(current_user.id, db)
    req = _svc(db).remove_attachment(request_id, employee)
    db.commit()
    db.refresh(req)
    return req


@router.post("/{request_id}/attachment", response_model=ProcurementResponse)
async def upload_attachment(
    request_id: str,
    attachment: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    file_bytes = await attachment.read()

    if len(file_bytes) > _MAX_FILE_SIZE:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=422,
            detail={"error_code": "FILE_TOO_LARGE", "message": "Attachment must be 10 MB or smaller"},
        )

    content_type = attachment.content_type or ""
    if content_type not in _ALLOWED_MIME_TYPES:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=422,
            detail={"error_code": "INVALID_FILE_TYPE", "message": "Only PDF, Word, Excel, JPEG, and PNG files are allowed"},
        )

    employee = get_employee_by_user_id(current_user.id, db)
    req = _svc(db).upload_attachment(request_id, file_bytes, attachment.filename or "attachment", employee)
    db.commit()
    db.refresh(req)
    return req


@router.post("/{request_id}/submit", response_model=ProcurementResponse)
def submit_request(
    request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = get_employee_by_user_id(current_user.id, db)
    req = _svc(db).submit_request(request_id, employee)
    db.commit()
    db.refresh(req)
    return req


# /approve, /reject, /return removed — all approval actions must go through
# the workflow engine at /api/workflow/requests/{approval_request_id}/approve|reject|return
# which enforces step assignment, fires notifications, and writes the audit trail.


@router.post("/{request_id}/approve-and-issue-po", response_model=ProcurementResponse)
def approve_and_issue_po(
    request_id: str,
    body: IssuePORequest = IssuePORequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Step 4 approver approves the workflow step and issues the PO in one action.
    Advances the workflow to step 5 (delivery confirmation) and sets status to awaiting_confirmation."""
    from app.shared.models.approval import AllRequest
    from app.shared.services.workflow_engine import WorkflowEngine

    employee = get_employee_by_user_id(current_user.id, db)
    engine = WorkflowEngine(db)

    all_req = (
        db.query(AllRequest)
        .filter(
            AllRequest.request_type == "procurement",
            AllRequest.request_id == request_id,
        )
        .first()
    )
    if not all_req or not all_req.approval_request_id:
        raise HTTPException(404, "No active approval request found for this procurement")

    approval_request_id = all_req.approval_request_id
    svc_instance = _svc(db)

    # Approve step 4 — engine advances to step 5 (not final, so on_final_approval won't fire)
    result = engine.approve(approval_request_id, employee, comment=None)

    # Manually set to "approved" so issue_po_internal's status check passes,
    # then issue_po_internal sets it to "awaiting_confirmation"
    proc_req = svc_instance._get_or_404(request_id)
    proc_req.status = "approved"
    db.flush()

    svc_instance.issue_po_internal(request_id, body, issuer_employee=employee)

    db.commit()

    proc_req = svc_instance._get_or_404(request_id)
    db.refresh(proc_req)

    return proc_req


@router.post("/{request_id}/confirm-delivery", response_model=ProcurementResponse)
def confirm_delivery(
    request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Step 5: Procurement officer confirms goods received. Completes the workflow."""
    from app.shared.models.approval import AllRequest
    from app.shared.services.workflow_engine import WorkflowEngine

    employee = get_employee_by_user_id(current_user.id, db)
    engine = WorkflowEngine(db)

    all_req = (
        db.query(AllRequest)
        .filter(
            AllRequest.request_type == "procurement",
            AllRequest.request_id == request_id,
        )
        .first()
    )
    if not all_req or not all_req.approval_request_id:
        raise HTTPException(404, "No active approval request found for this procurement")

    approval_request_id = all_req.approval_request_id
    svc_instance = _svc(db)

    def on_final_approval():
        svc_instance.confirm_delivery_internal(request_id)

    engine.approve(approval_request_id, employee, comment=None, on_final_approval=on_final_approval)

    db.commit()

    proc_req = svc_instance._get_or_404(request_id)
    db.refresh(proc_req)

    return proc_req


@router.post("/{request_id}/purchase-orders/{po_id}/regenerate-pdf", response_model=ProcurementResponse)
def regenerate_po_pdf(
    request_id: str,
    po_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Re-generate and re-upload the PO PDF for an existing purchase order."""
    issuer = get_employee_by_user_id(current_user.id, db)
    svc_instance = _svc(db)
    svc_instance.regenerate_po_pdf(request_id, po_id, current_user, issuer)
    db.commit()
    # Re-fetch with full eager loading so the response includes the updated document URL
    return svc_instance._get_or_404(request_id)


@router.post("/{request_id}/issue-po", response_model=PurchaseOrderResponse, status_code=201)
def issue_po(
    request_id: str,
    body: IssuePORequest = IssuePORequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    issuer = get_employee_by_user_id(current_user.id, db)
    po = _svc(db).issue_po(request_id, body, current_user, issuer)
    db.commit()
    db.refresh(po)
    return po
