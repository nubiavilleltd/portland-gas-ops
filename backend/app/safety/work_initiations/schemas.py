from typing import Optional
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel, Field, field_validator, model_validator

from app.safety.date_rules import MIN_SCHEDULE_DURATION_MINUTES
from app.safety.work_initiations.models import (
    WorkInitiationCategory,
    WorkInitiationDecision,
    WorkInitiationStatus,
)

def to_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)

    return value.astimezone(timezone.utc)

class WorkInitiationCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    work_category: WorkInitiationCategory
    related_incident_report_id: Optional[str] = None
    work_type: list[str] = Field(..., min_length=1)
    location: str = Field(..., min_length=2, max_length=255)
    exact_work_area: Optional[str] = Field(None, max_length=255)
    work_description: str = Field(..., min_length=5, max_length=5000)
    reason_for_work: str = Field(..., min_length=3, max_length=5000)
    assigned_department: str = Field(..., min_length=2, max_length=100)
    assigned_supervisor_id: str
    assigned_worker_ids: list[str] = Field(..., min_length=1)
    contractors_needed: bool = False
    selected_contractor_name: Optional[str] = Field(None, max_length=255)
    contractor_contact_email: Optional[str] = Field(None, max_length=255)
    planned_start_at: datetime
    planned_end_at: datetime
    materials_required: Optional[str] = Field(None, max_length=5000)

    @field_validator(
        "title",
        "location",
        "exact_work_area",
        "work_description",
        "reason_for_work",
        "assigned_department",
        "selected_contractor_name",
        "contractor_contact_email",
        "materials_required",
        mode="before",
    )
    @classmethod
    def strip_text(cls, value):
        return value.strip() if isinstance(value, str) else value

    @field_validator("work_type", "assigned_worker_ids")
    @classmethod
    def dedupe_list(cls, value: list[str]):
        seen: set[str] = set()
        deduped: list[str] = []
        for item in value:
            cleaned = item.strip() if isinstance(item, str) else item
            if cleaned and cleaned not in seen:
                seen.add(cleaned)
                deduped.append(cleaned)
        return deduped

    @model_validator(mode="after")
    def validate_planned_dates(self):
        now = datetime.now(timezone.utc)
        minimum_start_time = now + timedelta(minutes=10)

        planned_start = to_utc(self.planned_start_at)
        planned_end = to_utc(self.planned_end_at)

        if planned_start < minimum_start_time:
            raise ValueError("Planned start date/time must be at least 10 minutes from now.")

        if planned_end < now:
            raise ValueError("Planned end date/time cannot be in the past.")

        minimum_end_time = planned_start + timedelta(
            minutes=MIN_SCHEDULE_DURATION_MINUTES,
        )
        if planned_end < minimum_end_time:
            raise ValueError(
                f"Planned end date/time must be at least {MIN_SCHEDULE_DURATION_MINUTES} "
                "minutes after planned start date/time."
            )

        return self


class WorkInitiationUpdate(WorkInitiationCreate):
    pass

class WorkInitiationReviewCreate(BaseModel):
    decision: WorkInitiationDecision
    comment: Optional[str] = None

    @field_validator("comment", mode="before")
    @classmethod
    def strip_comment(cls, value):
        return value.strip() if isinstance(value, str) else value


class WorkInitiationEmployeeSummary(BaseModel):
    id: str
    name: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None
    job_title: Optional[str] = None


class WorkInitiationReviewResponse(BaseModel):
    decision: WorkInitiationDecision
    reviewer_id: Optional[str] = None
    reviewer_name: Optional[str] = None
    comment: Optional[str] = None
    decided_at: Optional[datetime] = None


class WorkInitiationListItem(BaseModel):
    id: str
    reference: str
    status: WorkInitiationStatus
    requester_id: str
    requester_name: Optional[str] = None
    requester_department: Optional[str] = None
    requester_role: Optional[str] = None
    title: str
    work_category: WorkInitiationCategory
    related_incident_report_id: Optional[str]
    work_type: list[str]
    location: str
    exact_work_area: Optional[str]
    planned_start_at: datetime
    planned_end_at: datetime
    assigned_department: str
    assigned_supervisor_id: str
    assigned_supervisor_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_model(cls, work_initiation):
        return cls(
            id=work_initiation.id,
            reference=work_initiation.reference,
            status=work_initiation.status,
            requester_id=work_initiation.requester_id,
            requester_name=employee_name(work_initiation.requester),
            requester_department=employee_department(work_initiation.requester),
            requester_role=employee_role(work_initiation.requester),
            title=work_initiation.title,
            work_category=work_initiation.work_category,
            related_incident_report_id=work_initiation.related_incident_report_id,
            work_type=split_work_type(work_initiation.work_type),
            location=work_initiation.location,
            exact_work_area=work_initiation.exact_work_area,
            planned_start_at=work_initiation.planned_start_at,
            planned_end_at=work_initiation.planned_end_at,
            assigned_department=work_initiation.assigned_department,
            assigned_supervisor_id=work_initiation.assigned_supervisor_id,
            assigned_supervisor_name=employee_name(work_initiation.assigned_supervisor),
            created_at=work_initiation.created_at,
            updated_at=work_initiation.updated_at,
        )


class WorkInitiationResponse(WorkInitiationListItem):
    work_description: str
    reason_for_work: str
    contractors_needed: bool
    selected_contractor_name: Optional[str]
    contractor_contact_email: Optional[str]
    materials_required: Optional[str]
    assigned_workers: list[WorkInitiationEmployeeSummary]
    supervisor_review: Optional[WorkInitiationReviewResponse] = None
    operations_hod_review: Optional[WorkInitiationReviewResponse] = None
    is_active: bool

    @classmethod
    def from_model(cls, work_initiation):
        data = WorkInitiationListItem.from_model(work_initiation).model_dump()
        return cls(
            **data,
            work_description=work_initiation.work_description,
            reason_for_work=work_initiation.reason_for_work,
            contractors_needed=work_initiation.contractors_needed,
            selected_contractor_name=work_initiation.selected_contractor_name,
            contractor_contact_email=work_initiation.contractor_contact_email,
            materials_required=work_initiation.materials_required,
            assigned_workers=[
                employee_summary(worker.worker)
                for worker in sorted(
                    work_initiation.workers,
                    key=lambda item: employee_name(item.worker) or "",
                )
            ],
            supervisor_review=build_review(
                work_initiation.supervisor_decision,
                work_initiation.supervisor,
                work_initiation.supervisor_comment,
                work_initiation.supervisor_decided_at,
            ),
            operations_hod_review=build_review(
                work_initiation.operations_hod_decision,
                work_initiation.operations_hod,
                work_initiation.operations_hod_comment,
                work_initiation.operations_hod_decided_at,
            ),
            is_active=work_initiation.is_active,
        )


def split_work_type(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


def employee_name(employee) -> Optional[str]:
    if not employee or not employee.user:
        return None
    return employee.user.full_name or employee.user.email


def employee_department(employee) -> Optional[str]:
    if not employee or not employee.department_rel:
        return None
    return employee.department_rel.name


def employee_role(employee) -> Optional[str]:
    if not employee:
        return None
    return employee.job_title


def employee_summary(employee) -> WorkInitiationEmployeeSummary:
    return WorkInitiationEmployeeSummary(
        id=employee.id,
        name=employee_name(employee),
        email=employee.user.email if employee and employee.user else None,
        department=employee_department(employee),
        job_title=employee_role(employee),
    )


def build_review(
    decision,
    reviewer,
    comment: Optional[str],
    decided_at: Optional[datetime],
) -> Optional[WorkInitiationReviewResponse]:
    if not decision:
        return None
    return WorkInitiationReviewResponse(
        decision=decision,
        reviewer_id=reviewer.id if reviewer else None,
        reviewer_name=employee_name(reviewer),
        comment=comment,
        decided_at=decided_at,
    )
