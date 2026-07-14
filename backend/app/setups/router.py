"""
Setups router — /api/setups

Admin endpoints (require admin or super_admin role):
  GET    /groups                          list all groups
  POST   /groups                          create group
  GET    /groups/{group_id}               group detail + members
  PATCH  /groups/{group_id}               update group
  POST   /groups/{group_id}/members       add member
  DELETE /groups/{group_id}/members/{id}  remove member
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.shared.dependencies import require_roles, get_current_user
from app.shared.models.user import User
from app.employees.service import get_employee_by_user_id
from app.setups import service as svc
from app.setups.schemas import (
    GroupCreate, GroupUpdate, GroupListItem, GroupDetail, AddMember, MemberOut,
)

router = APIRouter()

_admin = Depends(require_roles("admin", "super_admin"))


@router.get("/groups", response_model=List[GroupListItem])
def list_groups(
    db: Session = Depends(get_db),
    current_user: User = _admin,
):
    return svc.list_groups(db)


@router.post("/groups", response_model=GroupDetail, status_code=201)
def create_group(
    data: GroupCreate,
    db: Session = Depends(get_db),
    current_user: User = _admin,
):
    emp = get_employee_by_user_id(current_user.id, db)
    g = svc.create_group(data, emp.id, db)
    db.commit()
    db.refresh(g)
    return {
        "id":          g.id,
        "name":        g.name,
        "description": g.description,
        "group_type":  g.group_type,
        "is_active":   g.is_active,
        "created_at":  g.created_at,
        "members":     [],
    }


@router.get("/groups/{group_id}", response_model=GroupDetail)
def get_group(
    group_id: str,
    db: Session = Depends(get_db),
    current_user: User = _admin,
):
    return svc.get_group(group_id, db)


@router.patch("/groups/{group_id}", response_model=GroupDetail)
def update_group(
    group_id: str,
    data: GroupUpdate,
    db: Session = Depends(get_db),
    current_user: User = _admin,
):
    svc.update_group(group_id, data, db)
    db.commit()
    return svc.get_group(group_id, db)


@router.post("/groups/{group_id}/members", response_model=MemberOut, status_code=201)
def add_group_member(
    group_id: str,
    data: AddMember,
    db: Session = Depends(get_db),
    current_user: User = _admin,
):
    result = svc.add_group_member(group_id, data, db)
    db.commit()
    return result


@router.delete("/groups/{group_id}/members/{member_id}", status_code=204)
def remove_group_member(
    group_id: str,
    member_id: str,
    db: Session = Depends(get_db),
    current_user: User = _admin,
):
    svc.remove_group_member(group_id, member_id, db)
    db.commit()
