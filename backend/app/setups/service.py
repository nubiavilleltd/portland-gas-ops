"""
Setups service — CRUD for Groups and Group Members.
"""

import uuid
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from fastapi import HTTPException

from app.setups.models import Group, GroupMember
from app.employees.models import Employee
from app.setups.schemas import GroupCreate, GroupUpdate, AddMember


def _get_group_or_404(group_id: str, db: Session) -> Group:
    g = db.query(Group).filter(Group.id == group_id).first()
    if not g:
        raise HTTPException(404, "Group not found")
    return g


def list_groups(db: Session) -> list:
    rows = (
        db.query(
            Group,
            func.count(GroupMember.id).label("member_count"),
        )
        .outerjoin(GroupMember, GroupMember.group_id == Group.id)
        .group_by(Group.id)
        .order_by(Group.name)
        .all()
    )
    return [
        {
            "id":           g.id,
            "name":         g.name,
            "description":  g.description,
            "group_type":   g.group_type,
            "is_active":    g.is_active,
            "member_count": count,
            "created_at":   g.created_at,
        }
        for g, count in rows
    ]


def create_group(data: GroupCreate, actor_employee_id: str, db: Session) -> Group:
    g = Group(
        id=str(uuid.uuid4()),
        name=data.name,
        description=data.description,
        group_type=data.group_type,
        created_by=actor_employee_id,
    )
    db.add(g)
    return g


def get_group(group_id: str, db: Session) -> dict:
    g = (
        db.query(Group)
        .options(
            joinedload(Group.members)
            .joinedload(GroupMember.employee)
            .joinedload(Employee.user)
        )
        .filter(Group.id == group_id)
        .first()
    )
    if not g:
        raise HTTPException(404, "Group not found")

    members = []
    for m in g.members:
        emp = m.employee
        if not emp:
            continue
        name = (
            emp.user.full_name
            if emp.user and emp.user.full_name
            else emp.employee_no
        )
        members.append({
            "id":            m.id,
            "employee_id":   m.employee_id,
            "employee_name": name,
            "employee_no":   emp.employee_no,
            "job_title":     emp.job_title,
            "department":    emp.department.value if emp.department else None,
        })

    return {
        "id":          g.id,
        "name":        g.name,
        "description": g.description,
        "group_type":  g.group_type,
        "is_active":   g.is_active,
        "created_at":  g.created_at,
        "members":     members,
    }


def update_group(group_id: str, data: GroupUpdate, db: Session) -> Group:
    g = _get_group_or_404(group_id, db)
    if data.name        is not None: g.name        = data.name
    if data.description is not None: g.description = data.description
    if data.group_type  is not None: g.group_type  = data.group_type
    if data.is_active   is not None: g.is_active   = data.is_active
    return g


def add_group_member(group_id: str, data: AddMember, db: Session) -> dict:
    _get_group_or_404(group_id, db)

    # Accept employee_id (UUID) or employee_no
    emp = (
        db.query(Employee)
        .filter(
            (Employee.id == data.employee_id)
            | (Employee.employee_no == data.employee_id)
        )
        .options(joinedload(Employee.user))
        .first()
    )
    if not emp:
        raise HTTPException(404, "Employee not found")

    existing = (
        db.query(GroupMember)
        .filter(
            GroupMember.group_id    == group_id,
            GroupMember.employee_id == emp.id,
        )
        .first()
    )
    if existing:
        raise HTTPException(409, "Employee is already a member of this group")

    m = GroupMember(
        id=str(uuid.uuid4()),
        group_id=group_id,
        employee_id=emp.id,
    )
    db.add(m)
    db.flush()

    name = (
        emp.user.full_name
        if emp.user and emp.user.full_name
        else emp.employee_no
    )
    return {
        "id":            m.id,
        "employee_id":   emp.id,
        "employee_name": name,
        "employee_no":   emp.employee_no,
        "job_title":     emp.job_title,
        "department":    emp.department.value if emp.department else None,
    }


def remove_group_member(group_id: str, member_id: str, db: Session) -> None:
    m = (
        db.query(GroupMember)
        .filter(GroupMember.id == member_id, GroupMember.group_id == group_id)
        .first()
    )
    if not m:
        raise HTTPException(404, "Member not found in this group")
    db.delete(m)
