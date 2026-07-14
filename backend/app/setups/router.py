from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.shared.dependencies import get_current_user, require_admin
from app.shared.models.user import User
from app.setups import service
from app.setups.schemas import (
    DepartmentCreate, DepartmentUpdate, DepartmentListItem, DepartmentDetail,
    GroupCreate, GroupUpdate, GroupListItem, GroupDetail, AddMember, MemberOut,
)

router = APIRouter()

_admin = Depends(require_admin)
_user  = Depends(get_current_user)


# ── Departments ────────────────────────────────────────────────────────────────

@router.get("/departments", response_model=list[DepartmentListItem])
def list_departments(
    active_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = _user,
):
    return service.list_departments(db, active_only=active_only)


@router.get("/departments/{dept_id}", response_model=DepartmentDetail)
def get_department(
    dept_id: str,
    db: Session = Depends(get_db),
    current_user: User = _user,
):
    return service.get_department(dept_id, db)


@router.post("/departments", response_model=DepartmentDetail, status_code=201)
def create_department(
    data: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = _admin,
):
    return service.create_department(data, db)


@router.patch("/departments/{dept_id}", response_model=DepartmentDetail)
def update_department(
    dept_id: str,
    data: DepartmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = _admin,
):
    return service.update_department(dept_id, data, db)


# ── Groups ─────────────────────────────────────────────────────────────────────

@router.get("/groups", response_model=list[GroupListItem])
def list_groups(
    db: Session = Depends(get_db),
    current_user: User = _admin,
):
    return service.list_groups(db)


@router.post("/groups", response_model=GroupDetail, status_code=201)
def create_group(
    data: GroupCreate,
    db: Session = Depends(get_db),
    current_user: User = _admin,
):
    return service.create_group(data, db)


@router.get("/groups/{group_id}", response_model=GroupDetail)
def get_group(
    group_id: str,
    db: Session = Depends(get_db),
    current_user: User = _admin,
):
    return service.get_group(group_id, db)


@router.patch("/groups/{group_id}", response_model=GroupDetail)
def update_group(
    group_id: str,
    data: GroupUpdate,
    db: Session = Depends(get_db),
    current_user: User = _admin,
):
    svc_result = service.update_group(group_id, data, db)
    return service.get_group(svc_result.id, db)


@router.post("/groups/{group_id}/members", response_model=MemberOut, status_code=201)
def add_member(
    group_id: str,
    data: AddMember,
    db: Session = Depends(get_db),
    current_user: User = _admin,
):
    return service.add_group_member(group_id, data, db)


@router.delete("/groups/{group_id}/members/{member_id}", status_code=204)
def remove_member(
    group_id: str,
    member_id: str,
    db: Session = Depends(get_db),
    current_user: User = _admin,
):
    service.remove_group_member(group_id, member_id, db)
