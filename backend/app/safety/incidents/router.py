import json
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from pydantic import ValidationError
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
    IncidentReportResponse,
    IncidentReportUpdate,
)
from app.safety.incidents import service as incident_service



router = APIRouter(prefix="/incidents", tags=["Safety Incident Reports"])

ALLOWED_ATTACHMENT_TYPES = {
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "video/mp4",
    "video/quicktime",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
MAX_ATTACHMENT_SIZE_MB = 10
MAX_ATTACHMENTS = 10


async def validate_attachments(files: List[UploadFile]) -> list[tuple[bytes, str, str, int]]:
    if len(files) > MAX_ATTACHMENTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum {MAX_ATTACHMENTS} attachments allowed.",
        )

    validated: list[tuple[bytes, str, str, int]] = []
    max_bytes = MAX_ATTACHMENT_SIZE_MB * 1024 * 1024

    for file in files:
        if not file.filename:
            continue
        if file.content_type not in ALLOWED_ATTACHMENT_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid attachment type '{file.content_type}'.",
            )
        file_bytes = await file.read()
        if len(file_bytes) > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Attachment '{file.filename}' exceeds {MAX_ATTACHMENT_SIZE_MB} MB.",
            )
        validated.append((
            file_bytes,
            file.filename,
            file.content_type or "application/octet-stream",
            len(file_bytes),
        ))

    return validated


@router.get("", response_model=List[IncidentReportResponse])
def list_incident_reports(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    cursor_reported_at: Optional[datetime] = Query(None),
    cursor_id: Optional[str] = Query(None),
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
        cursor_reported_at=cursor_reported_at,
        cursor_id=cursor_id,
        status_filter=status_filter,
        report_type=report_type,
        search=search,
    )

    return [IncidentReportResponse.from_model(report) for report in reports]


@router.post(
    "",
    response_model=IncidentReportResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_incident_report(
    data: str = Form(...),
    attachments: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        payload = IncidentReportCreate.model_validate(json.loads(data))
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid JSON in 'data' field.",
        )
    except ValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=exc.errors(include_url=False),
        )

    attachment_files = await validate_attachments(attachments)

    report = incident_service.create_incident_report(
        db=db,
        data=payload,
        current_user=current_user,
        attachments=attachment_files,
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
