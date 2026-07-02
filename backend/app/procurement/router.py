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
  POST   /{id}/issue-po                 approved → po_issued, creates PO (admin)
  GET    /purchase-orders/{po_id}       PO detail
  PATCH  /purchase-orders/{po_id}/status  update PO delivery status (admin)
"""

from fastapi import APIRouter, Depends, Query, Form, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.shared.dependencies import get_current_user
from app.shared.models.user import User
from app.procurement.schemas import (
    ProcurementCreate, ProcurementUpdate, ActionRequest,
    IssuePORequest, POStatusUpdate,
    ProcurementResponse, ProcurementListItem, PurchaseOrderResponse,
)
from app.procurement.repository import ProcurementRepository
from app.procurement.service import ProcurementService
from app.employees.service import get_employee_by_user_id

router = APIRouter()


def _svc(db: Session) -> ProcurementService:
    return ProcurementService(ProcurementRepository(db))


# ── Purchase orders (declared before /{id} to avoid path conflicts) ───────────

@router.get("/purchase-orders/", response_model=List[PurchaseOrderResponse])
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

@router.get("/", response_model=List[ProcurementListItem])
def list_requests(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = get_employee_by_user_id(current_user.id, db)
    return _svc(db).list_requests(current_user, employee, skip=skip, limit=limit, status_filter=status)


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


@router.post("/", response_model=ProcurementResponse, status_code=201)
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
    return _svc(db).get_request(request_id, current_user, employee)


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


@router.post("/{request_id}/approve", response_model=ProcurementResponse)
def approve_request(
    request_id: str,
    body: ActionRequest = ActionRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    req = _svc(db).approve_request(request_id, body, current_user)
    db.commit()
    db.refresh(req)
    return req


@router.post("/{request_id}/reject", response_model=ProcurementResponse)
def reject_request(
    request_id: str,
    body: ActionRequest = ActionRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    req = _svc(db).reject_request(request_id, body, current_user)
    db.commit()
    db.refresh(req)
    return req


@router.post("/{request_id}/return", response_model=ProcurementResponse)
def return_request(
    request_id: str,
    body: ActionRequest = ActionRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    req = _svc(db).return_request(request_id, body, current_user)
    db.commit()
    db.refresh(req)
    return req


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
