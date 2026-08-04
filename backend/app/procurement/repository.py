from __future__ import annotations

from sqlalchemy.orm import Session, joinedload

from app.procurement.models import ProcurementRequest, ProcurementItem, PurchaseOrder
from app.employees.models import Employee
from app.shared.models.user import User
from app.shared.models.document import Document
from app.shared.utils.helpers import generate_reference


class ProcurementRepository:
    def __init__(self, db: Session):
        self.db = db

    # ── Reference generation ──────────────────────────────────────────────────

    def next_request_reference(self) -> str:
        return generate_reference("PR", self.db, ProcurementRequest, ProcurementRequest.reference)

    def next_po_number(self) -> str:
        return generate_reference("PO", self.db, PurchaseOrder, PurchaseOrder.po_number)

    # ── Procurement requests ──────────────────────────────────────────────────

    def _eager(self):
        return (
            self.db.query(ProcurementRequest)
            .options(
                joinedload(ProcurementRequest.raiser).joinedload(Employee.user),
                joinedload(ProcurementRequest.vendor),
                joinedload(ProcurementRequest.attachment),
                joinedload(ProcurementRequest.items),
                joinedload(ProcurementRequest.purchase_orders)
                    .joinedload(PurchaseOrder.vendor),
                joinedload(ProcurementRequest.purchase_orders)
                    .joinedload(PurchaseOrder.issuer).joinedload(Employee.user),
                joinedload(ProcurementRequest.purchase_orders)
                    .joinedload(PurchaseOrder.document),
            )
        )

    def get_by_id(self, request_id: str) -> ProcurementRequest | None:
        return self._eager().filter(ProcurementRequest.id == request_id).first()

    def list(
        self,
        skip: int = 0,
        limit: int = 50,
        raised_by: str | None = None,
        status: str | None = None,
        vendor_id: str | None = None,
    ) -> list[ProcurementRequest]:
        q = self._eager()
        if raised_by:
            q = q.filter(ProcurementRequest.raised_by == raised_by)
        if status:
            q = q.filter(ProcurementRequest.status == status)
        if vendor_id:
            q = q.filter(ProcurementRequest.vendor_id == vendor_id)
        return q.order_by(ProcurementRequest.created_at.desc()).offset(skip).limit(limit).all()

    def add(self, request: ProcurementRequest) -> ProcurementRequest:
        self.db.add(request)
        self.db.flush()
        return request

    def add_item(self, item: ProcurementItem) -> None:
        self.db.add(item)

    def replace_items(self, request_id: str, new_items: list[ProcurementItem]) -> None:
        """Delete all existing items for a request and insert the new list."""
        self.db.query(ProcurementItem).filter(
            ProcurementItem.procurement_request_id == request_id
        ).delete()
        for item in new_items:
            self.db.add(item)
        self.db.flush()

    # ── Document folder helpers ───────────────────────────────────────────────

    def _get_or_create_folder(self, name: str, parent_id: int | None) -> Document:
        folder = (
            self.db.query(Document)
            .filter(
                Document.type == "folder",
                Document.name == name,
                Document.parent_id == parent_id,
            )
            .first()
        )
        if not folder:
            folder = Document(type="folder", name=name, parent_id=parent_id)
            self.db.add(folder)
            self.db.flush()
        return folder

    def get_po_folder(self, request_reference: str) -> Document:
        """Return (or create) Purchase Orders / {reference} folder path."""
        root = self._get_or_create_folder("Purchase Orders", None)
        return self._get_or_create_folder(request_reference, root.id)

    def get_purchase_requests_folder(self) -> Document:
        """Return (or create) the Purchase Requests root folder."""
        return self._get_or_create_folder("Purchase Requests", None)

    def add_document(self, doc: Document) -> Document:
        self.db.add(doc)
        self.db.flush()
        return doc

    def delete_document(self, doc_id: int) -> None:
        self.db.query(Document).filter(Document.id == doc_id).delete()
        self.db.flush()

    # ── Purchase orders ───────────────────────────────────────────────────────

    def add_po(self, po: PurchaseOrder) -> PurchaseOrder:
        self.db.add(po)
        self.db.flush()
        return po

    def get_po_by_id(self, po_id: str) -> PurchaseOrder | None:
        return (
            self.db.query(PurchaseOrder)
            .options(
                joinedload(PurchaseOrder.vendor),
                joinedload(PurchaseOrder.issuer).joinedload(Employee.user),
                joinedload(PurchaseOrder.document),
            )
            .filter(PurchaseOrder.id == po_id)
            .first()
        )

    def list_pos(self, request_id: str | None = None) -> list[PurchaseOrder]:
        q = (
            self.db.query(PurchaseOrder)
            .options(
                joinedload(PurchaseOrder.vendor),
                joinedload(PurchaseOrder.issuer).joinedload(Employee.user),
            )
        )
        if request_id:
            q = q.filter(PurchaseOrder.procurement_request_id == request_id)
        return q.order_by(PurchaseOrder.issued_at.desc()).all()
