"""
Vendors router — /api/vendors

HTTP layer only. Each endpoint:
  1. Creates service (wired to repo + db session)
  2. Calls service method (service flushes, does not commit)
  3. Commits the transaction
  4. Refreshes the object (reloads DB-generated fields)
  5. Returns response

Why commit in the router?
  The router is the outermost layer that controls the HTTP request boundary.
  Committing here means the entire service call is one atomic transaction.
  If anything fails inside the service, FastAPI's session teardown rolls back.
"""

from fastapi import APIRouter, Depends, Query, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.shared.dependencies import get_current_user
from app.shared.models.user import User, UserRole
from app.vendors.schemas import VendorCreate, VendorUpdate, VendorResponse
from app.vendors.models import VendorType
from app.vendors.repository import VendorRepository
from app.vendors.service import VendorService
from app.employees.service import get_employee_by_user_id

router = APIRouter()


def _svc(db: Session) -> VendorService:
    """Wire service to repository for this request's DB session."""
    return VendorService(VendorRepository(db))


def _require_manager(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in (UserRole.admin, UserRole.super_admin):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Managers only")
    return current_user


@router.get("/", response_model=List[VendorResponse])
def list_vendors(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    search: Optional[str] = Query(None, description="Search vendors by name"),
    include_inactive: bool = Query(False, description="Include inactive vendors — admin only"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if include_inactive and current_user.role not in (UserRole.admin, UserRole.super_admin):
        include_inactive = False
    return _svc(db).list_vendors(skip=skip, limit=limit, search=search, include_inactive=include_inactive)


@router.post("/", response_model=VendorResponse, status_code=201)
def create_vendor(
    data: VendorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Non-admins can only create temporary vendors (inline during procurement)
    if current_user.role not in (UserRole.admin, UserRole.super_admin):
        data = data.model_copy(update={"vendor_type": VendorType.temporary})
    vendor = _svc(db).create_vendor(data, added_by=current_user.id)
    db.commit()
    db.refresh(vendor)
    return vendor


@router.get("/{vendor_id}", response_model=VendorResponse)
def get_vendor(
    vendor_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _svc(db).get_vendor(vendor_id)


@router.patch("/{vendor_id}", response_model=VendorResponse)
def update_vendor(
    vendor_id: str,
    data: VendorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_manager),
):
    vendor = _svc(db).update_vendor(vendor_id, data)
    db.commit()
    db.refresh(vendor)
    return vendor


@router.delete("/{vendor_id}", status_code=204)
def delete_vendor(
    vendor_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in (UserRole.admin, UserRole.super_admin):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admins only")
    _svc(db).delete_vendor(vendor_id)
    db.commit()


@router.patch("/{vendor_id}/deactivate", response_model=VendorResponse)
def deactivate_vendor(
    vendor_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_manager),
):
    vendor = _svc(db).deactivate_vendor(vendor_id)
    db.commit()
    db.refresh(vendor)
    return vendor


@router.patch("/{vendor_id}/reactivate", response_model=VendorResponse)
def reactivate_vendor(
    vendor_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_manager),
):
    vendor = _svc(db).reactivate_vendor(vendor_id)
    db.commit()
    db.refresh(vendor)
    return vendor


@router.post("/{vendor_id}/logo", response_model=VendorResponse)
def upload_vendor_logo(
    vendor_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_manager),
):
    uploader_emp = get_employee_by_user_id(current_user.id, db)
    vendor = _svc(db).upload_vendor_logo(vendor_id, file, uploader_emp.id)
    db.commit()
    db.refresh(vendor)
    return vendor
