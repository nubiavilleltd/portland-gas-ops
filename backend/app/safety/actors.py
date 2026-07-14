from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.employees.models import Employee
from app.setups.models import Department as DepartmentModel
from app.shared.dependencies import get_current_user
from app.shared.models.user import AccountStatus, User


router = APIRouter(prefix="/actors", tags=["Safety Actors"])


class SafetyActor(BaseModel):
    id: str
    name: str
    email: str
    department: Optional[str]
    job_title: Optional[str]


class SafetyDepartment(BaseModel):
    value: str
    label: str
    employee_count: int


@router.get("/departments", response_model=List[SafetyDepartment])
def list_safety_departments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(DepartmentModel.name, func.count(Employee.id).label("employee_count"))
        .join(Employee, Employee.department_id == DepartmentModel.id)
        .join(Employee.user)
        .filter(User.account_status != AccountStatus.deactivated)
        .group_by(DepartmentModel.id, DepartmentModel.name)
        .order_by(DepartmentModel.name.asc())
        .all()
    )

    return [
        SafetyDepartment(
            value=name,
            label=name,
            employee_count=employee_count,
        )
        for name, employee_count in rows
    ]


@router.get("", response_model=List[SafetyActor])
def list_safety_actors(
    department: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(Employee)
        .options(joinedload(Employee.user), joinedload(Employee.department_rel))
        .join(Employee.user)
    )

    if department:
        query = (
            query
            .join(DepartmentModel, Employee.department_id == DepartmentModel.id)
            .filter(DepartmentModel.name == department)
        )

    if search:
        search_value = f"%{search}%"
        query = query.filter(
            User.first_name.ilike(search_value)
            | User.last_name.ilike(search_value)
            | User.email.ilike(search_value)
            | Employee.employee_no.ilike(search_value)
            | Employee.job_title.ilike(search_value)
        )

    employees = query.order_by(Employee.created_at.desc()).limit(100).all()

    return [
        SafetyActor(
            id=employee.id,
            name=employee.user.full_name or employee.user.email,
            email=employee.user.email,
            department=employee.department_rel.name if employee.department_rel else None,
            job_title=employee.job_title,
        )
        for employee in employees
        if employee.user
    ]
