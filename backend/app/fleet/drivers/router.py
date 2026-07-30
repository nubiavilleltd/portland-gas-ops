from __future__ import annotations

from typing import List, Optional

from fastapi import (
    APIRouter,
    Depends,
    Query,
)
from sqlalchemy.orm import Session

from app.core.dependencies import (
    get_current_user,
    get_db,
)

from app.shared.dependencies import require_roles
from app.shared.models.user import User

from app.fleet.drivers.enums import DriverStatus

from app.fleet.drivers.schema import (
    DriverCreate,
    DriverResponse,
    DriverUpdate,
)

from app.fleet.drivers.service import DriverService

from app.fleet.drivers.workflows.create_driver_workflow import (
    CreateDriverWorkflow,
)
from app.fleet.drivers.workflows.update_driver_workflow import (
    UpdateDriverWorkflow,
)

router = APIRouter(
    # prefix="/drivers",
    tags=["Drivers"],
)

driver_service = DriverService()

create_driver_workflow = CreateDriverWorkflow()
update_driver_workflow = UpdateDriverWorkflow()


# -------------------------------------------------------------------------
# Queries
# -------------------------------------------------------------------------

@router.get(
    "",
    response_model=List[DriverResponse],
)
def list_drivers(
    status: Optional[DriverStatus] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    return driver_service.list(
        db=db,
        status=status,
    )


@router.get(
    "/available",
    response_model=List[DriverResponse],
)
def list_available_drivers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    return driver_service.list_available(
        db=db,
    )


@router.get(
    "/{driver_id}",
    response_model=DriverResponse,
)
def get_driver(
    driver_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    return driver_service.get_or_raise(
        db=db,
        driver_id=driver_id,
    )

# -------------------------------------------------------------------------
# Create Driver
# -------------------------------------------------------------------------

@router.post(
    "",
    response_model=DriverResponse,
    status_code=201,
)
def create_driver(
    data: DriverCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "super_admin",
            "admin",
        )
    ),
):

    driver = create_driver_workflow.execute(
        db=db,
        data=data,
        actor_employee_id=current_user.employee.id,
        actor_name=current_user.full_name,
    )

    db.commit()
    db.refresh(driver)

    return driver

# -------------------------------------------------------------------------
# Update Driver
# -------------------------------------------------------------------------

@router.put(
    "/{driver_id}",
    response_model=DriverResponse,
)
def update_driver(
    driver_id: str,
    data: DriverUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "super_admin",
            "admin",
        )
    ),
):

    driver = update_driver_workflow.execute(
        db=db,
        driver_id=driver_id,
        data=data,
        actor_employee_id=current_user.employee.id,
        actor_name=current_user.full_name,
    )

    db.commit()
    db.refresh(driver)

    return driver



@router.patch(
    "/{driver_id}/suspend",
    response_model=DriverResponse,
)
def suspend_driver(
    driver_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "super_admin",
            "admin",
        )
    ),
):

    driver = driver_service.suspend(
        db=db,
        driver_id=driver_id,
    )

    db.commit()
    db.refresh(driver)

    return driver


@router.patch(
    "/{driver_id}/reinstate",
    response_model=DriverResponse,
)
def reinstate_driver(
    driver_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "super_admin",
            "admin",
        )
    ),
):

    driver = driver_service.reinstate(
        db=db,
        driver_id=driver_id,
    )

    db.commit()
    db.refresh(driver)

    return driver


@router.patch(
    "/{driver_id}/off-duty",
    response_model=DriverResponse,
)
def set_off_duty(
    driver_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "super_admin",
            "admin",
        )
    ),
):

    driver = driver_service.set_off_duty(
        db=db,
        driver_id=driver_id,
    )

    db.commit()
    db.refresh(driver)

    return driver


@router.patch(
    "/{driver_id}/available",
    response_model=DriverResponse,
)
def set_available(
    driver_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "super_admin",
            "admin",
        )
    ),
):

    driver = driver_service.set_available(
        db=db,
        driver_id=driver_id,
    )

    db.commit()
    db.refresh(driver)

    return driver