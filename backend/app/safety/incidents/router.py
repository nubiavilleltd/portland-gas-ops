from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.shared.dependencies import get_current_user
from app.shared.models.user import User
from app.employees.models import Employee
from app.safety.dependencies import require_hse_reviewer
from app.safety.incidents.models import IncidentReportStatus, IncidentReportType
from app.safety.incidents.schemas import (
    IncidentHseReviewCreate,
    IncidentHseReviewResponse,
    IncidentReportCreate,
    IncidentReportListItem,
    IncidentReportResponse,
    IncidentReportUpdate,
)
from app.safety.incidents import service as incident_service



router = APIRouter(prefix="/incidents", tags=["Safety Incident Reports"])


@router.get("", response_model=List[IncidentReportListItem])
def list_incident_reports(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status_filter: Optional[IncidentReportStatus] = Query(None, alias="status"),
    report_type: Optional[IncidentReportType] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reports = incident_service.list_incident_reports(
        db=db,
        skip=skip,
        limit=limit,
        status_filter=status_filter,
        report_type=report_type,
        search=search,
    )

    return [IncidentReportListItem.from_model(report) for report in reports]


@router.post(
    "",
    response_model=IncidentReportResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_incident_report(
    data: IncidentReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = incident_service.create_incident_report(
        db=db,
        data=data,
        current_user=current_user,
    )

    return IncidentReportResponse.from_model(report)


@router.get("/{incident_id}", response_model=IncidentReportResponse)
def get_incident_report(
    incident_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = incident_service.get_incident_report(
        db=db,
        incident_id=incident_id,
    )

    return IncidentReportResponse.from_model(report)


@router.post(
    "/{incident_id}/hse-review",
    response_model=IncidentHseReviewResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_incident_hse_review(
    incident_id: str,
    data: IncidentHseReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    inspector: Employee = Depends(require_hse_reviewer),
):
    review = incident_service.create_hse_review(
        db=db,
        incident_id=incident_id,
        data=data,
        inspector=inspector,
    )

    return IncidentHseReviewResponse.from_model(review)


@router.patch("/{incident_id}", response_model=IncidentReportResponse)
def update_incident_report(
    incident_id: str,
    data: IncidentReportUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = incident_service.update_incident_report(
        db=db,
        incident_id=incident_id,
        data=data,
    )

    return IncidentReportResponse.from_model(report)


@router.delete("/{incident_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_incident_report(
    incident_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    incident_service.deactivate_incident_report(
        db=db,
        incident_id=incident_id,
    )

    return None
