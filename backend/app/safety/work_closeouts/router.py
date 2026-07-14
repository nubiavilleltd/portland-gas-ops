import json
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.employees.models import Employee
from app.safety.dependencies import require_hse_reviewer
from app.safety.work_closeouts import service as work_closeout_service
from app.safety.work_closeouts.models import WorkCloseOutDecision, WorkCloseOutStatus
from app.safety.work_closeouts.schemas import (
    WorkCloseOutCreate,
    WorkCloseOutDecisionCreate,
    WorkCloseOutHseReviewCreate,
    WorkCloseOutListItem,
    WorkCloseOutResponse,
    WorkCloseOutUpdate,
)
from app.safety.work_authorizations.schemas import WorkAuthorizationResponse
from app.shared.dependencies import get_current_user
from app.shared.models.user import User
from app.shared.services import workflow_email


router = APIRouter(
    prefix="/work-closeouts",
    tags=["Safety Work Close-Outs"],
)

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

        validated.append(
            (
                file_bytes,
                file.filename,
                file.content_type or "application/octet-stream",
                len(file_bytes),
            )
        )

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
            detail=exc.errors(include_url=False),
        )


@router.get("", response_model=List[WorkCloseOutListItem])
def list_work_closeouts(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    cursor_created_at: Optional[datetime] = Query(None),
    cursor_id: Optional[str] = Query(None),
    status_filter: Optional[WorkCloseOutStatus] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    records = work_closeout_service.list_work_closeouts(
        db=db,
        current_user=current_user,
        skip=skip,
        limit=limit,
        cursor_created_at=cursor_created_at,
        cursor_id=cursor_id,
        status_filter=status_filter,
        search=search,
    )

    return [WorkCloseOutListItem.from_model(record) for record in records]


@router.get(
    "/eligible-work-authorizations",
    response_model=List[WorkAuthorizationResponse],
)
def list_eligible_work_authorizations_for_closeout(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    records = work_closeout_service.list_eligible_work_authorizations_for_closeout(
        db=db,
        current_user=current_user,
    )
    return [WorkAuthorizationResponse.from_model(record) for record in records]


@router.post(
    "",
    response_model=WorkCloseOutResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_work_closeout(
    data: str = Form(...),
    completion_evidence: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payload = parse_form_payload(data, WorkCloseOutCreate)
    evidence_files = await validate_attachments(completion_evidence)

    record = work_closeout_service.create_work_closeout(
        db=db,
        data=payload,
        current_user=current_user,
        completion_evidence=evidence_files,
    )
    workflow_email.notify_new_request(db, "work_closeout", record.id)

    return WorkCloseOutResponse.from_model(record)


@router.get("/{work_closeout_id}", response_model=WorkCloseOutResponse)
def get_work_closeout(
    work_closeout_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = work_closeout_service.get_work_closeout_for_current_user(
        db=db,
        work_closeout_id=work_closeout_id,
        current_user=current_user,
    )

    return WorkCloseOutResponse.from_model(record)


@router.put("/{work_closeout_id}", response_model=WorkCloseOutResponse)
async def update_work_closeout(
    work_closeout_id: str,
    data: str = Form(...),
    completion_evidence: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payload = parse_form_payload(data, WorkCloseOutUpdate)
    evidence_files = await validate_attachments(completion_evidence)

    record = work_closeout_service.update_work_closeout(
        db=db,
        work_closeout_id=work_closeout_id,
        data=payload,
        current_user=current_user,
        completion_evidence=evidence_files,
    )
    workflow_email.notify_new_request(db, "work_closeout", record.id)

    return WorkCloseOutResponse.from_model(record)


@router.post("/{work_closeout_id}/supervisor-review", response_model=WorkCloseOutResponse)
def supervisor_review(
    work_closeout_id: str,
    data: WorkCloseOutDecisionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record, approval_request_id = work_closeout_service.supervisor_decision(
        db=db,
        work_closeout_id=work_closeout_id,
        data=data,
        current_user=current_user,
    )
    notify_closeout_decision_result(
        db,
        approval_request_id,
        data.decision,
        data.comment,
        is_final_step=False,
    )

    return WorkCloseOutResponse.from_model(record)


@router.post("/{work_closeout_id}/operations-head-review", response_model=WorkCloseOutResponse)
def operations_head_review(
    work_closeout_id: str,
    data: WorkCloseOutDecisionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record, approval_request_id = work_closeout_service.operations_head_decision(
        db=db,
        work_closeout_id=work_closeout_id,
        data=data,
        current_user=current_user,
    )
    notify_closeout_decision_result(
        db,
        approval_request_id,
        data.decision,
        data.comment,
        is_final_step=False,
    )

    return WorkCloseOutResponse.from_model(record)


@router.post("/{work_closeout_id}/hse-review", response_model=WorkCloseOutResponse)
def hse_review(
    work_closeout_id: str,
    data: WorkCloseOutHseReviewCreate,
    db: Session = Depends(get_db),
    inspector: Employee = Depends(require_hse_reviewer),
):
    record, approval_request_id = work_closeout_service.hse_decision(
        db=db,
        work_closeout_id=work_closeout_id,
        data=data,
        inspector=inspector,
    )
    notify_closeout_decision_result(
        db,
        approval_request_id,
        data.decision,
        data.comment,
        is_final_step=True,
    )

    return WorkCloseOutResponse.from_model(record)


def notify_closeout_decision_result(
    db: Session,
    approval_request_id: str,
    decision: WorkCloseOutDecision,
    comment: Optional[str],
    is_final_step: bool,
) -> None:
    if decision in (WorkCloseOutDecision.approve, WorkCloseOutDecision.acknowledge):
        if is_final_step:
            workflow_email.notify_request_result(
                db,
                approval_request_id,
                "approved",
                comment=comment,
            )
        else:
            workflow_email.notify_step_assigned(db, approval_request_id)
    elif decision == WorkCloseOutDecision.return_:
        workflow_email.notify_request_result(
            db,
            approval_request_id,
            "returned",
            comment=comment,
        )
    else:
        workflow_email.notify_request_result(
            db,
            approval_request_id,
            "rejected",
            comment=comment,
        )
