"""
Vendor service — all database operations for the Vendor resource.

Why a service layer?
  The router handles HTTP (parsing requests, returning responses).
  The service handles business logic (querying, creating, validating rules).
  Keeping them separate means you can call service functions from other services
  without going through HTTP — e.g. procurement_service calls get_vendor() directly.
"""

import secrets
import string
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, UploadFile
from app.models.vendor import Vendor
from app.models.document import Document
from app.schemas.vendor import VendorCreate, VendorUpdate
from app.utils.cloudinary import upload_vendor_logo


def _get_or_create_folder(name: str, parent_id: int | None, db: Session) -> Document:
    """Return an existing folder or create it. Matched by name + parent."""
    folder = db.query(Document).filter(
        Document.type == "folder",
        Document.name == name,
        Document.parent_id == parent_id,
    ).first()
    if not folder:
        folder = Document(type="folder", name=name, parent_id=parent_id)
        db.add(folder)
        db.flush()
    return folder


def _get_vendors_folder(db: Session) -> Document:
    """Return (or create) the root Vendors folder in the document tree."""
    return _get_or_create_folder("Vendors", None, db)


def _generate_vendor_code(db: Session, name: str) -> str:
    """
    Generate a unique vendor code in the format XX-YYYY where:
      XX   = first 2 letters of the vendor name (uppercased)
      YYYY = 4 random alphanumeric characters

    Retries up to 10 times to avoid collisions (extremely unlikely with 36^4 = 1.6M combos).
    """
    prefix = "".join(c for c in name.upper() if c.isalpha())[:2] or "VN"
    chars = string.ascii_uppercase + string.digits
    for _ in range(10):
        suffix = "".join(secrets.choice(chars) for _ in range(4))
        code = f"{prefix}-{suffix}"
        if not db.query(Vendor).filter(Vendor.vendor_code == code).first():
            return code
    raise RuntimeError("Could not generate a unique vendor code after 10 attempts")


def list_vendors(db: Session, skip: int = 0, limit: int = 100, search: str | None = None):
    """
    Return a paginated list of active vendors.

    search: optional name filter (case-insensitive LIKE query).
    Used by the vendor picker on the procurement form so staff can search by name.
    """
    query = db.query(Vendor).filter(Vendor.is_active == True)
    if search:
        query = query.filter(Vendor.name.ilike(f"%{search}%"))
    return query.order_by(Vendor.name).offset(skip).limit(limit).all()


def get_vendor(db: Session, vendor_id: str) -> Vendor:
    """Fetch a single vendor by ID. Raises 404 if not found."""
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id, Vendor.is_active == True).first()
    if not vendor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vendor not found")
    return vendor


def create_vendor(db: Session, data: VendorCreate, added_by: str) -> Vendor:
    """
    Create a new vendor.

    added_by: the ID of the user creating this vendor (from the JWT token — current_user.id).
    We store this so we know who added each vendor to the system.
    vendor_code is auto-generated from the vendor name + random suffix.
    """
    vendor_code = _generate_vendor_code(db, data.name)
    vendor = Vendor(**data.model_dump(), added_by=added_by, vendor_code=vendor_code)
    db.add(vendor)
    db.commit()
    db.refresh(vendor)   # Reload from DB to get the generated id and created_at
    return vendor


def update_vendor(db: Session, vendor_id: str, data: VendorUpdate) -> Vendor:
    """
    Update vendor fields. Only updates fields that were actually sent (exclude_unset=True).

    exclude_unset means if the client only sends {"phone": "080..."}, only phone is updated.
    Without this, every optional field would be overwritten with None.
    """
    vendor = get_vendor(db, vendor_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(vendor, field, value)
    db.commit()
    db.refresh(vendor)
    return vendor


def delete_vendor(db: Session, vendor_id: str) -> None:
    """
    Soft-delete a vendor by setting is_active=False.

    We never hard-delete because existing procurement requests reference this vendor.
    Deleting the row would break those foreign key relationships.
    """
    vendor = get_vendor(db, vendor_id)
    vendor.is_active = False
    vendor.status = "inactive"
    db.commit()


def deactivate_vendor(db: Session, vendor_id: str) -> Vendor:
    """Hide vendor from procurement dropdowns without deleting their history."""
    vendor = get_vendor(db, vendor_id)
    if not vendor.is_active:
        raise HTTPException(status_code=400, detail="Vendor is already inactive")
    vendor.is_active = False
    vendor.status = "inactive"
    db.commit()
    db.refresh(vendor)
    return vendor


def reactivate_vendor(db: Session, vendor_id: str) -> Vendor:
    """Restore a deactivated vendor so they appear in procurement dropdowns again."""
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vendor not found")
    if vendor.is_active:
        raise HTTPException(status_code=400, detail="Vendor is already active")
    vendor.is_active = True
    vendor.status = "active"
    db.commit()
    db.refresh(vendor)
    return vendor


def upload_vendor_logo_file(
    vendor_id: str,
    file: UploadFile,
    uploader_employee_id: str,
    db: Session,
) -> Vendor:
    """
    Upload a vendor logo to Cloudinary, create a Document row inside the
    Vendors folder, and link it to the vendor via logo_document_id.
    """
    vendor = get_vendor(db, vendor_id)

    ALLOWED = {"image/png", "image/jpeg", "image/webp", "image/svg+xml"}
    if file.content_type not in ALLOWED:
        raise HTTPException(status_code=400, detail="Only PNG, JPG, WebP or SVG images are allowed")

    file_bytes = file.file.read()
    if len(file_bytes) > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Logo must be 2 MB or smaller")

    public_id = f"vendor-{vendor_id}-logo"
    url = upload_vendor_logo(file_bytes, public_id)

    folder = _get_vendors_folder(db)

    # Replace existing logo document if one exists
    if vendor.logo_document_id:
        existing = db.query(Document).filter(Document.id == vendor.logo_document_id).first()
        if existing:
            existing.file_path = url
            existing.file_size = len(file_bytes)
            existing.mime_type = file.content_type
            existing.name = file.filename or f"{vendor.name} logo"
            db.flush()
            db.commit()
            db.refresh(vendor)
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
    db.add(doc)
    db.flush()

    vendor.logo_document_id = doc.id
    db.commit()
    db.refresh(vendor)
    return vendor
