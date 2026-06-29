from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.shared.dependencies import get_current_user
from app.shared.models.user import User
from app.safety.work_initiations import service as work_initiation_service
from app.safety.work_initiations.models import (
    WorkInitiationCategory,
    WorkInitiationStatus,
)
from app.safety.work_initiations.schemas import (
    WorkInitiationCreate,
    WorkInitiationListItem,
    WorkInitiationResponse,
)


router = APIRouter(prefix="/work-initiations", tags=["Safety Work Initiations"])


@router.get("", response_model=List[WorkInitiationListItem])
def list_work_initiations(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status_filter: Optional[WorkInitiationStatus] = Query(None, alias="status"),
    work_category: Optional[WorkInitiationCategory] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    records = work_initiation_service.list_work_initiations(
        db=db,
        skip=skip,
        limit=limit,
        status_filter=status_filter,
        work_category=work_category,
        search=search,
    )
    return [WorkInitiationListItem.from_model(record) for record in records]


@router.post(
    "",
    response_model=WorkInitiationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_work_initiation(
    data: WorkInitiationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = work_initiation_service.create_work_initiation(
        db=db,
        data=data,
        current_user=current_user,
    )
    return WorkInitiationResponse.from_model(record)


@router.get("/{work_initiation_id}", response_model=WorkInitiationResponse)
def get_work_initiation(
    work_initiation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = work_initiation_service.get_work_initiation(
        db=db,
        work_initiation_id=work_initiation_id,
    )
    return WorkInitiationResponse.from_model(record)
