from datetime import datetime, timedelta, timezone
from typing import Optional

from pydantic import BaseModel, Field, field_validator, model_validator

from app.safety.checklists.schemas import ChecklistAnswerCreate
from app.safety.work_closeouts.models import (
    WorkCloseOutAnswer,
    WorkCloseOutDecision,
    WorkCloseOutReviewerRole,
    WorkCloseOutStatus,
)


def to_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)

    return value.astimezone(timezone.utc)


class WorkCloseOutAttachmentResponse(BaseModel):
    id: str
    name: str
    url: str
    mime_type: Optional[str] = None
    file_size: Optional[int] = None
    type: str


class WorkCloseOutCreate(BaseModel):
    work_authorization_id: str

    actual_start_at: datetime
    actual_completion_at: datetime

    work_completed: bool
    completed_as_approved: bool
    deviation_explanation: Optional[str] = Field(None, max_length=5000)
    completion_summary: str = Field(..., min_length=3, max_length=5000)
    incident_observed: bool = False
    incident_note: Optional[str] = Field(None, max_length=5000)
    completion_notes: Optional[str] = Field(None, max_length=5000)

    monitored_during_execution: bool
    stayed_within_scope: bool
    ppe_and_controls_maintained: bool
    unsafe_condition_addressed: WorkCloseOutAnswer = WorkCloseOutAnswer.not_applicable
    monitoring_comment: Optional[str] = Field(None, max_length=5000)

    work_area_cleaned: bool
    tools_removed: bool
    system_safe: bool
    remaining_hazard: bool = False
    remaining_hazard_details: Optional[str] = Field(None, max_length=5000)

    completion_checklist_answers: list[ChecklistAnswerCreate] = Field(..., min_length=1)
    monitoring_checklist_answers: list[ChecklistAnswerCreate] = Field(..., min_length=1)
    area_condition_checklist_answers: list[ChecklistAnswerCreate] = Field(..., min_length=1)

    @field_validator(
        "deviation_explanation",
        "completion_summary",
        "incident_note",
        "completion_notes",
        "monitoring_comment",
        "remaining_hazard_details",
        mode="before",
    )
    @classmethod
    def strip_text(cls, value):
        return value.strip() if isinstance(value, str) else value

    @model_validator(mode="after")
    def validate_completion_details(self):
        now = datetime.now(timezone.utc)
        latest_actual_time = now - timedelta(minutes=10)
        actual_start = to_utc(self.actual_start_at)
        actual_completion = to_utc(self.actual_completion_at)

        if actual_start > latest_actual_time:
            raise ValueError("Actual start date/time must be at least 10 minutes in the past.")

        if actual_completion > latest_actual_time:
            raise ValueError("Actual completion date/time must be at least 10 minutes in the past.")

        if actual_completion < actual_start:
            raise ValueError("Actual completion date/time must be after actual start date/time.")

        if not self.completed_as_approved and not self.deviation_explanation:
            raise ValueError("Deviation explanation is required when work was not completed as approved.")

        if self.incident_observed and not self.incident_note:
            raise ValueError("Incident/hazard note is required when an incident or hazard was observed.")

        if self.remaining_hazard and not self.remaining_hazard_details:
            raise ValueError("Remaining hazard details are required when a remaining hazard exists.")

        return self


class WorkCloseOutDecisionCreate(BaseModel):
    decision: WorkCloseOutDecision
    comment: Optional[str] = Field(None, max_length=5000)

    @field_validator("comment", mode="before")
    @classmethod
    def strip_comment(cls, value):
        return value.strip() if isinstance(value, str) else value


class WorkCloseOutHseReviewCreate(WorkCloseOutDecisionCreate):
    verified_close_out: bool
    area_safe_for_operations: bool
    corrective_action_required: bool
    corrective_action_details: Optional[str] = Field(None, max_length=5000)

    @field_validator("corrective_action_details", mode="before")
    @classmethod
    def strip_details(cls, value):
        return value.strip() if isinstance(value, str) else value


class WorkCloseOutEmployeeSummary(BaseModel):
    id: str
    name: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None
    job_title: Optional[str] = None


class WorkCloseOutAuthorizationSummary(BaseModel):
    id: str
    reference: str
    status: str
    work_initiation_id: str
    work_initiation_reference: Optional[str]
    related_incident_report_id: Optional[str]
    title: Optional[str]
    location: Optional[str]
    exact_work_area: Optional[str]
    work_type: list[str]
    assigned_supervisor: Optional[str]
    assigned_workers: list[str]
    planned_start_at: Optional[datetime]
    planned_end_at: Optional[datetime]
    hse_approver: Optional[str]


class WorkCloseOutReviewResponse(BaseModel):
    decision: WorkCloseOutDecision
    reviewer_id: Optional[str] = None
    reviewer_name: Optional[str] = None
    comment: Optional[str] = None
    decided_at: Optional[datetime] = None


class WorkCloseOutHseReviewResponse(BaseModel):
    inspector_id: Optional[str] = None
    inspector_name: Optional[str] = None
    verified_close_out: Optional[bool] = None
    area_safe_for_operations: Optional[bool] = None
    corrective_action_required: Optional[bool] = None
    corrective_action_details: Optional[str] = None
    decision: Optional[WorkCloseOutDecision] = None
    comment: Optional[str] = None
    decided_at: Optional[datetime] = None


class WorkCloseOutListItem(BaseModel):
    id: str
    reference: str
    status: WorkCloseOutStatus
    requester_id: str
    requester_name: Optional[str]
    requester_department: Optional[str]
    requester_role: Optional[str]
    work_authorization_id: str
    work_authorization_reference: Optional[str]
    related_incident_report_id: Optional[str]
    title: Optional[str]
    location: Optional[str]
    actual_start_at: datetime
    actual_completion_at: datetime
    submitted_at: datetime
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_model(cls, closeout):
        authorization = closeout.work_authorization
        initiation = authorization.work_initiation if authorization else None

        return cls(
            id=closeout.id,
            reference=closeout.reference,
            status=closeout.status,
            requester_id=closeout.requester_id,
            requester_name=employee_name(closeout.requester),
            requester_department=employee_department(closeout.requester),
            requester_role=employee_role(closeout.requester),
            work_authorization_id=closeout.work_authorization_id,
            work_authorization_reference=authorization.reference if authorization else None,
            related_incident_report_id=initiation.related_incident_report_id if initiation else None,
            title=initiation.title if initiation else None,
            location=initiation.location if initiation else None,
            actual_start_at=closeout.actual_start_at,
            actual_completion_at=closeout.actual_completion_at,
            submitted_at=closeout.submitted_at,
            created_at=closeout.created_at,
            updated_at=closeout.updated_at,
        )


class WorkCloseOutResponse(WorkCloseOutListItem):
    work_authorization: Optional[WorkCloseOutAuthorizationSummary]

    work_completed: bool
    completed_as_approved: bool
    deviation_explanation: Optional[str]
    completion_summary: str
    incident_observed: bool
    incident_note: Optional[str]
    completion_notes: Optional[str]
    completion_evidence: list[WorkCloseOutAttachmentResponse]

    monitored_during_execution: bool
    stayed_within_scope: bool
    ppe_and_controls_maintained: bool
    unsafe_condition_addressed: WorkCloseOutAnswer
    monitoring_comment: Optional[str]

    work_area_cleaned: bool
    tools_removed: bool
    system_safe: bool
    remaining_hazard: bool
    remaining_hazard_details: Optional[str]

    supervisor_review: Optional[WorkCloseOutReviewResponse]
    operations_head_review: Optional[WorkCloseOutReviewResponse]
    hse_review: Optional[WorkCloseOutHseReviewResponse]
    is_exception: bool
    is_active: bool

    @classmethod
    def from_model(cls, closeout):
        data = WorkCloseOutListItem.from_model(closeout).model_dump()

        return cls(
            **data,
            work_authorization=authorization_summary(closeout.work_authorization),
            work_completed=closeout.work_completed,
            completed_as_approved=closeout.completed_as_approved,
            deviation_explanation=closeout.deviation_explanation,
            completion_summary=closeout.completion_summary,
            incident_observed=closeout.incident_observed,
            incident_note=closeout.incident_note,
            completion_notes=closeout.completion_notes,
            completion_evidence=attachment_responses(
                getattr(closeout, "completion_evidence", []) or []
            ),
            monitored_during_execution=closeout.monitored_during_execution,
            stayed_within_scope=closeout.stayed_within_scope,
            ppe_and_controls_maintained=closeout.ppe_and_controls_maintained,
            unsafe_condition_addressed=closeout.unsafe_condition_addressed,
            monitoring_comment=closeout.monitoring_comment,
            work_area_cleaned=closeout.work_area_cleaned,
            tools_removed=closeout.tools_removed,
            system_safe=closeout.system_safe,
            remaining_hazard=closeout.remaining_hazard,
            remaining_hazard_details=closeout.remaining_hazard_details,
            supervisor_review=build_review(
                get_closeout_review(closeout, WorkCloseOutReviewerRole.supervisor),
            ),
            operations_head_review=build_review(
                get_closeout_review(closeout, WorkCloseOutReviewerRole.operations_head),
            ),
            hse_review=build_hse_review(
                get_closeout_review(closeout, WorkCloseOutReviewerRole.hse),
            ),
            is_exception=is_exception_closeout(closeout),
            is_active=closeout.is_active,
        )


def authorization_summary(authorization) -> Optional[WorkCloseOutAuthorizationSummary]:
    if not authorization:
        return None

    initiation = authorization.work_initiation
    return WorkCloseOutAuthorizationSummary(
        id=authorization.id,
        reference=authorization.reference,
        status=authorization.status.value,
        work_initiation_id=authorization.work_initiation_id,
        work_initiation_reference=initiation.reference if initiation else None,
        related_incident_report_id=initiation.related_incident_report_id if initiation else None,
        title=initiation.title if initiation else None,
        location=initiation.location if initiation else None,
        exact_work_area=initiation.exact_work_area if initiation else None,
        work_type=split_list(initiation.work_type) if initiation else [],
        assigned_supervisor=employee_name(initiation.assigned_supervisor) if initiation else None,
        assigned_workers=[
            employee_name(worker.worker) or "N/A"
            for worker in sorted(
                initiation.workers,
                key=lambda item: employee_name(item.worker) or "",
            )
        ] if initiation else [],
        planned_start_at=initiation.planned_start_at if initiation else None,
        planned_end_at=initiation.planned_end_at if initiation else None,
        hse_approver=employee_name(authorization.hse_inspector),
    )


def build_review(review) -> Optional[WorkCloseOutReviewResponse]:
    if not review:
        return None
    return WorkCloseOutReviewResponse(
        decision=review.decision,
        reviewer_id=review.reviewer_id,
        reviewer_name=employee_name(review.reviewer),
        comment=review.comment,
        decided_at=review.decided_at,
    )


def build_hse_review(review) -> Optional[WorkCloseOutHseReviewResponse]:
    if not review:
        return None
    return WorkCloseOutHseReviewResponse(
        inspector_id=review.reviewer_id,
        inspector_name=employee_name(review.reviewer),
        verified_close_out=review.verified_close_out,
        area_safe_for_operations=review.area_safe_for_operations,
        corrective_action_required=review.corrective_action_required,
        corrective_action_details=review.corrective_action_details,
        decision=review.decision,
        comment=review.comment,
        decided_at=review.decided_at,
    )


def get_closeout_review(closeout, reviewer_role: WorkCloseOutReviewerRole):
    return next(
        (
            review
            for review in (getattr(closeout, "reviews", None) or [])
            if review.reviewer_role == reviewer_role.value
        ),
        None,
    )


def is_exception_closeout(closeout) -> bool:
    return (
        not closeout.work_completed
        or not closeout.completed_as_approved
        or closeout.incident_observed
        or not closeout.monitored_during_execution
        or not closeout.stayed_within_scope
        or not closeout.ppe_and_controls_maintained
        or closeout.unsafe_condition_addressed == WorkCloseOutAnswer.yes
        or not closeout.work_area_cleaned
        or not closeout.tools_removed
        or not closeout.system_safe
        or closeout.remaining_hazard
    )


def split_list(value: Optional[str]) -> list[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(",") if item.strip()]


def employee_name(employee) -> Optional[str]:
    if not employee or not employee.user:
        return None
    return employee.user.full_name or employee.user.email


def employee_department(employee) -> Optional[str]:
    if not employee or not employee.department:
        return None
    return employee.department.value


def employee_role(employee) -> Optional[str]:
    if not employee:
        return None
    return employee.job_title


def attachment_responses(documents) -> list[WorkCloseOutAttachmentResponse]:
    return [
        WorkCloseOutAttachmentResponse(
            id=str(document.id),
            name=document.name,
            url=document.file_path or "",
            mime_type=document.mime_type,
            file_size=document.file_size,
            type=attachment_type_for_mime_type(document.mime_type),
        )
        for document in documents
    ]


def attachment_type_for_mime_type(mime_type: Optional[str]) -> str:
    if not mime_type:
        return "document"
    if mime_type.startswith("image/"):
        return "image"
    if mime_type.startswith("video/"):
        return "video"
    return "document"
