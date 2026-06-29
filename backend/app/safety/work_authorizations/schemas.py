from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator

from app.safety.work_authorizations.models import (
    WorkAuthorizationDecision,
    WorkAuthorizationInspectionCheck,
    WorkAuthorizationInspectionResult,
    WorkAuthorizationStatus,
)


class WorkAuthorizationAttachment(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    type: str = Field(..., min_length=1, max_length=50)

    @field_validator("name", "type", mode="before")
    @classmethod
    def strip_text(cls, value):
        return value.strip() if isinstance(value, str) else value


class WorkAuthorizationCreate(BaseModel):
    work_initiation_id: str
    gas_involved: bool = False
    pressurized_system: bool = False
    heat_or_sparks: bool = False
    electrical_isolation: bool = False
    lifting_equipment: bool = False
    ppe_available: bool = False
    additional_safety_note: Optional[str] = Field(None, max_length=5000)
    attachment_notes: Optional[str] = Field(None, max_length=5000)
    attachments: list[WorkAuthorizationAttachment] = Field(default_factory=list)

    @field_validator("additional_safety_note", "attachment_notes", mode="before")
    @classmethod
    def strip_optional_text(cls, value):
        return value.strip() if isinstance(value, str) else value


class WorkAuthorizationHseReviewCreate(BaseModel):
    work_area_safe: WorkAuthorizationInspectionCheck
    emergency_equipment_available: WorkAuthorizationInspectionCheck
    gas_pressure_check_completed: WorkAuthorizationInspectionCheck
    ppe_and_safety_kits_available: WorkAuthorizationInspectionCheck
    safety_controls_in_place: WorkAuthorizationInspectionCheck
    hse_inspection_result: WorkAuthorizationInspectionResult
    hse_inspection_comment: Optional[str] = Field(None, max_length=5000)
    hse_evidence: list[WorkAuthorizationAttachment] = Field(default_factory=list)
    decision: WorkAuthorizationDecision
    decision_comment: Optional[str] = Field(None, max_length=5000)

    @field_validator("hse_inspection_comment", "decision_comment", mode="before")
    @classmethod
    def strip_optional_text(cls, value):
        return value.strip() if isinstance(value, str) else value


class WorkAuthorizationEmployeeSummary(BaseModel):
    id: str
    name: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None
    job_title: Optional[str] = None


class WorkAuthorizationWorkInitiationSummary(BaseModel):
    id: str
    reference: str
    title: str
    status: str
    work_category: str
    related_incident_report_id: Optional[str]
    work_type: list[str]
    location: str
    exact_work_area: Optional[str]
    work_description: str
    reason_for_work: str
    assigned_department: str
    assigned_supervisor: WorkAuthorizationEmployeeSummary
    assigned_workers: list[WorkAuthorizationEmployeeSummary]
    contractors_needed: bool
    selected_contractor_name: Optional[str]
    contractor_contact_email: Optional[str]
    planned_start_at: datetime
    planned_end_at: datetime
    materials_required: Optional[str]


class WorkAuthorizationHseReviewResponse(BaseModel):
    hse_inspector_id: Optional[str]
    hse_inspector_name: Optional[str]
    work_area_safe: Optional[WorkAuthorizationInspectionCheck]
    emergency_equipment_available: Optional[WorkAuthorizationInspectionCheck]
    gas_pressure_check_completed: Optional[WorkAuthorizationInspectionCheck]
    ppe_and_safety_kits_available: Optional[WorkAuthorizationInspectionCheck]
    safety_controls_in_place: Optional[WorkAuthorizationInspectionCheck]
    hse_inspection_result: Optional[WorkAuthorizationInspectionResult]
    hse_inspection_comment: Optional[str]
    hse_evidence: list[dict[str, Any]]
    decision: Optional[WorkAuthorizationDecision]
    decision_comment: Optional[str]
    decided_at: Optional[datetime]


class WorkAuthorizationListItem(BaseModel):
    id: str
    reference: str
    status: WorkAuthorizationStatus
    requester_id: str
    requester_name: Optional[str]
    requester_department: Optional[str]
    requester_role: Optional[str]
    work_initiation_id: str
    work_initiation_reference: Optional[str]
    title: Optional[str]
    location: Optional[str]
    planned_start_at: Optional[datetime]
    planned_end_at: Optional[datetime]
    requested_at: datetime
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_model(cls, authorization):
        initiation = authorization.work_initiation
        return cls(
            id=authorization.id,
            reference=authorization.reference,
            status=authorization.status,
            requester_id=authorization.requester_id,
            requester_name=employee_name(authorization.requester),
            requester_department=employee_department(authorization.requester),
            requester_role=employee_role(authorization.requester),
            work_initiation_id=authorization.work_initiation_id,
            work_initiation_reference=initiation.reference if initiation else None,
            title=initiation.title if initiation else None,
            location=initiation.location if initiation else None,
            planned_start_at=initiation.planned_start_at if initiation else None,
            planned_end_at=initiation.planned_end_at if initiation else None,
            requested_at=authorization.requested_at,
            created_at=authorization.created_at,
            updated_at=authorization.updated_at,
        )


class WorkAuthorizationResponse(WorkAuthorizationListItem):
    work_initiation: Optional[WorkAuthorizationWorkInitiationSummary]
    gas_involved: bool
    pressurized_system: bool
    heat_or_sparks: bool
    electrical_isolation: bool
    lifting_equipment: bool
    ppe_available: bool
    additional_safety_note: Optional[str]
    attachment_notes: Optional[str]
    attachments: list[dict[str, Any]]
    hse_review: Optional[WorkAuthorizationHseReviewResponse]
    is_active: bool

    @classmethod
    def from_model(cls, authorization):
        data = WorkAuthorizationListItem.from_model(authorization).model_dump()
        return cls(
            **data,
            work_initiation=work_initiation_summary(authorization.work_initiation),
            gas_involved=authorization.gas_involved,
            pressurized_system=authorization.pressurized_system,
            heat_or_sparks=authorization.heat_or_sparks,
            electrical_isolation=authorization.electrical_isolation,
            lifting_equipment=authorization.lifting_equipment,
            ppe_available=authorization.ppe_available,
            additional_safety_note=authorization.additional_safety_note,
            attachment_notes=authorization.attachment_notes,
            attachments=authorization.attachments_json or [],
            hse_review=hse_review_response(authorization),
            is_active=authorization.is_active,
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


def employee_summary(employee) -> WorkAuthorizationEmployeeSummary:
    return WorkAuthorizationEmployeeSummary(
        id=employee.id,
        name=employee_name(employee),
        email=employee.user.email if employee and employee.user else None,
        department=employee_department(employee),
        job_title=employee_role(employee),
    )


def work_initiation_summary(work_initiation) -> Optional[WorkAuthorizationWorkInitiationSummary]:
    if not work_initiation:
        return None
    return WorkAuthorizationWorkInitiationSummary(
        id=work_initiation.id,
        reference=work_initiation.reference,
        title=work_initiation.title,
        status=work_initiation.status.value,
        work_category=work_initiation.work_category.value,
        related_incident_report_id=work_initiation.related_incident_report_id,
        work_type=split_list(work_initiation.work_type),
        location=work_initiation.location,
        exact_work_area=work_initiation.exact_work_area,
        work_description=work_initiation.work_description,
        reason_for_work=work_initiation.reason_for_work,
        assigned_department=work_initiation.assigned_department,
        assigned_supervisor=employee_summary(work_initiation.assigned_supervisor),
        assigned_workers=[
            employee_summary(worker.worker)
            for worker in sorted(
                work_initiation.workers,
                key=lambda item: employee_name(item.worker) or "",
            )
        ],
        contractors_needed=work_initiation.contractors_needed,
        selected_contractor_name=work_initiation.selected_contractor_name,
        contractor_contact_email=work_initiation.contractor_contact_email,
        planned_start_at=work_initiation.planned_start_at,
        planned_end_at=work_initiation.planned_end_at,
        materials_required=work_initiation.materials_required,
    )


def hse_review_response(authorization) -> Optional[WorkAuthorizationHseReviewResponse]:
    if not authorization.hse_decision and not authorization.hse_inspection_result:
        return None
    return WorkAuthorizationHseReviewResponse(
        hse_inspector_id=authorization.hse_inspector_id,
        hse_inspector_name=employee_name(authorization.hse_inspector),
        work_area_safe=authorization.work_area_safe,
        emergency_equipment_available=authorization.emergency_equipment_available,
        gas_pressure_check_completed=authorization.gas_pressure_check_completed,
        ppe_and_safety_kits_available=authorization.ppe_and_safety_kits_available,
        safety_controls_in_place=authorization.safety_controls_in_place,
        hse_inspection_result=authorization.hse_inspection_result,
        hse_inspection_comment=authorization.hse_inspection_comment,
        hse_evidence=authorization.hse_evidence_json or [],
        decision=authorization.hse_decision,
        decision_comment=authorization.hse_decision_comment,
        decided_at=authorization.hse_decided_at,
    )
