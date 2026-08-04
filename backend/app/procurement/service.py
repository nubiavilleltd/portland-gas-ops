"""
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

_VALID_STATUSES = {"draft", "pending", "approved", "rejected", "returned", "awaiting_confirmation", "completed"}
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
                unit=item_data.unit,
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
        vendor_id: str | None = None,
    ) -> list[ProcurementRequest]:
        # Staff only see their own requests; admin/super_admin see all
        raised_by = None if current_user.role in (UserRole.admin, UserRole.super_admin) else employee.id
        return self.repo.list(skip=skip, limit=limit, raised_by=raised_by, status=status_filter, vendor_id=vendor_id)

    def get_request(self, request_id: str, current_user: User, employee: Employee) -> ProcurementRequest:
        req = self._get_or_404(request_id)
        if current_user.role not in (UserRole.admin, UserRole.super_admin) and req.raised_by != employee.id:
            forbidden()
        return req

    def create_request(self, data: ProcurementCreate, employee: Employee, file_bytes: bytes | None = None, filename: str | None = None) -> ProcurementRequest:
        from app.shared.services.workflow_engine import WorkflowEngine
        if not data.vendor_id or not data.vendor_id.strip():
            bad_request("PROCUREMENT_VENDOR_REQUIRED", "A vendor must be selected or created before submitting a request")
        reference = self.repo.next_request_reference()
        # Compute estimated amount from line item totals if not explicitly provided
        computed_amount = data.estimated_amount
        if computed_amount is None and data.items:
            computed_amount = sum(
                (item.total_price or Decimal("0")) for item in data.items
            ) or None
        req = ProcurementRequest(
            reference=reference,
            raised_by=employee.id,
            category=data.category,
            description=data.description,
            estimated_amount=computed_amount,
            currency=data.currency,
            required_by=data.required_by,
            vendor_id=data.vendor_id,
            status="pending",
        )
        self.repo.add(req)
        for item in self._build_items(req.id, data.items):
            self.repo.add_item(item)
        if file_bytes and filename:
            self._attach_supporting_doc(req, file_bytes, filename, employee)
        self.repo.db.flush()

        # Start approval workflow — creates approval_request, notifies approver.
        # Does not commit; the router commits the full transaction.
        title = f"{req.category or 'Procurement'} — {req.reference}"
        engine = WorkflowEngine(self.repo.db)
        engine.start(
            request_type="procurement",
            request_id=req.id,
            title=title,
            requester=employee,
            picked_approvers=data.picked_approvers or None,
        )

        return req

    def _attach_supporting_doc(
        self,
        req: ProcurementRequest,
        file_bytes: bytes,
        filename: str,
        uploader: Employee,
    ) -> None:
        """Upload supporting document to Cloudinary and save to document library."""
        try:
            import mimetypes
            mime_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
            resource_type = "raw" if mime_type == "application/pdf" else "auto"

            url = cloudinary_service.upload(
                file_bytes,
                public_id=filename,
                folder="portland-gas/procurement-attachments",
                resource_type=resource_type,
                overwrite=False,
            )

            folder = self.repo.get_purchase_requests_folder()
            doc = Document(
                type="file",
                name=filename,
                category="procurement",
                file_path=url,
                file_size=len(file_bytes),
                mime_type=mime_type,
                uploaded_by=uploader.id,
                parent_id=folder.id,
            )
            saved_doc = self.repo.add_document(doc)
            req.attachment_id = saved_doc.id
        except Exception:
            logger.exception("Supporting doc upload failed for request %s", req.reference)

    def remove_attachment(self, request_id: str, employee: Employee) -> ProcurementRequest:
        req = self._get_or_404(request_id)
        if req.raised_by != employee.id:
            forbidden("PROCUREMENT_ACCESS_DENIED", "You can only edit your own requests")
        if req.status not in ("draft", "returned"):
            bad_request("PROCUREMENT_NOT_EDITABLE", "Attachments can only be changed on draft or returned requests")
        if req.attachment_id:
            self.repo.delete_document(req.attachment_id)
            req.attachment_id = None
        return req

    def upload_attachment(self, request_id: str, file_bytes: bytes, filename: str, employee: Employee) -> ProcurementRequest:
        req = self._get_or_404(request_id)
        if req.raised_by != employee.id:
            forbidden("PROCUREMENT_ACCESS_DENIED", "You can only edit your own requests")
        # Delete old attachment if it exists
        if req.attachment_id:
            self.repo.delete_document(req.attachment_id)
            req.attachment_id = None
        self._attach_supporting_doc(req, file_bytes, filename, employee)
        return req

    def update_request(self, request_id: str, data: ProcurementUpdate, employee: Employee) -> ProcurementRequest:
        req = self._get_or_404(request_id)
        if req.raised_by != employee.id:
            forbidden("PROCUREMENT_ACCESS_DENIED", "You can only edit your own requests")
        if req.status not in ("draft", "returned"):
            bad_request("PROCUREMENT_NOT_EDITABLE", "Only draft or returned requests can be edited")

        for field, value in data.model_dump(exclude_unset=True, exclude={"items"}).items():
            setattr(req, field, value)

        if data.items is not None:
            self.repo.replace_items(req.id, self._build_items(req.id, data.items))

        return req

    def submit_request(self, request_id: str, employee: Employee) -> ProcurementRequest:
        """Resubmit after a request was returned. Starts a new workflow attempt."""
        from app.shared.services.workflow_engine import WorkflowEngine
        req = self._get_or_404(request_id)
        if req.raised_by != employee.id:
            forbidden("PROCUREMENT_ACCESS_DENIED", "You can only submit your own requests")
        if req.status != "returned":
            bad_request("INVALID_STATUS_TRANSITION", f"Only returned requests can be resubmitted (current status: '{req.status}')")
        if not req.items:
            bad_request("PROCUREMENT_NO_ITEMS", "Add at least one line item before resubmitting")

        req.status = "pending"

        title = f"{req.category or 'Procurement'} — {req.reference}"
        engine = WorkflowEngine(self.repo.db)
        engine.start(
            request_type="procurement",
            request_id=req.id,
            title=title,
            requester=employee,
        )

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
        req.status = "awaiting_confirmation"
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
                    "unit": item.unit or "",
                    "unit_cost": item.unit_price,
                    "total_cost": item.total_price,
                }
                for item in req.items
            ]

            issuer_name = (
                f"{issuer.user.first_name or ''} {issuer.user.last_name or ''}".strip()
                if issuer.user else issuer.employee_no
            )

            # Raised By = the employee who submitted the request (not the PO issuer)
            raiser = req.raiser if hasattr(req, "raiser") and req.raiser else None
            if raiser and raiser.user:
                requester_name = f"{raiser.user.first_name or ''} {raiser.user.last_name or ''}".strip() or raiser.employee_no
            elif raiser:
                requester_name = raiser.employee_no
            else:
                requester_name = issuer_name  # fallback

            import datetime as _dt
            category_label = req.category.replace("_", " ").title() if req.category else ""
            pdf_bytes = pdf_service.generate_purchase_order(
                reference=po.po_number,
                title=f"{category_label} Request" if category_label else "Procurement Request",
                category=category_label,
                priority="",
                justification=req.description,
                required_by=None,
                vendor_name=vendor.name if vendor else None,
                vendor_address=vendor.address if vendor else None,
                vendor_phone=vendor.phone if vendor else None,
                vendor_email=vendor.email if vendor else None,
                items=items_for_pdf,
                requester_name=requester_name,
                created_at=_dt.date.today(),
                authorized_by=issuer_name,
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

    def confirm_delivery_internal(self, request_id: str) -> None:
        """Mark the issued PO as delivered and close the request. Called by confirm-delivery endpoint."""
        req = self._get_or_404(request_id)
        issued_po = next((po for po in req.purchase_orders if po.status == "issued"), None)
        if issued_po:
            issued_po.status = "delivered"
        req.status = "completed"

    def issue_po_internal(
        self,
        request_id: str,
        body: IssuePORequest,
        issuer_employee: Employee,
    ) -> PurchaseOrder:
        """Issue a PO without admin role check — for use by approve-and-issue-po."""
        req = self._get_or_404(request_id)

        if req.status != "approved":
            bad_request("INVALID_STATUS_TRANSITION", "Only approved requests can have a PO issued")

        vendor_id = body.vendor_id or req.vendor_id
        if not vendor_id:
            bad_request("PROCUREMENT_VENDOR_REQUIRED", "A vendor must be assigned before issuing a PO")

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
        self._attach_po_pdf(req, po, issuer_employee)
        req.status = "awaiting_confirmation"
        return po

    def regenerate_po_pdf(
        self,
        request_id: str,
        po_id: str,
        current_user: User,
        issuer_employee: Employee,
    ) -> ProcurementRequest:
        self._require_admin(current_user)
        req = self._get_or_404(request_id)
        po = next((p for p in req.purchase_orders if p.id == po_id), None)
        if not po:
            not_found("PO_NOT_FOUND")
        self._attach_po_pdf(req, po, issuer_employee)
        return req

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
        # Goods received — close the procurement request
        if data.status == "delivered" and po.procurement_request:
            po.procurement_request.status = "completed"
        return po
