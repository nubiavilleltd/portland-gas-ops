from datetime import datetime
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import and_, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.employees.models import Department, Employee
from app.shared.models.reference_counter import ReferenceCounter
from app.safety.dependencies import get_employee_for_user
from app.safety.incidents.models import IncidentReportStatus, SafetyIncidentReport
from app.safety.work_initiations.models import (
    SafetyWorkInitiation,
    SafetyWorkInitiationWorker,
    WorkInitiationCategory,
    WorkInitiationDecision,
    WorkInitiationStatus,
)
from app.safety.work_initiations.schemas import (
    WorkInitiationCreate,
    WorkInitiationReviewCreate,
    WorkInitiationUpdate,
)
from app.shared.models.user import User, UserRole


WORK_INITIATION_REFERENCE_ENTITY = "work_initiation"
WORK_INITIATION_REFERENCE_PREFIX = "WI"
ACTIVE_RELATED_INCIDENT_WORK_STATUSES = (
    WorkInitiationStatus.draft,
    WorkInitiationStatus.submitted,
    WorkInitiationStatus.pending,
    WorkInitiationStatus.returned,
    WorkInitiationStatus.approved,
)


def reserve_work_initiation_reference(db: Session) -> str:
    year = datetime.utcnow().year
    counter = (
        db.query(ReferenceCounter)
        .filter(
            ReferenceCounter.entity_type == WORK_INITIATION_REFERENCE_ENTITY,
            ReferenceCounter.year == year,
        )
        .with_for_update()
        .first()
    )

    if counter is None:
        counter = ReferenceCounter(
            entity_type=WORK_INITIATION_REFERENCE_ENTITY,
            year=year,
            next_number=next_work_initiation_number_from_existing_records(db, year),
        )
        db.add(counter)
        try:
            db.flush()
        except IntegrityError:
            db.rollback()
            return reserve_work_initiation_reference(db)

    number = counter.next_number
    counter.next_number += 1
    db.flush()

    return f"{WORK_INITIATION_REFERENCE_PREFIX}-{year}-{number:04d}"


def next_work_initiation_number_from_existing_records(db: Session, year: int) -> int:
    prefix = f"{WORK_INITIATION_REFERENCE_PREFIX}-{year}-"
    references = (
        db.query(SafetyWorkInitiation.reference)
        .filter(SafetyWorkInitiation.reference.like(f"{prefix}%"))
        .all()
    )
    highest = 0
    for (reference,) in references:
        suffix = reference.removeprefix(prefix)
        if suffix.isdigit():
            highest = max(highest, int(suffix))
    return highest + 1


def create_work_initiation(
    db: Session,
    data: WorkInitiationCreate,
    current_user: User,
) -> SafetyWorkInitiation:
    requester = get_employee_for_user(db, current_user)
    validate_incident_work_initiation_rules(db, data, requester)

    assigned_supervisor = get_employee(
        db,
        data.assigned_supervisor_id,
        "Assigned supervisor not found.",
    )
    workers = get_employees(db, data.assigned_worker_ids)

    record = SafetyWorkInitiation(
        reference=reserve_work_initiation_reference(db),
        status=WorkInitiationStatus.submitted,
        requester_id=requester.id,
        title=data.title,
        work_category=data.work_category,
        related_incident_report_id=data.related_incident_report_id,
        work_type=", ".join(data.work_type),
        location=data.location,
        exact_work_area=data.exact_work_area,
        work_description=data.work_description,
        reason_for_work=data.reason_for_work,
        assigned_department=data.assigned_department,
        assigned_supervisor_id=assigned_supervisor.id,
        contractors_needed=data.contractors_needed,
        selected_contractor_name=(
            data.selected_contractor_name if data.contractors_needed else None
        ),
        contractor_contact_email=(
            data.contractor_contact_email if data.contractors_needed else None
        ),
        planned_start_at=data.planned_start_at,
        planned_end_at=data.planned_end_at,
        materials_required=data.materials_required,
    )
    db.add(record)
    db.flush()

    for worker in workers:
        db.add(
            SafetyWorkInitiationWorker(
                work_initiation_id=record.id,
                worker_id=worker.id,
            )
        )

    db.commit()
    return get_work_initiation(db, record.id)


def update_work_initiation(
    db: Session,
    work_initiation_id: str,
    data: WorkInitiationUpdate,
    current_user: User,
) -> SafetyWorkInitiation:
    record = get_work_initiation(db, work_initiation_id)
    requester = get_employee_for_user(db, current_user)

    if record.requester_id != requester.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the requester can update this work initiation.",
        )

    if record.status not in (WorkInitiationStatus.draft, WorkInitiationStatus.returned):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft or returned work initiations can be updated.",
        )

    validate_incident_work_initiation_rules(
        db,
        data,
        requester,
        exclude_work_initiation_id=record.id,
    )

    assigned_supervisor = get_employee(
        db,
        data.assigned_supervisor_id,
        "Assigned supervisor not found.",
    )
    workers = get_employees(db, data.assigned_worker_ids)

    record.status = WorkInitiationStatus.submitted
    record.title = data.title
    record.work_category = data.work_category
    record.related_incident_report_id = data.related_incident_report_id
    record.work_type = ", ".join(data.work_type)
    record.location = data.location
    record.exact_work_area = data.exact_work_area
    record.work_description = data.work_description
    record.reason_for_work = data.reason_for_work
    record.assigned_department = data.assigned_department
    record.assigned_supervisor_id = assigned_supervisor.id
    record.contractors_needed = data.contractors_needed
    record.selected_contractor_name = (
        data.selected_contractor_name if data.contractors_needed else None
    )
    record.contractor_contact_email = (
        data.contractor_contact_email if data.contractors_needed else None
    )
    record.planned_start_at = data.planned_start_at
    record.planned_end_at = data.planned_end_at
    record.materials_required = data.materials_required
    record.supervisor_decision = None
    record.supervisor_id = None
    record.supervisor_comment = None
    record.supervisor_decided_at = None
    record.operations_hod_decision = None
    record.operations_hod_id = None
    record.operations_hod_comment = None
    record.operations_hod_decided_at = None

    record.workers.clear()
    db.flush()

    for worker in workers:
        db.add(
            SafetyWorkInitiationWorker(
                work_initiation_id=record.id,
                worker_id=worker.id,
            )
        )

    db.commit()
    return get_work_initiation(db, record.id)

def supervisor_review_work_initiation(
    db: Session,
    work_initiation_id: str,
    data: WorkInitiationReviewCreate,
    current_user: User,
) -> SafetyWorkInitiation:
    record = get_work_initiation(db, work_initiation_id)
    reviewer = get_employee_for_user(db, current_user)

    if record.status != WorkInitiationStatus.submitted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only submitted work initiations can be reviewed by the assigned supervisor.",
        )

    if reviewer.id != record.assigned_supervisor_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the assigned supervisor can review this work initiation.",
        )

    require_comment_for_negative_decision(data)

    record.supervisor_decision = data.decision
    record.supervisor_id = reviewer.id
    record.supervisor_comment = data.comment
    record.supervisor_decided_at = datetime.utcnow()

    if data.decision == WorkInitiationDecision.approve:
        record.status = WorkInitiationStatus.pending
    elif data.decision == WorkInitiationDecision.return_:
        record.status = WorkInitiationStatus.returned
    else:
        record.status = WorkInitiationStatus.denied

    db.commit()

    return get_work_initiation(db, record.id)


def operations_hod_review_work_initiation(
    db: Session,
    work_initiation_id: str,
    data: WorkInitiationReviewCreate,
    current_user: User,
) -> SafetyWorkInitiation:
    record = get_work_initiation(db, work_initiation_id)
    reviewer = get_employee_for_user(db, current_user)

    if record.status != WorkInitiationStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only work initiations pending Operations HOD review can be reviewed.",
        )

    if record.supervisor_decision != WorkInitiationDecision.approve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Operations HOD can only review after supervisor approval.",
        )

    if current_user.role not in (UserRole.super_admin, UserRole.admin):
        if reviewer.department != Department.operations:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only Operations department users can perform Operations HOD review.",
            )

    require_comment_for_negative_decision(data)

    record.operations_hod_decision = data.decision
    record.operations_hod_id = reviewer.id
    record.operations_hod_comment = data.comment
    record.operations_hod_decided_at = datetime.utcnow()

    if data.decision == WorkInitiationDecision.approve:
        record.status = WorkInitiationStatus.approved
    elif data.decision == WorkInitiationDecision.return_:
        record.status = WorkInitiationStatus.returned
    else:
        record.status = WorkInitiationStatus.denied

    db.commit()

    return get_work_initiation(db, record.id)


def require_comment_for_negative_decision(data: WorkInitiationReviewCreate) -> None:
    if data.decision in (WorkInitiationDecision.return_, WorkInitiationDecision.deny):
        if not data.comment:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Comment is required when returning or denying a work initiation.",
            )


def validate_incident_work_initiation_rules(
    db: Session,
    data: WorkInitiationCreate,
    requester: Employee,
    exclude_work_initiation_id: Optional[str] = None,
) -> None:
    if data.work_category != WorkInitiationCategory.incident_hazard:
        if data.related_incident_report_id:
            get_related_incident(db, data.related_incident_report_id)
        return

    if not data.related_incident_report_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incident/hazard work requires a related incident report.",
        )

    incident = get_related_incident(db, data.related_incident_report_id)

    if incident.status != IncidentReportStatus.recommended:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Related incident report must have corrective action recommended.",
        )

    review = incident.hse_review
    if not review or not review.action_owner_id or not review.assigned_department:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Incident HSE review must include an action owner and assigned "
                "department before work initiation can be created."
            ),
        )

    if not is_incident_work_requester_allowed(
        requester,
        review.action_owner_id,
        review.assigned_department,
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This incident was not recommended to you or your department.",
        )

    existing_record = get_existing_active_work_initiation_for_incident(
        db,
        data.related_incident_report_id,
        exclude_work_initiation_id=exclude_work_initiation_id,
    )
    if existing_record:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": (
                    "A work initiation already exists for this incident. "
                ),
                "existing_work_initiation_id": existing_record.id,
                "existing_work_initiation_reference": existing_record.reference,
            },
        )


def get_related_incident(db: Session, incident_id: str) -> SafetyIncidentReport:
    incident = (
        db.query(SafetyIncidentReport)
        .options(joinedload(SafetyIncidentReport.hse_review))
        .filter(
            SafetyIncidentReport.id == incident_id,
            SafetyIncidentReport.is_active == True,
        )
        .first()
    )
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Related incident report not found.",
        )
    return incident


def get_existing_active_work_initiation_for_incident(
    db: Session,
    incident_id: str,
    exclude_work_initiation_id: Optional[str] = None,
) -> Optional[SafetyWorkInitiation]:
    query = (
        db.query(SafetyWorkInitiation)
        .filter(
            SafetyWorkInitiation.related_incident_report_id == incident_id,
            SafetyWorkInitiation.is_active == True,
            SafetyWorkInitiation.status.in_(ACTIVE_RELATED_INCIDENT_WORK_STATUSES),
        )
    )

    if exclude_work_initiation_id:
        query = query.filter(SafetyWorkInitiation.id != exclude_work_initiation_id)

    return query.order_by(SafetyWorkInitiation.created_at.desc()).first()


def is_incident_work_requester_allowed(
    requester: Employee,
    action_owner_id: str,
    assigned_department: str,
) -> bool:
    if requester.id == action_owner_id:
        return True
    return normalize_department(requester.department) == normalize_department(
        assigned_department
    )


def normalize_department(value) -> str:
    if value is None:
        return ""
    if hasattr(value, "value"):
        value = value.value
    return str(value).strip().casefold()


def get_employee(db: Session, employee_id: str, detail: str) -> Employee:
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)
    return employee


def get_employees(db: Session, employee_ids: list[str]) -> list[Employee]:
    employees = db.query(Employee).filter(Employee.id.in_(employee_ids)).all()
    employees_by_id = {employee.id: employee for employee in employees}
    missing = [employee_id for employee_id in employee_ids if employee_id not in employees_by_id]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assigned worker not found: {missing[0]}",
        )
    return [employees_by_id[employee_id] for employee_id in employee_ids]


def list_work_initiations(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    cursor_created_at: Optional[datetime] = None,
    cursor_id: Optional[str] = None,
    status_filter: Optional[WorkInitiationStatus] = None,
    work_category: Optional[WorkInitiationCategory] = None,
    search: Optional[str] = None,
) -> list[SafetyWorkInitiation]:
    query = (
        db.query(SafetyWorkInitiation)
        .options(
            joinedload(SafetyWorkInitiation.requester).joinedload(Employee.user),
            joinedload(SafetyWorkInitiation.assigned_supervisor).joinedload(Employee.user),
            joinedload(SafetyWorkInitiation.supervisor).joinedload(Employee.user),
            joinedload(SafetyWorkInitiation.operations_hod).joinedload(Employee.user),
            joinedload(SafetyWorkInitiation.workers)
            .joinedload(SafetyWorkInitiationWorker.worker)
            .joinedload(Employee.user),
        )
        .filter(SafetyWorkInitiation.is_active == True)
    )

    if status_filter:
        query = query.filter(SafetyWorkInitiation.status == status_filter)

    if work_category:
        query = query.filter(SafetyWorkInitiation.work_category == work_category)

    if search:
        search_value = f"%{search}%"
        query = query.filter(
            SafetyWorkInitiation.reference.ilike(search_value)
            | SafetyWorkInitiation.title.ilike(search_value)
            | SafetyWorkInitiation.location.ilike(search_value)
            | SafetyWorkInitiation.work_description.ilike(search_value)
        )

    if cursor_created_at and cursor_id:
        query = query.filter(
            or_(
                SafetyWorkInitiation.created_at < cursor_created_at,
                and_(
                    SafetyWorkInitiation.created_at == cursor_created_at,
                    SafetyWorkInitiation.id < cursor_id,
                ),
            )
        )

    query = query.order_by(
        SafetyWorkInitiation.created_at.desc(),
        SafetyWorkInitiation.id.desc(),
    )

    if skip > 0:
        query = query.offset(skip)

    return query.limit(limit).all()


def get_work_initiation(db: Session, work_initiation_id: str) -> SafetyWorkInitiation:
    record = (
        db.query(SafetyWorkInitiation)
        .options(
            joinedload(SafetyWorkInitiation.requester).joinedload(Employee.user),
            joinedload(SafetyWorkInitiation.assigned_supervisor).joinedload(Employee.user),
            joinedload(SafetyWorkInitiation.supervisor).joinedload(Employee.user),
            joinedload(SafetyWorkInitiation.operations_hod).joinedload(Employee.user),
            joinedload(SafetyWorkInitiation.workers)
            .joinedload(SafetyWorkInitiationWorker.worker)
            .joinedload(Employee.user),
        )
        .filter(
            SafetyWorkInitiation.id == work_initiation_id,
            SafetyWorkInitiation.is_active == True,
        )
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work initiation not found.",
        )

    return record
