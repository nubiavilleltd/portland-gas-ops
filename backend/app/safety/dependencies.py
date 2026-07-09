from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.employees.models import Employee
from app.safety.permissions import require_safety_hse_reviewer
from app.shared.dependencies import get_current_user
from app.shared.models.user import User


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
    return require_safety_hse_reviewer(employee)
