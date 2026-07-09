from datetime import datetime
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import and_, exists, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.employees.models import Employee
from app.shared.models.reference_counter import ReferenceCounter
from app.safety.dependencies import get_employee_for_user
from app.safety.incidents.models import IncidentReportStatus, SafetyIncidentReport
from app.safety.permissions import require_safety_operations_approver
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
from app.shared.models.user import User
from app.shared.models.approval import (
    AllRequest,
    ApprovalOverallStatus,
    ApprovalRequest,
    ApprovalStepAssignment,
)
from app.shared.services.workflow_engine import WorkflowEngine


WORK_INITIATION_REFERENCE_ENTITY = "work_initiation"
WORK_INITIATION_REFERENCE_PREFIX = "WI"
WORK_INITIATION_REQUEST_TYPE = "work_initiation"
ACTIVE_RELATED_INCIDENT_WORK_STATUSES = (
    WorkInitiationStatus.draft,
    WorkInitiationStatus.submitted,
    WorkInitiationStatus.pending,
    WorkInitiationStatus.returned,
    WorkInitiationStatus.approved,
)

def get_active_workflow_approval_request_id(
    db: Session,
    work_initiation_id: str,
) -> str:
    row = (
        db.query(AllRequest.approval_request_id)
        .join(
            ApprovalRequest,
            ApprovalRequest.id == AllRequest.approval_request_id,
        )
        .filter(
            AllRequest.request_type == WORK_INITIATION_REQUEST_TYPE,
            AllRequest.request_id == work_initiation_id,
            ApprovalRequest.overall_status == ApprovalOverallStatus.pending,
        )
        .first()
    )

    if not row:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No active workflow approval request found for this work initiation.",
        )

    return row.approval_request_id



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
    start_work_initiation_workflow(
    db=db,
    record=record,
    requester=requester,
    assigned_supervisor=assigned_supervisor,
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

    start_work_initiation_workflow(
    db=db,
    record=record,
    requester=requester,
    assigned_supervisor=assigned_supervisor,
    )

    db.commit()
    return get_work_initiation(db, record.id)

def start_work_initiation_workflow(
    db: Session,
    record: SafetyWorkInitiation,
    requester: Employee,
    assigned_supervisor: Employee,
) -> None:
    engine = WorkflowEngine(db)
    engine.start(
        request_type=WORK_INITIATION_REQUEST_TYPE,
        request_id=record.id,
        title=f"{record.reference} — {record.title}",
        requester=requester,
        picked_approvers={
            1: assigned_supervisor.id,
        },
    )


def supervisor_review_work_initiation(
    db: Session,
    work_initiation_id: str,
    data: WorkInitiationReviewCreate,
    current_user: User,
) -> tuple[SafetyWorkInitiation, str]:
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

    approval_request_id = get_active_workflow_approval_request_id(
        db,
        record.id,
    )

    engine = WorkflowEngine(db)

    def mark_supervisor_review() -> None:
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

    if data.decision == WorkInitiationDecision.approve:
        engine.approve(
            approval_request_id,
            reviewer,
            comment=data.comment or None,
        )
        mark_supervisor_review()

    elif data.decision == WorkInitiationDecision.return_:
        engine.return_(
            approval_request_id,
            reviewer,
            comment=data.comment or None,
            on_returned=mark_supervisor_review,
        )

    else:
        engine.reject(
            approval_request_id,
            reviewer,
            comment=data.comment or None,
            on_rejected=mark_supervisor_review,
        )

    db.commit()

    return get_work_initiation(db, record.id), approval_request_id


def operations_hod_review_work_initiation(
    db: Session,
    work_initiation_id: str,
    data: WorkInitiationReviewCreate,
    current_user: User,
) -> tuple[SafetyWorkInitiation, str]:
    record = get_work_initiation(db, work_initiation_id)
    reviewer = get_employee_for_user(db, current_user)
    require_safety_operations_approver(reviewer)

    if record.status != WorkInitiationStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only work initiations pending Operations Manager review can be reviewed.",
        )

    if record.supervisor_decision != WorkInitiationDecision.approve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Operations Manager can only review after supervisor approval.",
        )

    require_comment_for_negative_decision(data)

    approval_request_id = get_active_workflow_approval_request_id(
        db,
        record.id,
    )

    engine = WorkflowEngine(db)

    def mark_operations_review() -> None:
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

    if data.decision == WorkInitiationDecision.approve:
        engine.approve(
            approval_request_id,
            reviewer,
            comment=data.comment or None,
            on_final_approval=mark_operations_review,
        )

    elif data.decision == WorkInitiationDecision.return_:
        engine.return_(
            approval_request_id,
            reviewer,
            comment=data.comment or None,
            on_returned=mark_operations_review,
        )

    else:
        engine.reject(
            approval_request_id,
            reviewer,
            comment=data.comment or None,
            on_rejected=mark_operations_review,
        )

    db.commit()

    return get_work_initiation(db, record.id), approval_request_id


def require_comment_for_negative_decision(data: WorkInitiationReviewCreate) -> None:
    if data.decision in (WorkInitiationDecision.return_, WorkInitiationDecision.deny):
        if not data.comment:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Comment is required when returning or denying a work initiation.",
            )


def validate_incident_work_initiation_rules(
    db: Session,
    data: WorkInitiationCreate | WorkInitiationUpdate,
    requester: Employee,
    exclude_work_initiation_id: Optional[str] = None,
) -> None:
    if data.work_category != WorkInitiationCategory.incident_hazard:
        if data.related_incident_report_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only incident/hazard work can be linked to an incident report.",
            )

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
                "message": "A work initiation already exists for this incident.",
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
    current_user: User,
    skip: int = 0,
    limit: int = 20,
    cursor_created_at: Optional[datetime] = None,
    cursor_id: Optional[str] = None,
    status_filter: Optional[WorkInitiationStatus] = None,
    work_category: Optional[WorkInitiationCategory] = None,
    search: Optional[str] = None,
) -> list[SafetyWorkInitiation]:
    employee = get_employee_for_user(db, current_user)
    current_approval_exists = exists().where(
        ApprovalRequest.request_type == WORK_INITIATION_REQUEST_TYPE,
        ApprovalRequest.request_id == SafetyWorkInitiation.id,
        ApprovalRequest.overall_status == ApprovalOverallStatus.pending,
        ApprovalStepAssignment.approval_request_id == ApprovalRequest.id,
        ApprovalStepAssignment.step_number == ApprovalRequest.current_step_number,
        ApprovalStepAssignment.assigned_to == employee.id,
    )
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
        .filter(
            SafetyWorkInitiation.is_active == True,
            or_(
                SafetyWorkInitiation.requester_id == employee.id,
                SafetyWorkInitiation.workers.any(
                    SafetyWorkInitiationWorker.worker_id == employee.id,
                ),
                current_approval_exists,
            ),
        )
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


def get_work_initiation_for_current_user(
    db: Session,
    work_initiation_id: str,
    current_user: User,
) -> SafetyWorkInitiation:
    record = get_work_initiation(db, work_initiation_id)
    employee = get_employee_for_user(db, current_user)

    if not can_view_work_initiation(db, record, employee):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this work initiation.",
        )

    return record


def can_view_work_initiation(
    db: Session,
    record: SafetyWorkInitiation,
    employee: Employee,
) -> bool:
    if record.requester_id == employee.id:
        return True
    if any(worker.worker_id == employee.id for worker in record.workers):
        return True
    return is_current_work_initiation_approver(db, record.id, employee.id)


def is_current_work_initiation_approver(
    db: Session,
    work_initiation_id: str,
    employee_id: str,
) -> bool:
    return (
        db.query(ApprovalStepAssignment.id)
        .join(
            ApprovalRequest,
            ApprovalRequest.id == ApprovalStepAssignment.approval_request_id,
        )
        .filter(
            ApprovalRequest.request_type == WORK_INITIATION_REQUEST_TYPE,
            ApprovalRequest.request_id == work_initiation_id,
            ApprovalRequest.overall_status == ApprovalOverallStatus.pending,
            ApprovalStepAssignment.step_number == ApprovalRequest.current_step_number,
            ApprovalStepAssignment.assigned_to == employee_id,
        )
        .first()
        is not None
    )


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
