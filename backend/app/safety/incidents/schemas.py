from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.safety.incidents.models import (
    IncidentHseDecision,
    IncidentReportStatus,
    IncidentReportType,
    IncidentSeverityEstimate,
)



class IncidentReportCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)

    report_type: IncidentReportType

    location: str = Field(..., min_length=2, max_length=255)
    exact_location: Optional[str] = Field(None, max_length=255)

    observed_at: datetime

    related_work_authorization_id: Optional[str] = None

    description: str = Field(..., min_length=5, max_length=5000)

    severity_estimate: Optional[IncidentSeverityEstimate] = None

    anyone_injured: bool = False
    property_damaged: bool = False
    gas_fire_environmental_concern: bool = False

    immediate_action_taken: Optional[str] = Field(None, max_length=5000)
    people_involved: Optional[str] = Field(None, max_length=5000)
    additional_notes: Optional[str] = Field(None, max_length=5000)

    @field_validator(
        "title",
        "location",
        "exact_location",
        "description",
        "immediate_action_taken",
        "people_involved",
        "additional_notes",
        mode="before",
    )
    @classmethod
    def strip_text(cls, value):
        return value.strip() if isinstance(value, str) else value


class IncidentReportUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)

    report_type: Optional[IncidentReportType] = None

    location: Optional[str] = Field(None, min_length=2, max_length=255)
    exact_location: Optional[str] = Field(None, max_length=255)

    observed_at: Optional[datetime] = None

    related_work_authorization_id: Optional[str] = None

    description: Optional[str] = Field(None, min_length=5, max_length=5000)

    severity_estimate: Optional[IncidentSeverityEstimate] = None

    anyone_injured: Optional[bool] = None
    property_damaged: Optional[bool] = None
    gas_fire_environmental_concern: Optional[bool] = None

    immediate_action_taken: Optional[str] = Field(None, max_length=5000)
    people_involved: Optional[str] = Field(None, max_length=5000)
    additional_notes: Optional[str] = Field(None, max_length=5000)


class IncidentHseReviewCreate(BaseModel):
    confirmed_report_type: IncidentReportType
    confirmed_severity: IncidentSeverityEstimate
    findings: str = Field(..., min_length=3, max_length=5000)
    root_cause: Optional[str] = Field(None, max_length=5000)
    corrective_action_required: bool = False
    corrective_action_details: Optional[str] = Field(None, max_length=5000)
    action_owner_id: Optional[str] = None
    assigned_department: Optional[str] = Field(None, max_length=100)
    target_completion_date: Optional[date] = None
    decision: IncidentHseDecision
    comment: Optional[str] = Field(None, max_length=5000)

    @field_validator(
        "findings",
        "root_cause",
        "corrective_action_details",
        "assigned_department",
        "comment",
        mode="before",
    )
    @classmethod
    def strip_text(cls, value):
        return value.strip() if isinstance(value, str) else value


class IncidentHseReviewResponse(BaseModel):
    id: str
    incident_report_id: str
    inspector_id: str
    inspector_name: Optional[str] = None
    confirmed_report_type: IncidentReportType
    confirmed_severity: IncidentSeverityEstimate
    findings: str
    root_cause: Optional[str]
    corrective_action_required: bool
    corrective_action_details: Optional[str]
    action_owner_id: Optional[str]
    action_owner_name: Optional[str] = None
    assigned_department: Optional[str]
    target_completion_date: Optional[date]
    decision: IncidentHseDecision
    comment: Optional[str]
    reviewed_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

    @classmethod
    def from_model(cls, review):
        data = cls.model_validate(review)
        if review.inspector and review.inspector.user:
            data.inspector_name = review.inspector.user.full_name or review.inspector.user.email
        if review.action_owner and review.action_owner.user:
            data.action_owner_name = review.action_owner.user.full_name or review.action_owner.user.email
        return data


class IncidentReportListItem(BaseModel):
    id: str
    reference: str
    status: IncidentReportStatus

    title: str
    report_type: IncidentReportType

    location: str
    exact_location: Optional[str]

    observed_at: datetime

    severity_estimate: Optional[IncidentSeverityEstimate]

    anyone_injured: bool
    property_damaged: bool
    gas_fire_environmental_concern: bool

    reported_by: str
    reporter_name: Optional[str] = None
    reporter_department: Optional[str] = None
    reporter_role: Optional[str] = None
    reported_at: datetime

    created_at: datetime

    class Config:
        from_attributes = True

    @classmethod
    def from_model(cls, report):
        data = cls.model_validate(report)

        if report.reporter and report.reporter.user:
            data.reporter_name = report.reporter.user.full_name or report.reporter.user.email
        if report.reporter:
            data.reporter_department = (
                report.reporter.department.value
                if report.reporter.department
                else None
            )
            data.reporter_role = report.reporter.job_title

        return data


class IncidentReportResponse(IncidentReportListItem):
    related_work_authorization_id: Optional[str]

    description: str

    immediate_action_taken: Optional[str]
    people_involved: Optional[str]
    additional_notes: Optional[str]

    resolution_work_closeout_id: Optional[str]

    is_active: bool
    updated_at: datetime
    hse_review: Optional[IncidentHseReviewResponse] = None

    class Config:
        from_attributes = True

    @classmethod
    def from_model(cls, report):
        data = cls.model_validate(report)

        if report.reporter and report.reporter.user:
            data.reporter_name = report.reporter.user.full_name or report.reporter.user.email
        if report.reporter:
            data.reporter_department = (
                report.reporter.department.value
                if report.reporter.department
                else None
            )
            data.reporter_role = report.reporter.job_title
        if report.hse_review:
            data.hse_review = IncidentHseReviewResponse.from_model(report.hse_review)

        return data
