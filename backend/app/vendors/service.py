"""
Vendor service — business logic for the vendors domain.

Rules:
  - No db.query() calls — all DB access goes through VendorRepository
  - No db.commit() — the router owns the transaction boundary
  - Calls cloudinary_service for file uploads
  - Raises HTTPException for domain errors (pragmatic FastAPI approach)
"""

import secrets
import string
from typing import cast
from fastapi import HTTPException, status, UploadFile
from app.vendors.models import Vendor, VendorStatus
from app.shared.models.document import Document
from app.vendors.schemas import VendorCreate, VendorUpdate
from app.vendors.repository import VendorRepository
from app.shared.services import cloudinary_service


class VendorService:
    def __init__(self, repo: VendorRepository):
        self.repo = repo

    # ── Internal helpers ─────────────────────────────────────────────────────────

    def _generate_vendor_code(self, name: str) -> str:
        """
        Generate a unique vendor code: XX-YYYY (2-letter prefix + 4 random chars).
        Retries up to 10 times to avoid collisions (36^4 = 1.6M combinations).
        """
        prefix = "".join(c for c in name.upper() if c.isalpha())[:2] or "VN"
        chars = string.ascii_uppercase + string.digits
        for _ in range(10):
            suffix = "".join(secrets.choice(chars) for _ in range(4))
            code = f"{prefix}-{suffix}"
            if not self.repo.code_exists(code):
                return code
        raise RuntimeError("Could not generate a unique vendor code after 10 attempts")

    # ── Read ─────────────────────────────────────────────────────────────────────

    def list_vendors(
        self,
        skip: int = 0,
        limit: int = 100,
        search: str | None = None,
        include_inactive: bool = False,
        vendor_type: str | None = None,
    ) -> list[Vendor]:
        return self.repo.list(skip=skip, limit=limit, search=search, include_inactive=include_inactive, vendor_type=vendor_type)

    def get_vendor(self, vendor_id: str) -> Vendor:
        """Fetch a single vendor by ID regardless of active status. Raises 404 if not found."""
        vendor = self.repo.get_by_id(vendor_id)
        if not vendor:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vendor not found")
        return vendor

    # ── Write ────────────────────────────────────────────────────────────────────

    def create_vendor(self, data: VendorCreate, added_by: str) -> Vendor:
        if self.repo.name_exists(data.name):
            raise HTTPException(status_code=400, detail="A vendor with this name already exists")
        if self.repo.email_exists(str(data.email)):
            raise HTTPException(status_code=400, detail="A vendor with this email address already exists")
        vendor_code = self._generate_vendor_code(data.name)
        vendor = Vendor(**data.model_dump(), added_by=added_by, vendor_code=vendor_code)
        return self.repo.add(vendor)

    def update_vendor(self, vendor_id: str, data: VendorUpdate) -> Vendor:
        """Only updates fields that were sent (exclude_unset=True)."""
        vendor = self.get_vendor(vendor_id)
        updates = data.model_dump(exclude_unset=True)
        if "name" in updates and self.repo.name_exists(updates["name"], exclude_id=vendor_id):
            raise HTTPException(status_code=400, detail="A vendor with this name already exists")
        if "email" in updates and updates["email"] and self.repo.email_exists(str(updates["email"]), exclude_id=vendor_id):
            raise HTTPException(status_code=400, detail="A vendor with this email address already exists")
        for field, value in updates.items():
            setattr(vendor, field, value)
        self.repo.flush()
        return vendor

    def delete_vendor(self, vendor_id: str) -> None:
        """
        Soft-delete: set is_active=False.
        Hard delete is never done — existing procurement requests reference this vendor.
        """
        vendor = self.get_vendor(vendor_id)
        vendor.is_active = False
        vendor.status = VendorStatus.inactive
        self.repo.flush()

    def deactivate_vendor(self, vendor_id: str) -> Vendor:
        """Hide vendor from procurement dropdowns without deleting history."""
        vendor = self.get_vendor(vendor_id)
        if vendor.is_active == False:  # noqa: E712
            raise HTTPException(status_code=400, detail="Vendor is already inactive")
        vendor.is_active = False
        vendor.status = VendorStatus.inactive
        self.repo.flush()
        return vendor

    def reactivate_vendor(self, vendor_id: str) -> Vendor:
        """Restore a deactivated vendor."""
        vendor = self.get_vendor(vendor_id)
        if vendor.is_active == True:  # noqa: E712
            raise HTTPException(status_code=400, detail="Vendor is already active")
        vendor.is_active = True
        vendor.status = VendorStatus.active
        self.repo.flush()
        return vendor

    def upload_vendor_logo(
        self,
        vendor_id: str,
        file: UploadFile,
        uploader_employee_id: str,
    ) -> Vendor:
        vendor = self.get_vendor(vendor_id)

        ALLOWED = {"image/png", "image/jpeg", "image/webp", "image/svg+xml"}
        if file.content_type not in ALLOWED:
            raise HTTPException(status_code=400, detail="Only PNG, JPG, WebP or SVG images are allowed")

        file_bytes = file.file.read()
        if len(file_bytes) > 2 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Logo must be 2 MB or smaller")

        url = cloudinary_service.upload(
            file_bytes,
            public_id=f"vendor-{vendor_id}-logo",
            folder="portland-gas/vendor-logos",
            resource_type="image",
        )

        folder = self.repo.get_vendors_folder()

        # Replace existing logo document if one exists
        if vendor.logo_document_id is not None:
            existing = self.repo.get_document_by_id(cast(int, vendor.logo_document_id))
            if existing:
                existing.file_path = url  # type: ignore[assignment]
                existing.file_size = len(file_bytes)  # type: ignore[assignment]
                existing.mime_type = file.content_type  # type: ignore[assignment]
                existing.name = file.filename or f"{vendor.name} logo"  # type: ignore[assignment]
                self.repo.flush()
                return vendor

        doc = Document(
            type="file",
            name=file.filename or f"{vendor.name} logo",
            category="vendor",
            file_path=url,
            file_size=len(file_bytes),
            mime_type=file.content_type,
            uploaded_by=uploader_employee_id,
            parent_id=folder.id,
        )
        self.repo.add_document(doc)
        vendor.logo_document_id = doc.id
        self.repo.flush()
        return vendor

    # ── Compliance Document Uploads ───────────────────────────────────────────────

    def _upload_vendor_document(
        self,
        vendor_id: str,
        file: UploadFile,
        uploader_employee_id: str,
        document_type: str,  # "cac" | "tin" | "vat"
        document_id_attr: str,  # e.g. "cac_certificate_document_id"
    ) -> Vendor:
        """Generic helper to upload a compliance document for a vendor."""
        vendor = self.get_vendor(vendor_id)

        if file.content_type != "application/pdf":
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")

        file_bytes = file.file.read()
        if len(file_bytes) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File must be 5 MB or smaller")

        url = cloudinary_service.upload(
            file_bytes,
            public_id=f"vendor-{vendor_id}-{document_type}",
            folder="portland-gas/vendor-documents",
            resource_type="auto",
        )

        folder = self.repo.get_vendors_folder()

        # Replace existing document if one exists
        existing_doc_id = getattr(vendor, document_id_attr)
        if existing_doc_id is not None:
            existing = self.repo.get_document_by_id(existing_doc_id)
            if existing:
                existing.file_path = url
                existing.file_size = len(file_bytes)
                existing.mime_type = file.content_type
                existing.name = file.filename or f"{vendor.name} {document_type.upper()} certificate"
                self.repo.flush()
                return vendor

        doc = Document(
            type="file",
            name=file.filename or f"{vendor.name} {document_type.upper()} certificate",
            category="vendor",
            file_path=url,
            file_size=len(file_bytes),
            mime_type=file.content_type,
            uploaded_by=uploader_employee_id,
            parent_id=folder.id,
        )
        self.repo.add_document(doc)
        setattr(vendor, document_id_attr, doc.id)
        self.repo.flush()
        return vendor

    def upload_cac_certificate(
        self, vendor_id: str, file: UploadFile, uploader_employee_id: str
    ) -> Vendor:
        return self._upload_vendor_document(
            vendor_id, file, uploader_employee_id, "cac", "cac_certificate_document_id"
        )

    def upload_tin_certificate(
        self, vendor_id: str, file: UploadFile, uploader_employee_id: str
    ) -> Vendor:
        return self._upload_vendor_document(
            vendor_id, file, uploader_employee_id, "tin", "tin_certificate_document_id"
        )

    def upload_vat_certificate(
        self, vendor_id: str, file: UploadFile, uploader_employee_id: str
    ) -> Vendor:
        return self._upload_vendor_document(
            vendor_id, file, uploader_employee_id, "vat", "vat_certificate_document_id"
        )

    def delete_vendor_document(
        self, vendor_id: str, document_type: str
    ) -> Vendor:
        """Delete a compliance document from a vendor."""
        vendor = self.get_vendor(vendor_id)

        attr_map = {
            "cac": "cac_certificate_document_id",
            "tin": "tin_certificate_document_id",
            "vat": "vat_certificate_document_id",
        }
        if document_type not in attr_map:
            raise HTTPException(status_code=400, detail="Invalid document type")

        document_id_attr = attr_map[document_type]
        doc_id = getattr(vendor, document_id_attr)

        if doc_id is None:
            raise HTTPException(status_code=404, detail=f"No {document_type.upper()} certificate found")

        # Clear the reference
        setattr(vendor, document_id_attr, None)
        self.repo.flush()

        # Optionally delete the document record (keeping for audit trail)
        # doc = self.repo.get_document_by_id(doc_id)
        # if doc:
        #     self.repo.delete_document(doc)

        return vendor
