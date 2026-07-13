from fastapi import APIRouter, Depends, Query, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from app.core.database import get_db
from app.shared.models.user import User
from app.shared.dependencies import get_current_user, require_roles
from app.employees.schemas import (
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeProfileUpdate,
    EmployeeResponse,
    EmployeePublicResponse,
    EmployeeListItem,
    DocumentResponse,
    BirthdayResponse,
)
from app.employees import service as employee_service


class RoleUpdate(BaseModel):
    role: str

router = APIRouter()


# ── List ──────────────────────────────────────────────────────────────────────

@router.get("", response_model=List[EmployeeListItem])
def list_employees(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: str = Query(""),
    department: str = Query(""),
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("super_admin", "admin")),
):
    return employee_service.list_employees(db, skip=skip, limit=limit, search=search, department=department)


@router.get("/count")
def count_employees(
    search: str = Query(""),
    department: str = Query(""),
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("super_admin", "admin")),
):
    return {"count": employee_service.count_employees(db, search=search, department=department)}


# ── Create ────────────────────────────────────────────────────────────────────

@router.post("", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(
    data: EmployeeCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("super_admin", "admin")),
):
    return employee_service.create_employee(data, db)


# ── Single employee ───────────────────────────────────────────────────────────

@router.get("/me", response_model=EmployeeResponse)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return employee_service.get_employee_by_user_id(current_user.id, db)


# Must come before /{employee_id} to avoid "birthdays" being captured as an ID
@router.get("/birthdays/week", response_model=List[BirthdayResponse])
def get_week_birthdays(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Returns employees with birthdays today through the next 6 days."""
    return employee_service.get_week_birthdays(db)


@router.get("/{employee_id}", response_model=EmployeePublicResponse)
def get_employee(
    employee_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return employee_service.get_employee(employee_id, db)


# ── Update ────────────────────────────────────────────────────────────────────

@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: str,
    data: EmployeeUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("super_admin", "admin")),
):
    return employee_service.update_employee(employee_id, data, db)


@router.patch("/me/profile", response_model=EmployeeResponse)
def update_own_profile(
    data: EmployeeProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    emp = employee_service.get_employee_by_user_id(current_user.id, db)
    return employee_service.update_own_profile(emp.id, data, db)


# ── Role ──────────────────────────────────────────────────────────────────────

@router.patch("/{employee_id}/role", response_model=EmployeeResponse)
def change_role(
    employee_id: str,
    body: RoleUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("super_admin", "admin")),
):
    return employee_service.change_employee_role(employee_id, body.role, db)


# ── Profile picture ────────────────────────────────────────────────────────────

@router.post("/me/picture", response_model=EmployeeResponse)
def upload_profile_picture(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    emp = employee_service.get_employee_by_user_id(current_user.id, db)
    return employee_service.update_profile_picture(emp.id, current_user.id, file, db)


# ── Status ────────────────────────────────────────────────────────────────────

@router.post("/{employee_id}/deactivate")
def deactivate_employee(
    employee_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("super_admin", "admin")),
):
    return employee_service.deactivate_employee(employee_id, db)


@router.post("/{employee_id}/reactivate")
def reactivate_employee(
    employee_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("super_admin", "admin")),
):
    return employee_service.reactivate_employee(employee_id, db)


@router.post("/{employee_id}/resend-setup")
def resend_setup_email(
    employee_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("super_admin", "admin")),
):
    return employee_service.resend_setup_email(employee_id, db)


# ── Employee Documents ────────────────────────────────────────────────────────

@router.get("/{employee_id}/documents", response_model=List[DocumentResponse])
def list_documents(
    employee_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("super_admin", "admin")),
):
    return employee_service.list_employee_documents(employee_id, db)


@router.post("/{employee_id}/documents", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_document(
    employee_id: str,
    doc_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("super_admin", "admin")),
):
    uploader_emp = employee_service.get_employee_by_user_id(current_user.id, db)
    return employee_service.upload_employee_document(employee_id, uploader_emp.id, file, doc_type, db)


@router.delete("/{employee_id}/documents/{doc_id}", status_code=status.HTTP_200_OK)
def delete_document(
    employee_id: str,
    doc_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("super_admin", "admin")),
):
    return employee_service.delete_employee_document(employee_id, doc_id, db)
