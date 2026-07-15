"""
Vendor repository — all database interactions for the vendors domain.

Rules:
  - Only this file writes db.query(), db.add(), db.flush()
  - Never calls db.commit() — the router owns the transaction boundary
  - No business logic, no HTTP concerns
"""

import secrets
import string
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.vendors.models import Vendor
from app.shared.models.document import Document


class VendorRepository:
    def __init__(self, db: Session):
        self.db = db

    # ── Vendor CRUD ─────────────────────────────────────────────────────────────

    def get_by_id(self, vendor_id: str) -> Vendor | None:
        return self.db.query(Vendor).filter(Vendor.id == vendor_id).first()

    def list(
        self,
        skip: int = 0,
        limit: int = 100,
        search: str | None = None,
        include_inactive: bool = False,
    ) -> list[Vendor]:
        query = self.db.query(Vendor)
        if not include_inactive:
            query = query.filter(Vendor.is_active == True)  # noqa: E712
        if search:
            query = query.filter(Vendor.name.ilike(f"%{search}%"))
        return query.order_by(Vendor.name).offset(skip).limit(limit).all()

    def code_exists(self, code: str) -> bool:
        return self.db.query(Vendor).filter(Vendor.vendor_code == code).first() is not None

    def name_exists(self, name: str, exclude_id: str | None = None) -> bool:
        q = self.db.query(Vendor).filter(func.lower(Vendor.name) == name.strip().lower())
        if exclude_id:
            q = q.filter(Vendor.id != exclude_id)
        return q.first() is not None

    def email_exists(self, email: str, exclude_id: str | None = None) -> bool:
        q = self.db.query(Vendor).filter(func.lower(Vendor.email) == email.strip().lower())
        if exclude_id:
            q = q.filter(Vendor.id != exclude_id)
        return q.first() is not None

    def add(self, vendor: Vendor) -> Vendor:
        """Stage a new vendor for insert. Does NOT commit — caller commits."""
        self.db.add(vendor)
        self.db.flush()
        return vendor

    def flush(self) -> None:
        """Flush pending changes to the DB transaction without committing."""
        self.db.flush()

    # ── Document / folder helpers ────────────────────────────────────────────────

    def get_or_create_folder(self, name: str, parent_id: int | None) -> Document:
        folder = self.db.query(Document).filter(
            Document.type == "folder",
            Document.name == name,
            Document.parent_id == parent_id,
        ).first()
        if not folder:
            folder = Document(type="folder", name=name, parent_id=parent_id)
            self.db.add(folder)
            self.db.flush()
        return folder

    def get_vendors_folder(self) -> Document:
        return self.get_or_create_folder("Vendors", None)

    def get_document_by_id(self, doc_id: int) -> Document | None:
        return self.db.query(Document).filter(Document.id == doc_id).first()

    def add_document(self, doc: Document) -> Document:
        self.db.add(doc)
        self.db.flush()
        return doc
