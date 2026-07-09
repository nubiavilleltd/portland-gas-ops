from fastapi import HTTPException, status

from app.employees.models import Department, Employee


def require_safety_operations_approver(employee: Employee) -> Employee:
    if (
        employee.department == Department.operations
        and (employee.job_title or "").strip() == "Process Manager"
    ):
        return employee

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=(
            "Only an Operations employee with job title Process Manager can "
            "perform Operations safety review."
        ),
    )


def require_safety_hse_reviewer(employee: Employee) -> Employee:
    if employee.department == Department.safety:
        return employee

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Only employees in the HSE department can perform HSE safety review.",
    )
