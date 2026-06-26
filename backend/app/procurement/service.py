"""
<<<<<<< HEAD
Procurement service — business logic for procurement requests and purchase orders.

Workflow:
  1. Employee creates a request (status: draft)
  2. Employee submits it (draft → pending)
  3. Line manager approves/rejects/returns (pending → approved | rejected | returned)
  4. Procurement officer issues a PO (approved → po_issued), which:
       - Creates a PurchaseOrder row
       - Generates a PDF, uploads to Cloudinary
       - Saves the file in the document library under Purchase Orders/{reference}/
       - Stores document_id on the PO row
  5. PO status updated when goods arrive (issued → delivered) or PO is voided (→ cancelled)

Authorization:
  - Any authenticated employee can create / update / submit their own requests
  - admin / super_admin can approve, reject, return, issue PO, update PO status
"""

import logging
from decimal import Decimal
from fastapi import HTTPException, status, UploadFile
from sqlalchemy.orm import Session

from app.procurement.models import ProcurementRequest, ProcurementItem, PurchaseOrder
from app.procurement.repository import ProcurementRepository
from app.procurement.schemas import (
    ProcurementCreate, ProcurementUpdate, ActionRequest,
    IssuePORequest, POStatusUpdate,
)
from app.shared.models.user import User, UserRole
from app.shared.models.document import Document
from app.shared.services import cloudinary_service, pdf_service
from app.shared.exceptions import not_found, forbidden, bad_request
from app.employees.models import Employee

logger = logging.getLogger(__name__)

_VALID_STATUSES = {"draft", "pending", "approved", "rejected", "returned", "po_issued"}
_VALID_PO_STATUSES = {"issued", "delivered", "cancelled"}


class ProcurementService:
    def __init__(self, repo: ProcurementRepository):
        self.repo = repo

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _require_admin(self, user: User) -> None:
        if user.role not in (UserRole.admin, UserRole.super_admin):
            forbidden()

    def _get_or_404(self, request_id: str) -> ProcurementRequest:
        req = self.repo.get_by_id(request_id)
        if not req:
            not_found("PROCUREMENT_NOT_FOUND")
        return req  # type: ignore[return-value]

    def _get_po_or_404(self, po_id: str) -> PurchaseOrder:
        po = self.repo.get_po_by_id(po_id)
        if not po:
            not_found("PO_NOT_FOUND")
        return po  # type: ignore[return-value]

    def _build_items(self, request_id: str, items_data) -> list[ProcurementItem]:
        result = []
        for item_data in items_data:
            unit_price = item_data.unit_price
            total_price = (
                Decimal(str(item_data.quantity)) * unit_price
                if unit_price is not None
                else item_data.total_price
            )
            result.append(ProcurementItem(
                procurement_request_id=request_id,
                description=item_data.description,
                quantity=item_data.quantity,
                unit_price=unit_price,
                total_price=total_price,
            ))
        return result

    # ── Procurement requests ──────────────────────────────────────────────────

    def list_requests(
        self,
        current_user: User,
        employee: Employee,
        skip: int = 0,
        limit: int = 50,
        status_filter: str | None = None,
    ) -> list[ProcurementRequest]:
        # Staff only see their own requests; admin/super_admin see all
        raised_by = None if current_user.role in (UserRole.admin, UserRole.super_admin) else employee.id
        return self.repo.list(skip=skip, limit=limit, raised_by=raised_by, status=status_filter)

    def get_request(self, request_id: str, current_user: User, employee: Employee) -> ProcurementRequest:
        req = self._get_or_404(request_id)
        if current_user.role not in (UserRole.admin, UserRole.super_admin) and req.raised_by != employee.id:
            forbidden()
        return req

    def create_request(self, data: ProcurementCreate, employee: Employee) -> ProcurementRequest:
        reference = self.repo.next_request_reference()
        req = ProcurementRequest(
            reference=reference,
            raised_by=employee.id,
            title=data.title,
            description=data.description,
            estimated_amount=data.estimated_amount,
            currency=data.currency,
            vendor_id=data.vendor_id,
            status="draft",
        )
        self.repo.add(req)
        for item in self._build_items(req.id, data.items):
            self.repo.add_item(item)
        self.repo.db.flush()
        return req

    def update_request(self, request_id: str, data: ProcurementUpdate, employee: Employee) -> ProcurementRequest:
        req = self._get_or_404(request_id)
        if req.raised_by != employee.id:
            forbidden("PROCUREMENT_ACCESS_DENIED", "You can only edit your own requests")
        if req.status != "draft":
            bad_request("PROCUREMENT_NOT_EDITABLE", "Only draft requests can be edited")

        for field, value in data.model_dump(exclude_unset=True, exclude={"items"}).items():
            setattr(req, field, value)

        if data.items is not None:
            self.repo.replace_items(req.id, self._build_items(req.id, data.items))

        return req

    def submit_request(self, request_id: str, employee: Employee) -> ProcurementRequest:
        req = self._get_or_404(request_id)
        if req.raised_by != employee.id:
            forbidden("PROCUREMENT_ACCESS_DENIED", "You can only submit your own requests")
        if req.status != "draft":
            bad_request("INVALID_STATUS_TRANSITION", f"Cannot submit a request with status '{req.status}'")
        if not req.items:
            bad_request("PROCUREMENT_NO_ITEMS", "Add at least one line item before submitting")
        req.status = "pending"
        return req

    def approve_request(self, request_id: str, body: ActionRequest, current_user: User) -> ProcurementRequest:
        self._require_admin(current_user)
        req = self._get_or_404(request_id)
        if req.status != "pending":
            bad_request("INVALID_STATUS_TRANSITION", f"Cannot approve a request with status '{req.status}'")
        req.status = "approved"
        return req

    def reject_request(self, request_id: str, body: ActionRequest, current_user: User) -> ProcurementRequest:
        self._require_admin(current_user)
        req = self._get_or_404(request_id)
        if req.status not in ("pending", "approved"):
            bad_request("INVALID_STATUS_TRANSITION", f"Cannot reject a request with status '{req.status}'")
        req.status = "rejected"
        return req

    def return_request(self, request_id: str, body: ActionRequest, current_user: User) -> ProcurementRequest:
        self._require_admin(current_user)
        req = self._get_or_404(request_id)
        if req.status not in ("pending", "approved"):
            bad_request("INVALID_STATUS_TRANSITION", f"Cannot return a request with status '{req.status}'")
        req.status = "returned"
        return req

    # ── Purchase orders ───────────────────────────────────────────────────────

    def issue_po(
        self,
        request_id: str,
        body: IssuePORequest,
        current_user: User,
        issuer_employee: Employee,
    ) -> PurchaseOrder:
        self._require_admin(current_user)
        req = self._get_or_404(request_id)

        if req.status != "approved":
            bad_request("INVALID_STATUS_TRANSITION", "Only approved requests can have a PO issued")

        vendor_id = body.vendor_id or req.vendor_id
        if not vendor_id:
            bad_request("PROCUREMENT_VENDOR_REQUIRED", "A vendor must be assigned before issuing a PO")

        # Compute total from items
        total = sum(
            (item.total_price or Decimal("0")) for item in req.items
        )

        po_number = self.repo.next_po_number()

        po = PurchaseOrder(
            po_number=po_number,
            procurement_request_id=req.id,
            vendor_id=vendor_id,
            total_amount=total,
            currency=req.currency,
            issued_by=issuer_employee.id,
            status="issued",
            notes=body.notes,
        )
        self.repo.add_po(po)

        # Generate and save the PO PDF
        self._attach_po_pdf(req, po, issuer_employee)

        # Advance request status
        req.status = "po_issued"
        return po

    def _attach_po_pdf(
        self,
        req: ProcurementRequest,
        po: PurchaseOrder,
        issuer: Employee,
    ) -> None:
        """Generate the PO PDF, upload it, save to document library, link to PO."""
        try:
            vendor = po.vendor or req.vendor
            items_for_pdf = [
                {
                    "description": item.description,
                    "quantity": item.quantity,
                    "unit_cost": item.unit_price,
                    "total_cost": item.total_price,
                }
                for item in req.items
            ]

            issuer_name = (
                f"{issuer.user.first_name or ''} {issuer.user.last_name or ''}".strip()
                if issuer.user else issuer.employee_no
            )

            import datetime as _dt
            pdf_bytes = pdf_service.generate_purchase_order(
                reference=po.po_number,
                title=req.title,
                category="",
                priority="",
                justification=req.description,
                required_by=None,
                vendor_name=vendor.name if vendor else None,
                vendor_address=vendor.address if vendor else None,
                vendor_phone=vendor.phone if vendor else None,
                vendor_email=vendor.email if vendor else None,
                items=items_for_pdf,
                requester_name=issuer_name,
                created_at=_dt.date.today(),
            )

            url = cloudinary_service.upload(
                pdf_bytes,
                public_id=po.po_number,
                folder="portland-gas/purchase-orders",
                resource_type="raw",
                overwrite=True,
            )

            # Save to document library under Purchase Orders / {reference} /
            folder = self.repo.get_po_folder(req.reference)
            doc = Document(
                type="file",
                name=f"{po.po_number}.pdf",
                category="purchase_order",
                file_path=url,
                file_size=len(pdf_bytes),
                mime_type="application/pdf",
                uploaded_by=issuer.id,
                parent_id=folder.id,
            )
            saved_doc = self.repo.add_document(doc)
            po.document_id = saved_doc.id

        except Exception:
            # PDF failure must not block the PO from being issued
            logger.exception("PO PDF generation failed for %s", po.po_number)

    def list_pos(self, request_id: str | None = None) -> list[PurchaseOrder]:
        return self.repo.list_pos(request_id=request_id)

    def get_po(self, po_id: str) -> PurchaseOrder:
        return self._get_po_or_404(po_id)

    def update_po_status(self, po_id: str, data: POStatusUpdate, current_user: User) -> PurchaseOrder:
        self._require_admin(current_user)
        po = self._get_po_or_404(po_id)
        if po.status == "cancelled":
            bad_request("PO_ALREADY_CANCELLED", "A cancelled PO cannot be updated")
        if data.status == "delivered" and po.status != "issued":
            bad_request("INVALID_STATUS_TRANSITION", "Only an issued PO can be marked as delivered")
        po.status = data.status
        return po
=======
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
from app.procurement.models import ProcurementRequest, ProcurementItem, ProcurementStatus
from app.shared.models.user import User
from app.procurement.schemas import ProcurementCreate, ProcurementUpdate, ProcurementStatusUpdate
from app.shared.services import cloudinary_service, pdf_service
from app.vendors.service import VendorService
from app.vendors.repository import VendorRepository
from app.shared.utils.helpers import generate_reference

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
        VendorService(VendorRepository(db)).get_vendor(data.vendor_id)   # Raises 404 if not found

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
>>>>>>> c7b4c06 (merging)
