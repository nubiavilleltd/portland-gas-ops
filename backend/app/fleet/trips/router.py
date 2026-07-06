from __future__ import annotations

from typing import List, Optional

from backend.app.fleet.trips.workflows.mark_ready_workflow import MarkReadyWorkflow
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
    TripResponse,
    AssignResourcesRequest,
    CancelTripRequest,
    CompleteTripRequest,
    AddOrderToTripRequest,
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
    prefix="/trips",
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
    response_model=List[TripResponse],
)
def list_trips(
    status: Optional[TripStatus] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    return trip_service.list(
        db=db,
        status=status,
    )


@router.get(
    "/{trip_id}",
    response_model=TripResponse,
)
def get_trip(
    trip_id: int,
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
    trip_id: int,
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
    current_user: User = Depends(
        require_roles(
            "super_admin",
            "admin",
        )
    ),
):

    return create_trip_workflow.execute(
        db=db,
        data=data,
        actor_id=current_user.id,
    )

# -------------------------------------------------------------------------
# Assign Resources
# -------------------------------------------------------------------------

@router.post(
    "/{trip_id}/assign",
    response_model=TripResponse,
)
def assign_resources(
    trip_id: int,
    data: AssignResourcesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "super_admin",
            "admin",
        )
    ),
):

    return assign_resources_workflow.execute(
        db=db,
        trip_id=trip_id,
        driver_id=data.driver_id,
        vehicle_id=data.vehicle_id,
        actor_id=current_user.id,
    )


# -------------------------------------------------------------------------
# Mark Ready
# -------------------------------------------------------------------------

@router.post(
    "/{trip_id}/mark-ready",
    response_model=TripResponse,
)
def mark_ready(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "super_admin",
            "admin",
        )
    ),
):

    return mark_ready_workflow.execute(
        db=db,
        trip_id=trip_id,
        actor_id=current_user.id,
    )

# -------------------------------------------------------------------------
# Dispatch Trip
# -------------------------------------------------------------------------

@router.post(
    "/{trip_id}/dispatch",
    response_model=TripResponse,
)
def dispatch_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "super_admin",
            "admin",
        )
    ),
):

    return dispatch_trip_workflow.execute(
        db=db,
        trip_id=trip_id,
        actor_id=current_user.id,
    )


# -------------------------------------------------------------------------
# Start Trip
# -------------------------------------------------------------------------

@router.post(
    "/{trip_id}/start",
    response_model=TripResponse,
)
def start_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    return start_trip_workflow.execute(
        db=db,
        trip_id=trip_id,
        actor_id=current_user.id,
    )

# -------------------------------------------------------------------------
# Complete Trip
# -------------------------------------------------------------------------

@router.post(
    "/{trip_id}/complete",
    response_model=TripResponse,
)
def complete_trip(
    trip_id: int,
    data: CompleteTripRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "super_admin",
            "admin",
        )
    ),
):

    return complete_trip_workflow.execute(
        db=db,
        trip_id=trip_id,
        proof_notes=data.proof_notes,
        actor_id=current_user.id,
    )


# -------------------------------------------------------------------------
# Cancel Trip
# -------------------------------------------------------------------------

@router.post(
    "/{trip_id}/cancel",
    response_model=TripResponse,
)
def cancel_trip(
    trip_id: int,
    data: CancelTripRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "super_admin",
            "admin",
        )
    ),
):

    return cancel_trip_workflow.execute(
        db=db,
        trip_id=trip_id,
        reason=data.reason,
        actor_id=current_user.id,
    )


# -------------------------------------------------------------------------
# Add Order To Trip
# -------------------------------------------------------------------------

@router.post(
    "/{trip_id}/orders",
    response_model=TripResponse,
)
def add_order_to_trip(
    trip_id: int,
    data: AddOrderToTripRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "super_admin",
            "admin",
        )
    ),
):

    return add_order_workflow.execute(
        db=db,
        trip_id=trip_id,
        order_id=data.order_id,
        actor_id=current_user.id,
    )