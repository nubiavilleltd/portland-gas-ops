"""
Setups service — CRUD for Departments, Groups and Group Members.
"""

import uuid
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from fastapi import HTTPException

from app.employees.models import Employee
from app.setups.models import Department, Group, GroupMember
from app.setups.schemas import (
    DepartmentCreate, DepartmentUpdate,
    GroupCreate, GroupUpdate, AddMember,
)


# ── Departments ────────────────────────────────────────────────────────────────

def list_departments(db: Session, workspace_id: str, active_only: bool = False) -> list[dict]:
    from app.shared.models.user import User
    # Alias Employee so the hod join doesn't clash with the employee_count join
    HodEmployee = db.query(Employee).subquery()

    q = (
        db.query(Department, func.count(Employee.id).label("employee_count"))
        .outerjoin(
            Employee,
            (Employee.department_id == Department.id)
            & (Employee.workspace_id == workspace_id),
        )
        .filter(Department.workspace_id == workspace_id)
        .group_by(Department.id)
    )
    if active_only:
        q = q.filter(Department.is_active == True)
    rows = q.order_by(Department.name.asc()).all()

    # Batch-load HoD names in one query to avoid N+1
    # Note: User.full_name is a @property — query first_name + last_name as columns
    hod_ids = [d.hod_id for d, _ in rows if d.hod_id]
    hod_name_map: dict[str, str] = {}
    if hod_ids:
        hod_rows = (
            db.query(Employee.id, User.first_name, User.last_name)
            .join(User, User.id == Employee.user_id)
            .filter(
                Employee.id.in_(hod_ids),
                Employee.workspace_id == workspace_id,
            )
            .all()
        )
        hod_name_map = {
            emp_id: f"{first or ''} {last or ''}".strip()
            for emp_id, first, last in hod_rows
        }

    return [
        {
            "id":             d.id,
            "name":           d.name,
            "code":           d.code,
            "is_active":      d.is_active,
            "hod_id":         d.hod_id,
            "hod_name":       hod_name_map.get(d.hod_id) if d.hod_id else None,
            "parent_dept_id": d.parent_dept_id,
            "created_at":     d.created_at,
            "updated_at":     d.updated_at,
            "employee_count": count,
        }
        for d, count in rows
    ]


def get_department(dept_id: str, db: Session, workspace_id: str) -> Department:
    dept = db.query(Department).filter(
        Department.id == dept_id,
        Department.workspace_id == workspace_id,
    ).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    return dept


def create_department(data: DepartmentCreate, db: Session, workspace_id: str) -> Department:
    if db.query(Department).filter(
        Department.workspace_id == workspace_id,
        (Department.code == data.code) | (Department.name == data.name),
    ).first():
        raise HTTPException(status_code=409, detail="A department with this code already exists")
    _validate_department_links(data.hod_id, data.parent_dept_id, workspace_id, db)
    dept = Department(
        id=str(uuid.uuid4()),
        workspace_id=workspace_id,
        name=data.name,
        code=data.code,
        hod_id=data.hod_id,
        parent_dept_id=data.parent_dept_id,
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept


def update_department(dept_id: str, data: DepartmentUpdate, db: Session, workspace_id: str) -> Department:
    dept = get_department(dept_id, db, workspace_id)
    changes = data.model_dump(exclude_unset=True)
    if "name" in changes or "code" in changes:
        duplicate = db.query(Department).filter(
            Department.workspace_id == workspace_id,
            Department.id != dept_id,
            ((Department.code == changes.get("code", dept.code)) |
             (Department.name == changes.get("name", dept.name))),
        ).first()
        if duplicate:
            raise HTTPException(status_code=409, detail="A department with this name or code already exists")
    _validate_department_links(
        changes.get("hod_id", dept.hod_id),
        changes.get("parent_dept_id", dept.parent_dept_id),
        workspace_id,
        db,
    )
    for field, value in changes.items():
        setattr(dept, field, value)
    db.commit()
    db.refresh(dept)
    return dept


def delete_department(dept_id: str, db: Session, workspace_id: str) -> None:
    dept = get_department(dept_id, db, workspace_id)
    employee_count = (
        db.query(func.count(Employee.id))
        .filter(
            Employee.department_id == dept_id,
            Employee.workspace_id == workspace_id,
        )
        .scalar()
    ) or 0
    if employee_count > 0:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot delete: {employee_count} employee(s) are assigned to this department. Reassign them first.",
        )
    db.delete(dept)
    db.commit()


def _validate_department_links(
    hod_id: str | None,
    parent_dept_id: str | None,
    workspace_id: str,
    db: Session,
) -> None:
    """Prevent a department from referencing records in another workspace."""
    if hod_id and not db.query(Employee.id).filter(
        Employee.id == hod_id,
        Employee.workspace_id == workspace_id,
    ).first():
        raise HTTPException(status_code=400, detail="Head of department is not in this workspace")
    if parent_dept_id and not db.query(Department.id).filter(
        Department.id == parent_dept_id,
        Department.workspace_id == workspace_id,
    ).first():
        raise HTTPException(status_code=400, detail="Parent department is not in this workspace")


# ── Groups ─────────────────────────────────────────────────────────────────────

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
            .joinedload(Employee.user),
            joinedload(Group.members)
            .joinedload(GroupMember.employee)
            .joinedload(Employee.department_rel),
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
            "department":    emp.department_rel.name if emp.department_rel else None,
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
        .options(joinedload(Employee.user), joinedload(Employee.department_rel))
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
        "department":    emp.department_rel.name if emp.department_rel else None,
    }


def remove_group_member(group_id: str, member_id: str, db: Session) -> None:
    member = (
        db.query(GroupMember)
        .filter(GroupMember.id == member_id, GroupMember.group_id == group_id)
        .first()
    )
    if not member:
        raise HTTPException(404, "Member not found")
    db.delete(member)
