from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.employees.models import Department, Employee
from app.shared.dependencies import get_current_user
from app.shared.models.user import User, UserRole


def get_employee_for_user(db: Session, current_user: User) -> Employee:
    employee = db.query(Employee).filter(Employee.user_id == current_user.id).first()

    if not employee:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current user is not linked to an employee profile.",
        )

    return employee


def require_hse_reviewer(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Employee:
    employee = get_employee_for_user(db, current_user)

    if current_user.role in (UserRole.super_admin, UserRole.admin):
        return employee

    if employee.department == Department.safety:
        return employee

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Only HSE employees can review incident reports.",
    )
