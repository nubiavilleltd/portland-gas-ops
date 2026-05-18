"""
Procurement service — business logic for procurement requests.

What this service orchestrates when a request is SUBMITTED:
  1. Save the ProcurementRequest row to the database
  2. Save each ProcurementItem row (the line items)
  3. If an attachment was uploaded, store its Cloudinary URL on the request
  4. Generate a Purchase Order PDF using pdf_service
  5. Upload that PDF to Cloudinary and store the URL on the request

Why do the PDF + Cloudinary upload in the service (not the router)?
  The router only handles HTTP — it should not contain business logic.
  The service owns "what happens when a request is submitted", which includes
  generating the official document. If we ever change to a different PDF library
  or storage provider, we change the service, not the router.
"""

import logging
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.procurement import ProcurementRequest, ProcurementItem, ProcurementStatus
from app.models.user import User
from app.schemas.procurement import ProcurementCreate, ProcurementUpdate, ProcurementStatusUpdate
from app.services import cloudinary_service, pdf_service
from app.services.vendor_service import get_vendor
from app.utils.helpers import generate_reference

logger = logging.getLogger(__name__)


def list_requests(
    db: Session,
    current_user: User,
    skip: int = 0,
    limit: int = 20,
    status_filter: ProcurementStatus | None = None,
):
    """
    Return procurement requests.

    Staff see only their own requests.
    Admin/manager roles see all requests (useful for the approval/review view).

    Why this rule?
      A staff member should only see what they raised — they shouldn't see every
      department's procurement. Managers need the full list to action requests.
    """
    query = db.query(ProcurementRequest).filter(ProcurementRequest.is_active == True)

    # Role-based filter
    if current_user.role not in ("admin", "super_admin"):
        query = query.filter(ProcurementRequest.created_by == current_user.id)

    if status_filter:
        query = query.filter(ProcurementRequest.status == status_filter)

    return query.order_by(ProcurementRequest.created_at.desc()).offset(skip).limit(limit).all()


def get_request(db: Session, request_id: str, current_user: User) -> ProcurementRequest:
    """
    Fetch a single procurement request.

    Staff can only view their own requests. Admins/managers can view any.
    """
    req = db.query(ProcurementRequest).filter(
        ProcurementRequest.id == request_id,
        ProcurementRequest.is_active == True,
    ).first()

    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")

    if current_user.role not in ("admin", "super_admin") and req.created_by != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return req


def create_request(
    db: Session,
    data: ProcurementCreate,
    current_user: User,
    attachment_bytes: bytes | None = None,
    attachment_filename: str | None = None,
) -> ProcurementRequest:
    """
    Create a new procurement request with its line items.

    Steps:
    1. Validate the vendor_id (if provided) — raises 404 if vendor doesn't exist
    2. Save the ProcurementRequest row
    3. Save each ProcurementItem row
    4. Upload attachment to Cloudinary (if one was provided)
    5. Generate + upload the PO PDF
    6. Commit everything and return the full request
    """

    # 1. Validate vendor exists if vendor_id was given
    if data.vendor_id:
        get_vendor(db, data.vendor_id)   # Raises 404 if not found

    # 2. Create the request row (status defaults to 'submitted')
    #    We skip 'draft' for now — every submitted form goes straight to submitted.
    req = ProcurementRequest(
        reference=generate_reference("PO"),
        title=data.title,
        category=data.category,
        priority=data.priority,
        justification=data.justification,
        required_by=data.required_by,
        vendor_id=data.vendor_id,
        status=ProcurementStatus.submitted,
        created_by=current_user.id,
    )
    db.add(req)
    db.flush()   # flush() sends the INSERT to the DB without committing — gives us req.id
                 # We need req.id NOW so we can attach items to it via request_id FK

    # 3. Save line items
    for item_data in data.items:
        item = ProcurementItem(
            request_id=req.id,
            **item_data.model_dump(),
        )
        db.add(item)

    db.flush()   # Flush items too so the request is fully formed before PDF generation

    # 4. Upload attachment if provided
    if attachment_bytes and attachment_filename:
        url = cloudinary_service.upload_file(
            attachment_bytes,
            attachment_filename,
            folder="portland-gas/procurement-attachments",
        )
        if url:
            req.attachment_url = url
            req.attachment_name = attachment_filename

    # 5. Generate and upload the PO PDF
    #    We need to reload the request with its relationships to build the PDF
    db.refresh(req)
    _generate_and_attach_po(db, req, current_user)

    # 6. Commit everything in one transaction
    #    If anything above failed, nothing was saved (atomic)
    db.commit()
    db.refresh(req)
    return req


def _generate_and_attach_po(db: Session, req: ProcurementRequest, current_user: User):
    """
    Internal helper: generates the PO PDF and uploads it to Cloudinary.
    Mutates req.po_url — caller is responsible for committing.

    Why a separate helper?
      We might want to re-generate the PDF later (e.g. after an edit).
      Keeping this logic isolated makes it reusable.
    """
    try:
        # Build the items list the pdf_service expects
        items_for_pdf = [
            {
                "description": item.description,
                "quantity": item.quantity,
                "unit": item.unit.value,
                "unit_cost": item.unit_cost,
                "total_cost": item.total_cost,
            }
            for item in req.items
        ]

        # Vendor details — from the relationship (already loaded via flush+refresh)
        vendor = req.vendor
        vendor_name    = vendor.name    if vendor else None
        vendor_address = vendor.address if vendor else None
        vendor_phone   = vendor.phone   if vendor else None
        vendor_email   = vendor.email   if vendor else None

        pdf_bytes = pdf_service.generate_purchase_order(
            reference=req.reference,
            title=req.title,
            category=req.category.value,
            priority=req.priority.value,
            justification=req.justification,
            required_by=req.required_by,
            vendor_name=vendor_name,
            vendor_address=vendor_address,
            vendor_phone=vendor_phone,
            vendor_email=vendor_email,
            items=items_for_pdf,
            requester_name=current_user.name,
            created_at=req.created_at.date() if req.created_at else __import__('datetime').date.today(),
        )

        po_filename = f"{req.reference}.pdf"
        url = cloudinary_service.upload_pdf(pdf_bytes, po_filename)
        if url:
            req.po_url = url

    except Exception as exc:
        # Don't let PDF generation failure block the whole submission.
        # Log full traceback so we can debug without it blocking the request save.
        logger.exception("PO PDF generation failed for %s", req.reference)


def update_request(
    db: Session,
    request_id: str,
    data: ProcurementUpdate,
    current_user: User,
) -> ProcurementRequest:
    """
    Edit a procurement request. Only allowed while status is 'submitted'.

    Why only submitted?
      Once procurement has ordered the goods (status=ordered), editing the
      request would create a mismatch with the actual PO that was sent to the vendor.
    """
    req = get_request(db, request_id, current_user)

    if req.status not in (ProcurementStatus.submitted, ProcurementStatus.draft):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot edit a request with status '{req.status.value}'",
        )

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(req, field, value)

    db.commit()
    db.refresh(req)
    return req


def update_status(
    db: Session,
    request_id: str,
    data: ProcurementStatusUpdate,
    current_user: User,
) -> ProcurementRequest:
    """
    Move a request through the workflow: submitted → ordered → delivered.

    Only admin/manager roles can do this.
    Status transitions are enforced — you can't skip from submitted to delivered.
    """
    if current_user.role not in ("admin", "super_admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")

    req = db.query(ProcurementRequest).filter(
        ProcurementRequest.id == request_id,
        ProcurementRequest.is_active == True,
    ).first()

    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")

    # Enforce valid transitions
    VALID_TRANSITIONS = {
        ProcurementStatus.submitted:  [ProcurementStatus.ordered,   ProcurementStatus.cancelled],
        ProcurementStatus.ordered:    [ProcurementStatus.delivered,  ProcurementStatus.cancelled],
        ProcurementStatus.delivered:  [],    # Terminal state
        ProcurementStatus.cancelled:  [],    # Terminal state
        ProcurementStatus.draft:      [ProcurementStatus.submitted],
    }

    allowed = VALID_TRANSITIONS.get(req.status, [])
    if data.status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transition from '{req.status.value}' to '{data.status.value}'",
        )

    req.status = data.status
    db.commit()
    db.refresh(req)
    return req


def cancel_request(db: Session, request_id: str, current_user: User) -> None:
    """
    Cancel (soft-delete) a request. Staff can only cancel their own submitted requests.
    Admins can cancel any request.
    """
    req = get_request(db, request_id, current_user)

    if req.status in (ProcurementStatus.delivered,):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel a request that has already been delivered",
        )

    req.is_active = False
    db.commit()
