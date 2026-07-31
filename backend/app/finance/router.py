from fastapi import APIRouter, Depends, status, Query, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.shared.dependencies import get_current_user
from app.shared.models.user import User
from app.shared.models.document import Document
from app.shared.services.cloudinary_service import upload_file
from app.finance.models import CashRequisition, InvoiceProcessing
from app.finance.schemas import (
    CashRequisitionCreate, CashRequisitionRead,
    InvoiceProcessingCreate, InvoiceProcessingRead, POOption, VendorOption,
    FinanceSubmit,
)
from app.finance import service
from app.employees.service import get_employee_by_user_id

router = APIRouter(prefix="/api/finance", tags=["Finance"])


# ════════════════════════════════════════════════════════════════════════════
# CASH REQUISITIONS
# ════════════════════════════════════════════════════════════════════════════

@router.post(
    "/cash-requisitions",
    response_model=CashRequisitionRead,
    status_code=status.HTTP_201_CREATED,
)
def create_cash_requisition(
    payload: CashRequisitionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a cash requisition and, by default, start its approval workflow.

    Both happen in ONE transaction — if the workflow fails to start, nothing is
    left behind. Pass submit_for_approval=false to create a standalone draft.
    """
    cr = service.create_cash_requisition(db, payload, current_user.id)

    if payload.submit_for_approval:
        service.submit_cash_requisition_for_approval(db, cr.id, payload.picked_approvers)

    db.commit()
    db.refresh(cr)
    return cr


@router.get("/cash-requisitions", response_model=dict)
def list_cash_requisitions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    sort_by: str = Query("created_at", pattern="^(created_at|amount|status)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all cash requisitions with pagination, enriched with the next actor."""
    rows, total = service.get_all_cash_requisitions(
        db, skip=skip, limit=limit, sort_by=sort_by, sort_order=sort_order
    )
    next_actors = service.get_next_actors(db, [cr.id for cr in rows])

    items = []
    for cr in rows:
        item = CashRequisitionRead.model_validate(cr)
        info = next_actors.get(cr.id)
        if info:
            item.next_actor_name = info["name"]
            item.current_step_name = info["step_name"]
        items.append(item)

    return {"data": items, "total": total, "skip": skip, "limit": limit}


@router.get("/cash-requisitions/{cash_requisition_id}", response_model=CashRequisitionRead)
def get_cash_requisition(
    cash_requisition_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single cash requisition by UUID (reference fallback for old links)."""
    cr = service.get_cash_requisition_by_id(db, cash_requisition_id)
    result = CashRequisitionRead.model_validate(cr)
    info = service.get_next_actors(db, [cr.id]).get(cr.id)
    if info:
        result.next_actor_name = info["name"]
        result.current_step_name = info["step_name"]
    return result


@router.post("/cash-requisitions/{cash_requisition_id}/resubmit", response_model=CashRequisitionRead)
def resubmit_cash_requisition(
    cash_requisition_id: str,
    payload: CashRequisitionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Edit and resubmit a returned cash requisition. Restarts the workflow from step 1."""
    cr = service.resubmit_cash_requisition(db, cash_requisition_id, payload, current_user.id)
    db.commit()
    db.refresh(cr)
    return cr


@router.post(
    "/cash-requisitions/{cash_requisition_id}/upload-document",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
)
def upload_cash_requisition_document(
    cash_requisition_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a supporting document for a cash requisition."""
    cr = db.query(CashRequisition).filter(CashRequisition.id == cash_requisition_id).first()
    if not cr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cash requisition not found")

    ALLOWED_TYPES = {"application/pdf", "image/png", "image/jpeg", "image/webp", "application/msword",
                     "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                     "application/vnd.ms-excel",
                     "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="File type not allowed. Allowed: PDF, JPG, PNG, WEBP, DOC, DOCX")

    file_bytes = file.file.read()
    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be 10 MB or smaller")

    url = None
    try:
        url = upload_file(file_bytes, file.filename or "document", folder="portland-gas/cash-requisitions")
    except Exception as e:
        print(f"Cloudinary upload error: {str(e)}")
        url = f"file://{file.filename}" if file.filename else "file://document"

    uploader_employee = get_employee_by_user_id(current_user.id, db)

    doc = Document(
        type="file",
        name=file.filename or "cash_requisition_document",
        category="finance",
        file_path=url,
        file_size=len(file_bytes),
        mime_type=file.content_type,
        uploaded_by=uploader_employee.id if uploader_employee else None,
    )
    db.add(doc)
    db.flush()

    cr.document_id = doc.id
    db.commit()
    db.refresh(cr)

    return {"document_id": doc.id, "file_name": file.filename or "document", "file_url": url}


@router.post(
    "/cash-requisitions/{cash_requisition_id}/submit-for-approval",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
)
def submit_cash_requisition_for_approval(
    cash_requisition_id: str,
    body: FinanceSubmit | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit a cash requisition into the workflow engine (starts approval)."""
    approval_request = service.submit_cash_requisition_for_approval(
        db, cash_requisition_id, body.picked_approvers if body else None
    )
    db.commit()
    db.refresh(approval_request)
    return {
        "approval_request_id": approval_request.id,
        "request_type": approval_request.request_type,
        "request_id": approval_request.request_id,
        "status": approval_request.overall_status,
        "current_step_number": approval_request.current_step_number,
    }


# ════════════════════════════════════════════════════════════════════════════
# INVOICE PROCESSING  (separate from the orders `invoices` at /api/invoices)
# ════════════════════════════════════════════════════════════════════════════

@router.post(
    "/invoices",
    response_model=InvoiceProcessingRead,
    status_code=status.HTTP_201_CREATED,
)
def create_invoice(
    payload: InvoiceProcessingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create an invoice and, by default, start its approval workflow.

    Both happen in ONE transaction — if the workflow fails to start, nothing is
    left behind. Pass submit_for_approval=false to create a standalone draft.
    """
    inv = service.create_invoice(db, payload, current_user.id)

    if payload.submit_for_approval:
        service.submit_invoice_for_approval(db, inv.id, payload.picked_approvers)

    db.commit()
    db.refresh(inv)
    return inv


@router.get("/invoices", response_model=dict)
def list_invoices(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    sort_by: str = Query("created_at", pattern="^(created_at|amount|status)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all invoices, enriched with the next actor."""
    rows, total = service.get_all_invoices(db, skip=skip, limit=limit, sort_by=sort_by, sort_order=sort_order)
    next_actors = service.get_invoice_next_actors(db, [inv.id for inv in rows])
    items = []
    for inv in rows:
        item = InvoiceProcessingRead.model_validate(inv)
        info = next_actors.get(inv.id)
        if info:
            item.next_actor_name = info["name"]
            item.current_step_name = info["step_name"]
        items.append(item)
    return {"data": items, "total": total, "skip": skip, "limit": limit}


# Literal paths — MUST be declared before /invoices/{invoice_id}
@router.get("/invoices/po-options", response_model=list[POOption])
def invoice_po_options(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Approved/completed procurement references for the PO Number dropdown."""
    return service.get_po_options(db)


@router.get("/invoices/vendor-options", response_model=list[VendorOption])
def invoice_vendor_options(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Active vendors (id + name) for the Vendor dropdown."""
    return service.get_vendor_options(db)


@router.get("/invoices/{invoice_id}", response_model=InvoiceProcessingRead)
def get_invoice(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single invoice by UUID (reference fallback for old links)."""
    inv = service.get_invoice_by_id(db, invoice_id)
    result = InvoiceProcessingRead.model_validate(inv)
    info = service.get_invoice_next_actors(db, [inv.id]).get(inv.id)
    if info:
        result.next_actor_name = info["name"]
        result.current_step_name = info["step_name"]
    return result


@router.post("/invoices/{invoice_id}/resubmit", response_model=InvoiceProcessingRead)
def resubmit_invoice(
    invoice_id: str,
    payload: InvoiceProcessingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Edit and resubmit a returned invoice. Restarts the workflow from step 1."""
    inv = service.resubmit_invoice(db, invoice_id, payload, current_user.id)
    db.commit()
    db.refresh(inv)
    return inv


@router.post(
    "/invoices/{invoice_id}/upload-document",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
)
def upload_invoice_document(
    invoice_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a supporting document for an invoice."""
    inv = db.query(InvoiceProcessing).filter(InvoiceProcessing.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")

    ALLOWED_TYPES = {"application/pdf", "image/png", "image/jpeg", "image/webp", "application/msword",
                     "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                     "application/vnd.ms-excel",
                     "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="File type not allowed. Allowed: PDF, JPG, PNG, WEBP, DOC, DOCX")

    file_bytes = file.file.read()
    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be 10 MB or smaller")

    url = None
    try:
        url = upload_file(file_bytes, file.filename or "document", folder="portland-gas/invoices")
    except Exception as e:
        print(f"Cloudinary upload error: {str(e)}")
        url = f"file://{file.filename}" if file.filename else "file://document"

    uploader_employee = get_employee_by_user_id(current_user.id, db)
    doc = Document(
        type="file",
        name=file.filename or "invoice_document",
        category="finance",
        file_path=url,
        file_size=len(file_bytes),
        mime_type=file.content_type,
        uploaded_by=uploader_employee.id if uploader_employee else None,
    )
    db.add(doc)
    db.flush()
    inv.document_id = doc.id
    db.commit()
    db.refresh(inv)
    return {"document_id": doc.id, "file_name": file.filename or "document", "file_url": url}


@router.post(
    "/invoices/{invoice_id}/submit-for-approval",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
)
def submit_invoice_for_approval(
    invoice_id: str,
    body: FinanceSubmit | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit an invoice into the workflow engine (starts approval)."""
    approval_request = service.submit_invoice_for_approval(
        db, invoice_id, body.picked_approvers if body else None
    )
    db.commit()
    db.refresh(approval_request)
    return {
        "approval_request_id": approval_request.id,
        "request_type": approval_request.request_type,
        "request_id": approval_request.request_id,
        "status": approval_request.overall_status,
        "current_step_number": approval_request.current_step_number,
    }
