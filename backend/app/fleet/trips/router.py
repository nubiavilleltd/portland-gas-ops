from __future__ import annotations

from typing import List, Optional

from app.fleet.trips.workflows.mark_ready_workflow import MarkReadyWorkflow
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user

from app.shared.dependencies import require_roles
from app.shared.models.user import User

from app.audit.schema import AuditEntityType, AuditLogResponse
from app.audit.service import AuditService

from app.fleet.trips.enums import TripStatus

from app.fleet.trips.schema import (
    TripCreate,
    TripAssignResources,
    TripCancel,
    TripComplete,
    TripMarkReady,
    TripAddOrder,
    TripResponse,
    TripListResponse,
    TripFilters
)

from app.fleet.trips.service import TripService

from app.fleet.trips.workflows.create_trip_workflow import (
    CreateTripWorkflow,
)
from app.fleet.trips.workflows.assign_resources_workflow import (
    AssignResourcesWorkflow,
)
from app.fleet.trips.workflows.dispatch_trip_workflow import (
    DispatchTripWorkflow,
)
from app.fleet.trips.workflows.start_trip_workflow import (
    StartTripWorkflow,
)
from app.fleet.trips.workflows.complete_trip_workflow import (
    CompleteTripWorkflow,
)
from app.fleet.trips.workflows.cancel_trip_workflow import (
    CancelTripWorkflow,
)
from app.fleet.trips.workflows.add_order_to_trip_workflow import (
    AddOrderToTripWorkflow,
)

router = APIRouter(
    tags=["Trips"],
)

trip_service = TripService()

create_trip_workflow = CreateTripWorkflow()
assign_resources_workflow = AssignResourcesWorkflow()
mark_ready_workflow = MarkReadyWorkflow()
dispatch_trip_workflow = DispatchTripWorkflow()
start_trip_workflow = StartTripWorkflow()
complete_trip_workflow = CompleteTripWorkflow()
cancel_trip_workflow = CancelTripWorkflow()
add_order_workflow = AddOrderToTripWorkflow()

# -------------------------------------------------------------------------
# Queries
# -------------------------------------------------------------------------

@router.get(
    "",
    response_model=TripListResponse,
)
def list_trips(
    status: Optional[TripStatus] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    filters = TripFilters(
        status=status,
        page=page,
        page_size=page_size,
    )

    items, total = trip_service.list(
        db=db,
        filters=filters,
        current_user=current_user,
    )

    # return TripListResponse(
    #     items=items,
    #     total=total,
    #     page=page,
    #     page_size=page_size,
    #     has_next=(page * page_size) < total,
    # )

    return TripListResponse(
        items=[TripResponse.model_validate(t) for t in items],
        total=total,
        page=page,
        page_size=page_size,
        has_next=(page * page_size) < total,
    )


@router.get(
    "/{trip_id}",
    response_model=TripResponse,
)
def get_trip(
    trip_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    return trip_service.get_or_raise(
        db=db,
        trip_id=trip_id,
    )


@router.get(
    "/{trip_id}/audit",
    response_model=List[AuditLogResponse],
)
def get_trip_audit(
    trip_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    return AuditService.get_by_entity(
        db=db,
        entity_type=AuditEntityType.trip,
        entity_id=str(trip_id),
    )

# -------------------------------------------------------------------------
# Create Trip
# -------------------------------------------------------------------------

@router.post(
    "",
    response_model=TripResponse,
    status_code=201,
)
def create_trip(
    data: TripCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user
    ),
):

    trip = create_trip_workflow.execute(
        db=db,
        data=data,
        actor_employee_id=current_user.employee.id,
        actor_name=current_user.full_name,
        created_by=current_user.id,
    )

    db.commit()
    db.refresh(trip)

    return trip

# -------------------------------------------------------------------------
# Assign Resources
# -------------------------------------------------------------------------

@router.post(
    "/{trip_id}/assign",
    response_model=TripResponse,
)
def assign_resources(
    trip_id: str,
    data: TripAssignResources,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "super_admin",
            "admin",
        )
    ),
):

    trip = assign_resources_workflow.execute(
        db=db,
        trip_id=trip_id,
        driver_id=data.driver_id,
        vehicle_id=data.vehicle_id,
        actor_employee_id=current_user.employee.id,
        actor_name=current_user.full_name,
    )

    db.commit()
    db.refresh(trip)

    return trip


# -------------------------------------------------------------------------
# Mark Ready
# -------------------------------------------------------------------------

@router.post(
    "/{trip_id}/mark-ready",
    response_model=TripResponse,
)
def mark_ready(
    trip_id: str,
    data: TripMarkReady,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "super_admin",
            "admin",
        )
    ),
):

    trip = mark_ready_workflow.execute(
        db=db,
        trip_id=trip_id,
        assignments=data.assignments,
        actor_user_id=current_user.id,
        actor_employee_id=current_user.employee.id,
        actor_name=current_user.full_name,
    )

    db.commit()
    db.refresh(trip)

    return trip

# -------------------------------------------------------------------------
# Dispatch Trip
# -------------------------------------------------------------------------

@router.post(
    "/{trip_id}/dispatch",
    response_model=TripResponse,
)
def dispatch_trip(
    trip_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "super_admin",
            "admin",
        )
    ),
):

    trip = dispatch_trip_workflow.execute(
        db=db,
        trip_id=trip_id,
        actor_user_id=current_user.id,
        actor_employee_id=current_user.employee.id,
        actor_name=current_user.full_name,
    )

    db.commit()
    db.refresh(trip)

    return trip


# -------------------------------------------------------------------------
# Start Trip
# -------------------------------------------------------------------------

@router.post(
    "/{trip_id}/start",
    response_model=TripResponse,
)
def start_trip(
    trip_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    trip = start_trip_workflow.execute(
        db=db,
        trip_id=trip_id,
        actor_employee_id=current_user.employee.id,
        actor_name=current_user.full_name,
    )

    db.commit()
    db.refresh(trip)

    return trip

# -------------------------------------------------------------------------
# Complete Trip
# -------------------------------------------------------------------------

@router.post(
    "/{trip_id}/complete",
    response_model=TripResponse,
)
def complete_trip(
    trip_id: str,
    data: TripComplete,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "super_admin",
            "admin",
        )
    ),
):

    trip = complete_trip_workflow.execute(
        db=db,
        trip_id=trip_id,
        proof_notes=data.proof_notes,
        actor_employee_id=current_user.employee.id,
        actor_name=current_user.full_name,
    )

    db.commit()
    db.refresh(trip)

    return trip


# -------------------------------------------------------------------------
# Cancel Trip
# -------------------------------------------------------------------------

@router.post(
    "/{trip_id}/cancel",
    response_model=TripResponse,
)
def cancel_trip(
    trip_id: str,
    data: TripCancel,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user
    ),
):

    trip = cancel_trip_workflow.execute(
        db=db,
        trip_id=trip_id,
        reason=data.reason,
        actor_employee_id=current_user.employee.id,
        actor_name=current_user.full_name,
    )

    db.commit()
    db.refresh(trip)

    return trip


# -------------------------------------------------------------------------
# Add Order To Trip
# -------------------------------------------------------------------------

@router.post(
    "/{trip_id}/orders",
    response_model=TripResponse,
)
def add_order_to_trip(
    trip_id: str,
    data: TripAddOrder,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    trip = add_order_workflow.execute(
        db=db,
        trip_id=trip_id,
        order_id=data.order_id,
        actor_employee_id=current_user.employee.id,
        actor_name=current_user.full_name,
    )

    db.commit()
    db.refresh(trip)

    return trip