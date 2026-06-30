from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.employees.models import Employee
from app.safety.dependencies import require_hse_reviewer
from app.safety.work_authorizations import service as work_authorization_service
from app.safety.work_authorizations.models import WorkAuthorizationStatus
from app.safety.work_authorizations.schemas import (
    WorkAuthorizationCreate,
    WorkAuthorizationHseReviewCreate,
    WorkAuthorizationListItem,
    WorkAuthorizationResponse,
)
from app.shared.dependencies import get_current_user
from app.shared.models.user import User


router = APIRouter(
    prefix="/work-authorizations",
    tags=["Safety Work Authorizations"],
)


@router.get("", response_model=List[WorkAuthorizationListItem])
def list_work_authorizations(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status_filter: Optional[WorkAuthorizationStatus] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    records = work_authorization_service.list_work_authorizations(
        db=db,
        skip=skip,
        limit=limit,
        status_filter=status_filter,
        search=search,
    )
    return [WorkAuthorizationListItem.from_model(record) for record in records]


@router.post(
    "",
    response_model=WorkAuthorizationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_work_authorization(
    data: WorkAuthorizationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = work_authorization_service.create_work_authorization(
        db=db,
        data=data,
        current_user=current_user,
    )
    return WorkAuthorizationResponse.from_model(record)


@router.get("/{work_authorization_id}", response_model=WorkAuthorizationResponse)
def get_work_authorization(
    work_authorization_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = work_authorization_service.get_work_authorization(
        db=db,
        work_authorization_id=work_authorization_id,
    )
    return WorkAuthorizationResponse.from_model(record)


@router.post(
    "/{work_authorization_id}/hse-review",
    response_model=WorkAuthorizationResponse,
)
def create_hse_review(
    work_authorization_id: str,
    data: WorkAuthorizationHseReviewCreate,
    db: Session = Depends(get_db),
    inspector: Employee = Depends(require_hse_reviewer),
):
    record = work_authorization_service.create_hse_review(
        db=db,
        work_authorization_id=work_authorization_id,
        data=data,
        inspector=inspector,
    )
    return WorkAuthorizationResponse.from_model(record)
