from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.employees.models import Department, Employee
from app.shared.dependencies import get_current_user
from app.shared.models.user import User


router = APIRouter(prefix="/actors", tags=["Safety Actors"])


class SafetyActor(BaseModel):
    id: str
    name: str
    email: str
    department: Optional[Department]
    job_title: Optional[str]


@router.get("", response_model=List[SafetyActor])
def list_safety_actors(
    department: Optional[Department] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Employee).options(joinedload(Employee.user)).join(Employee.user)

    if department:
        query = query.filter(Employee.department == department)

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
            department=employee.department,
            job_title=employee.job_title,
        )
        for employee in employees
        if employee.user
    ]
