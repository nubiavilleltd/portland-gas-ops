"""
Vendor service — all database operations for the Vendor resource.

Why a service layer?
  The router handles HTTP (parsing requests, returning responses).
  The service handles business logic (querying, creating, validating rules).
  Keeping them separate means you can call service functions from other services
  without going through HTTP — e.g. procurement_service calls get_vendor() directly.
"""

from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.vendor import Vendor
from app.schemas.vendor import VendorCreate, VendorUpdate


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
    """
    vendor = Vendor(**data.model_dump(), added_by=added_by)
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
    db.commit()
