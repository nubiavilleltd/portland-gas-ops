"""
Vendors router — /api/vendors

Endpoints:
  GET    /api/vendors         → list all vendors (with optional ?search=name)
  POST   /api/vendors         → create a vendor (admin/manager only)
  GET    /api/vendors/{id}    → get one vendor
  PATCH  /api/vendors/{id}    → update a vendor (admin/manager only)
  DELETE /api/vendors/{id}    → soft-delete a vendor (admin only)

Why is vendor creation restricted to admin/manager?
  Staff should be able to pick a vendor from the list when raising a request,
  but adding new vendors to the master list should be controlled — you don't
  want unvetted suppliers appearing in the system.
"""

from fastapi import APIRouter, Depends, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User, UserRole
from app.schemas.vendor import VendorCreate, VendorUpdate, VendorResponse
from app.services import vendor_service
from app.services.employee_service import get_employee_by_user_id

router = APIRouter()


def _require_manager(current_user: User = Depends(get_current_user)) -> User:
    """Dependency that blocks non-admin/manager users with a 403."""
    if current_user.role not in (UserRole.admin, UserRole.super_admin):
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Managers only")
    return current_user


@router.get("/", response_model=List[VendorResponse])
def list_vendors(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    search: Optional[str] = Query(None, description="Search vendors by name"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),   # Any logged-in user can see the list
):
    """
    List active vendors. Staff need this to pick a vendor when raising a request.
    search param enables the typeahead dropdown on the procurement form.
    """
    return vendor_service.list_vendors(db, skip=skip, limit=limit, search=search)


@router.post("/", response_model=VendorResponse, status_code=201)
def create_vendor(
    data: VendorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_manager),
):
    return vendor_service.create_vendor(db, data, added_by=current_user.id)


@router.get("/{vendor_id}", response_model=VendorResponse)
def get_vendor(
    vendor_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return vendor_service.get_vendor(db, vendor_id)


@router.patch("/{vendor_id}", response_model=VendorResponse)
def update_vendor(
    vendor_id: str,
    data: VendorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_manager),
):
    return vendor_service.update_vendor(db, vendor_id, data)


@router.delete("/{vendor_id}", status_code=204)
def delete_vendor(
    vendor_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.admin:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admins only")
    vendor_service.delete_vendor(db, vendor_id)


@router.patch("/{vendor_id}/deactivate", response_model=VendorResponse)
def deactivate_vendor(
    vendor_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_manager),
):
    return vendor_service.deactivate_vendor(db, vendor_id)


@router.patch("/{vendor_id}/reactivate", response_model=VendorResponse)
def reactivate_vendor(
    vendor_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_manager),
):
    return vendor_service.reactivate_vendor(db, vendor_id)


@router.post("/{vendor_id}/logo", response_model=VendorResponse)
def upload_vendor_logo(
    vendor_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_manager),
):
    uploader_emp = get_employee_by_user_id(current_user.id, db)
    return vendor_service.upload_vendor_logo_file(vendor_id, file, uploader_emp.id, db)
