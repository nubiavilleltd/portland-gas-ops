import uuid
from datetime import datetime
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.employees.models import Employee
from app.shared.models.user import User
from app.safety.incidents.models import (
    IncidentReportStatus,
    IncidentReportType,
    SafetyIncidentReport,
)
from app.safety.incidents.schemas import (
    IncidentReportCreate,
    IncidentReportUpdate,
)

def generate_incident_reference() -> str:
    today = datetime.utcnow().strftime("%Y%m%d")
    suffix = uuid.uuid4().hex[:6].upper()

    # Excel example says IH-2026-0001 style.
    # This is still readable and unique enough for now.
    return f"IH-{today}-{suffix}"


def get_current_employee(db: Session, current_user: User) -> Employee:
    employee = (
        db.query(Employee)
        .filter(Employee.user_id == current_user.id)
        .first()
    )

    if not employee:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current user is not linked to an employee profile.",
        )

    return employee


def create_incident_report(
    db: Session,
    data: IncidentReportCreate,
    current_user: User,
) -> SafetyIncidentReport:
    employee = get_current_employee(db, current_user)

    report = SafetyIncidentReport(
        reference=generate_incident_reference(),
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
            joinedload(SafetyIncidentReport.reporter).joinedload(Employee.user)
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
