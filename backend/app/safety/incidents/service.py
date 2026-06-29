from datetime import datetime
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.employees.models import Employee
from app.safety.dependencies import get_employee_for_user
from app.shared.models.reference_counter import ReferenceCounter
from app.shared.models.user import User
from app.safety.incidents.models import (
    IncidentHseDecision,
    IncidentReportStatus,
    IncidentReportType,
    SafetyIncidentHseReview,
    SafetyIncidentReport,
)
from app.safety.incidents.schemas import (
    IncidentHseReviewCreate,
    IncidentReportCreate,
    IncidentReportUpdate,
)

INCIDENT_REFERENCE_ENTITY = "incident_report"
INCIDENT_REFERENCE_PREFIX = "IH"


def reserve_incident_reference(db: Session) -> str:
    year = datetime.utcnow().year
    counter = (
        db.query(ReferenceCounter)
        .filter(
            ReferenceCounter.entity_type == INCIDENT_REFERENCE_ENTITY,
            ReferenceCounter.year == year,
        )
        .with_for_update()
        .first()
    )

    if counter is None:
        counter = ReferenceCounter(
            entity_type=INCIDENT_REFERENCE_ENTITY,
            year=year,
            next_number=next_incident_number_from_existing_reports(db, year),
        )
        db.add(counter)
        try:
            db.flush()
        except IntegrityError:
            db.rollback()
            return reserve_incident_reference(db)

    number = counter.next_number
    counter.next_number += 1
    db.flush()

    return f"{INCIDENT_REFERENCE_PREFIX}-{year}-{number:04d}"


def next_incident_number_from_existing_reports(db: Session, year: int) -> int:
    prefix = f"{INCIDENT_REFERENCE_PREFIX}-{year}-"
    references = (
        db.query(SafetyIncidentReport.reference)
        .filter(SafetyIncidentReport.reference.like(f"{prefix}%"))
        .all()
    )
    highest = 0
    for (reference,) in references:
        suffix = reference.removeprefix(prefix)
        if suffix.isdigit():
            highest = max(highest, int(suffix))
    return highest + 1


def create_incident_report(
    db: Session,
    data: IncidentReportCreate,
    current_user: User,
) -> SafetyIncidentReport:
    employee = get_employee_for_user(db, current_user)

    report = SafetyIncidentReport(
        reference=reserve_incident_reference(db),
        status=IncidentReportStatus.submitted,
        title=data.title,
        report_type=data.report_type,
        location=data.location,
        exact_location=data.exact_location,
        observed_at=data.observed_at,
        related_work_authorization_id=data.related_work_authorization_id,
        description=data.description,
        severity_estimate=data.severity_estimate,
        anyone_injured=data.anyone_injured,
        property_damaged=data.property_damaged,
        gas_fire_environmental_concern=data.gas_fire_environmental_concern,
        immediate_action_taken=data.immediate_action_taken,
        people_involved=data.people_involved,
        additional_notes=data.additional_notes,
        reported_by=employee.id,
    )

    db.add(report)
    db.commit()
    db.refresh(report)

    return get_incident_report(db, report.id)


def create_hse_review(
    db: Session,
    incident_id: str,
    data: IncidentHseReviewCreate,
    inspector: Employee,
) -> SafetyIncidentHseReview:
    report = get_incident_report(db, incident_id)

    if report.status != IncidentReportStatus.submitted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only submitted incident reports can be reviewed by HSE.",
        )

    if report.hse_review:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="HSE review already exists for this incident report.",
        )

    if data.corrective_action_required and data.decision != IncidentHseDecision.recommended:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Corrective action reviews must use recommended decision.",
        )

    if not data.corrective_action_required and data.decision == IncidentHseDecision.recommended:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Action recommended requires corrective action.",
        )

    if data.action_owner_id:
        action_owner = (
            db.query(Employee)
            .filter(Employee.id == data.action_owner_id)
            .first()
        )
        if not action_owner:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Action owner not found.",
            )

    review = SafetyIncidentHseReview(
        incident_report_id=report.id,
        inspector_id=inspector.id,
        confirmed_report_type=data.confirmed_report_type,
        confirmed_severity=data.confirmed_severity,
        findings=data.findings,
        root_cause=data.root_cause,
        corrective_action_required=data.corrective_action_required,
        corrective_action_details=data.corrective_action_details,
        action_owner_id=data.action_owner_id,
        assigned_department=data.assigned_department,
        target_completion_date=data.target_completion_date,
        decision=data.decision,
        comment=data.comment,
    )

    report.status = incident_status_for_hse_decision(data.decision)
    db.add(review)
    db.commit()
    db.refresh(review)

    return get_hse_review(db, review.id)


def incident_status_for_hse_decision(
    decision: IncidentHseDecision,
) -> IncidentReportStatus:
    if decision == IncidentHseDecision.recommended:
        return IncidentReportStatus.recommended
    if decision == IncidentHseDecision.resolved:
        return IncidentReportStatus.resolved
    return IncidentReportStatus.not_resolved


def get_hse_review(db: Session, review_id: str) -> SafetyIncidentHseReview:
    review = (
        db.query(SafetyIncidentHseReview)
        .options(
            joinedload(SafetyIncidentHseReview.inspector).joinedload(Employee.user),
            joinedload(SafetyIncidentHseReview.action_owner).joinedload(Employee.user),
        )
        .filter(SafetyIncidentHseReview.id == review_id)
        .first()
    )
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="HSE review not found.",
        )
    return review


def list_incident_reports(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    status_filter: Optional[IncidentReportStatus] = None,
    report_type: Optional[IncidentReportType] = None,
    search: Optional[str] = None,
) -> list[SafetyIncidentReport]:
    query = (
        db.query(SafetyIncidentReport)
        .options(
            joinedload(SafetyIncidentReport.reporter).joinedload(Employee.user)
        )
        .filter(SafetyIncidentReport.is_active == True)
    )

    if status_filter:
        query = query.filter(SafetyIncidentReport.status == status_filter)

    if report_type:
        query = query.filter(SafetyIncidentReport.report_type == report_type)

    if search:
        search_value = f"%{search}%"
        query = query.filter(
            SafetyIncidentReport.reference.ilike(search_value)
            | SafetyIncidentReport.title.ilike(search_value)
            | SafetyIncidentReport.location.ilike(search_value)
            | SafetyIncidentReport.description.ilike(search_value)
        )

    return (
        query.order_by(SafetyIncidentReport.reported_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_incident_report(
    db: Session,
    incident_id: str,
) -> SafetyIncidentReport:
    report = (
        db.query(SafetyIncidentReport)
        .options(
            joinedload(SafetyIncidentReport.reporter).joinedload(Employee.user),
            joinedload(SafetyIncidentReport.hse_review)
            .joinedload(SafetyIncidentHseReview.inspector)
            .joinedload(Employee.user),
            joinedload(SafetyIncidentReport.hse_review)
            .joinedload(SafetyIncidentHseReview.action_owner)
            .joinedload(Employee.user),
        )
        .filter(
            SafetyIncidentReport.id == incident_id,
            SafetyIncidentReport.is_active == True,
        )
        .first()
    )

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident report not found",
        )

    return report


def update_incident_report(
    db: Session,
    incident_id: str,
    data: IncidentReportUpdate,
) -> SafetyIncidentReport:
    report = get_incident_report(db, incident_id)

    update_data = data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(report, field, value)

    db.commit()
    db.refresh(report)

    return get_incident_report(db, report.id)


def deactivate_incident_report(
    db: Session,
    incident_id: str,
) -> None:
    report = get_incident_report(db, incident_id)

    report.is_active = False

    db.commit()
