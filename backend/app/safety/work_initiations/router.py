import json
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.shared.dependencies import get_current_user
from app.shared.models.user import User
from app.safety.work_initiations import service as work_initiation_service
from app.safety.work_initiations.models import (
    WorkInitiationCategory,
    WorkInitiationStatus,
    WorkInitiationDecision
)
from app.safety.work_initiations.schemas import (
    WorkInitiationCreate,
    WorkInitiationResponse,
    WorkInitiationReviewCreate,
    WorkInitiationUpdate,
)
from app.safety.incidents.schemas import IncidentReportResponse


router = APIRouter(prefix="/work-initiations", tags=["Safety Work Initiations"])

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


def parse_form_payload(data: str, schema):
    try:
        return schema.model_validate(json.loads(data))
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid JSON in 'data' field.",
        )
    except ValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=exc.errors(),
        )


@router.get("", response_model=List[WorkInitiationResponse])
def list_work_initiations(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    cursor_created_at: Optional[datetime] = Query(None),
    cursor_id: Optional[str] = Query(None),
    status_filter: Optional[WorkInitiationStatus] = Query(None, alias="status"),
    work_category: Optional[WorkInitiationCategory] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    records = work_initiation_service.list_work_initiations(
        db=db,
        current_user=current_user,
        skip=skip,
        limit=limit,
        cursor_created_at=cursor_created_at,
        cursor_id=cursor_id,
        status_filter=status_filter,
        work_category=work_category,
        search=search,
    )
    return [WorkInitiationResponse.from_model(record) for record in records]


@router.post(
    "",
    response_model=WorkInitiationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_work_initiation(
    data: str = Form(...),
    attachments: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payload = parse_form_payload(data, WorkInitiationCreate)
    attachment_files = await validate_attachments(attachments)

    record = work_initiation_service.create_work_initiation(
        db=db,
        data=payload,
        current_user=current_user,
        attachments=attachment_files,
    )
    workflow_email.notify_new_request(db, "work_initiation", record.id)
    return WorkInitiationResponse.from_model(record)


@router.get(
    "/eligible-incidents",
    response_model=List[IncidentReportResponse],
)
def list_eligible_incidents_for_work_initiation(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    records = work_initiation_service.list_eligible_incidents_for_work_initiation(
        db=db,
        current_user=current_user,
    )
    return [IncidentReportResponse.from_model(record) for record in records]


@router.get("/{work_initiation_id}", response_model=WorkInitiationResponse)
def get_work_initiation(
    work_initiation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = work_initiation_service.get_work_initiation_for_current_user(
        db=db,
        work_initiation_id=work_initiation_id,
        current_user=current_user,
    )
    return WorkInitiationResponse.from_model(record)


@router.put("/{work_initiation_id}", response_model=WorkInitiationResponse)
async def update_work_initiation(
    work_initiation_id: str,
    data: str = Form(...),
    attachments: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payload = parse_form_payload(data, WorkInitiationUpdate)
    attachment_files = await validate_attachments(attachments)

    record = work_initiation_service.update_work_initiation(
        db=db,
        work_initiation_id=work_initiation_id,
        data=payload,
        current_user=current_user,
        attachments=attachment_files,
    )


    workflow_email.notify_new_request(db, "work_initiation", record.id)

    return WorkInitiationResponse.from_model(record)


@router.post(
    "/{work_initiation_id}/supervisor-review",
    response_model=WorkInitiationResponse,
)
def supervisor_review_work_initiation(
    work_initiation_id: str,
    data: WorkInitiationReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record, approval_request_id = work_initiation_service.supervisor_review_work_initiation(
        db=db,
        work_initiation_id=work_initiation_id,
        data=data,
        current_user=current_user,
    )

    if data.decision == WorkInitiationDecision.approve:
        workflow_email.notify_step_assigned(db, approval_request_id)
    elif data.decision == WorkInitiationDecision.return_:
        workflow_email.notify_request_result(
        db,
        approval_request_id,
        "returned",
        comment=data.comment,
    )
    else:
        workflow_email.notify_request_result(
            db,
            approval_request_id,
            "rejected",
            comment=data.comment,
        )

    return WorkInitiationResponse.from_model(record)


@router.post(
    "/{work_initiation_id}/operations-hod-review",
    response_model=WorkInitiationResponse,
)
def operations_hod_review_work_initiation(
    work_initiation_id: str,
    data: WorkInitiationReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record, approval_request_id = work_initiation_service.operations_hod_review_work_initiation(
        db=db,
        work_initiation_id=work_initiation_id,
        data=data,
        current_user=current_user,
    )

    if data.decision == WorkInitiationDecision.approve:
        workflow_email.notify_request_result(
            db,
            approval_request_id,
            "approved",
            comment=data.comment,
        )

    elif data.decision == WorkInitiationDecision.return_:
        workflow_email.notify_request_result(
            db,
            approval_request_id,
            "returned",
            comment=data.comment,
        )

    else:
        workflow_email.notify_request_result(
            db,
            approval_request_id,
            "rejected",
            comment=data.comment,
        )
    return WorkInitiationResponse.from_model(record)
