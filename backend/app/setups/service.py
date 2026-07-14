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

def list_departments(db: Session, active_only: bool = False) -> list[Department]:
    q = db.query(Department)
    if active_only:
        q = q.filter(Department.is_active == True)
    return q.order_by(Department.name.asc()).all()


def get_department(dept_id: str, db: Session) -> Department:
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    return dept


def create_department(data: DepartmentCreate, db: Session) -> Department:
    if db.query(Department).filter(Department.code == data.code).first():
        raise HTTPException(status_code=409, detail="A department with this code already exists")
    dept = Department(
        id=str(uuid.uuid4()),
        name=data.name,
        code=data.code,
        hod_id=data.hod_id,
        parent_dept_id=data.parent_dept_id,
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept


def update_department(dept_id: str, data: DepartmentUpdate, db: Session) -> Department:
    dept = get_department(dept_id, db)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(dept, field, value)
    db.commit()
    db.refresh(dept)
    return dept


# ── Groups ─────────────────────────────────────────────────────────────────────

def list_groups(db: Session) -> list[dict]:
    groups = db.query(Group).options(joinedload(Group.members)).order_by(Group.name.asc()).all()
    return [
        {
            "id":           g.id,
            "name":         g.name,
            "description":  g.description,
            "group_type":   g.group_type,
            "is_active":    g.is_active,
            "member_count": len(g.members),
            "created_at":   g.created_at,
        }
        for g in groups
    ]


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
        raise HTTPException(status_code=404, detail="Group not found")

    members = []
    for m in g.members:
        emp = m.employee
        members.append({
            "id":            m.id,
            "employee_id":   m.employee_id,
            "employee_name": emp.user.full_name if emp and emp.user else "—",
            "employee_no":   emp.employee_no if emp else "—",
            "job_title":     emp.job_title if emp else None,
            "department":    emp.department_rel.name if emp and emp.department_rel else None,
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


def _get_group_or_404(group_id: str, db: Session) -> Group:
    g = db.query(Group).filter(Group.id == group_id).first()
    if not g:
        raise HTTPException(status_code=404, detail="Group not found")
    return g


def create_group(data: GroupCreate, db: Session) -> Group:
    g = Group(
        id=str(uuid.uuid4()),
        name=data.name,
        description=data.description,
        group_type=data.group_type,
    )
    db.add(g)
    db.commit()
    db.refresh(g)
    return g


def update_group(group_id: str, data: GroupUpdate, db: Session) -> Group:
    g = _get_group_or_404(group_id, db)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(g, field, value)
    db.commit()
    db.refresh(g)
    return g


def add_group_member(group_id: str, data: AddMember, db: Session) -> dict:
    _get_group_or_404(group_id, db)

    emp = db.query(Employee).filter(Employee.id == data.employee_id).first()
    if not emp:
        emp = db.query(Employee).filter(Employee.employee_no == data.employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    existing = (
        db.query(GroupMember)
        .filter(GroupMember.group_id == group_id, GroupMember.employee_id == emp.id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Employee is already a member of this group")

    member = GroupMember(
        id=str(uuid.uuid4()),
        group_id=group_id,
        employee_id=emp.id,
    )
    db.add(member)
    db.flush()

    # Load department_rel
    db.refresh(emp)

    return {
        "id":            member.id,
        "employee_id":   emp.id,
        "employee_name": emp.user.full_name if emp.user else "—",
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
        raise HTTPException(status_code=404, detail="Member not found")
    db.delete(member)
