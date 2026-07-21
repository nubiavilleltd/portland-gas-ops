from datetime import datetime, timedelta, timezone
import uuid
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import and_, exists, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.employees.models import Employee
from app.safety.date_rules import SCHEDULE_DEVIATION_TOLERANCE_MINUTES
from app.safety.dependencies import get_employee_for_user
from app.safety.permissions import (
    is_safety_hse_employee,
    require_safety_operations_approver,
)
from app.safety.incidents.models import IncidentReportStatus, SafetyIncidentReport
from app.safety.incidents import email_content as incident_email
from app.safety.checklists.models import (
    SafetyChecklistParentType,
    SafetyChecklistStage,
)
from app.safety.checklists.schemas import ChecklistResponsesCreate
from app.safety.checklists.service import add_parent_responses
from app.safety.work_authorizations.models import (
    SafetyWorkAuthorization,
    WorkAuthorizationStatus,
)
from app.safety.work_closeouts.models import (
    SafetyCloseOutReview,
    SafetyWorkCloseOut,
    WorkCloseOutDecision,
    WorkCloseOutReviewerRole,
    WorkCloseOutStatus,
)
from app.safety.work_closeouts.schemas import (
    WorkCloseOutCreate,
    WorkCloseOutDecisionCreate,
    WorkCloseOutHseReviewCreate,
    WorkCloseOutUpdate,
)
from app.safety.work_initiations.models import (
    SafetyWorkInitiation,
    SafetyWorkInitiationWorker,
)
from app.shared.models.document import Document
from app.shared.models.approval import (
    AllRequest,
    AuditAction,
    ApprovalOverallStatus,
    ApprovalRequest,
    ApprovalStepAssignment,
    WorkflowAuditTrail,
)
from app.shared.models.reference_counter import ReferenceCounter
from app.shared.models.user import User
from app.shared.services.cloudinary_service import ResourceType, get_storage_service
from app.shared.services.post_commit import queue_after_commit
from app.shared.services.workflow_engine import WorkflowEngine


WORK_CLOSEOUT_REFERENCE_ENTITY = "work_closeout"
WORK_CLOSEOUT_REFERENCE_PREFIX = "WCO"
WORK_CLOSEOUT_REQUEST_TYPE = "work_closeout"
WORK_CLOSEOUT_DOCUMENT_CATEGORY_PREFIX = "safety_work_closeout_completion"

ACTIVE_WORK_CLOSEOUT_STATUSES = (
    WorkCloseOutStatus.draft,
    WorkCloseOutStatus.submitted,
    WorkCloseOutStatus.pending,
    WorkCloseOutStatus.returned,
    WorkCloseOutStatus.approved,
    WorkCloseOutStatus.acknowledged,
)


def work_closeout_document_category(work_closeout_id: str) -> str:
    return f"{WORK_CLOSEOUT_DOCUMENT_CATEGORY_PREFIX}:{work_closeout_id}"


def get_active_workflow_approval_request_id(
    db: Session,
    work_closeout_id: str,
) -> str:
    row = (
        db.query(AllRequest.approval_request_id)
        .join(
            ApprovalRequest,
            ApprovalRequest.id == AllRequest.approval_request_id,
        )
        .filter(
            AllRequest.request_type == WORK_CLOSEOUT_REQUEST_TYPE,
            AllRequest.request_id == work_closeout_id,
            ApprovalRequest.overall_status == ApprovalOverallStatus.pending,
        )
        .first()
    )

    if not row:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No active workflow approval request found for this work close-out.",
        )

    return row.approval_request_id


def reserve_work_closeout_reference(db: Session) -> str:
    year = datetime.utcnow().year
    counter = (
        db.query(ReferenceCounter)
        .filter(
            ReferenceCounter.entity_type == WORK_CLOSEOUT_REFERENCE_ENTITY,
            ReferenceCounter.year == year,
        )
        .with_for_update()
        .first()
    )

    if counter is None:
        counter = ReferenceCounter(
            entity_type=WORK_CLOSEOUT_REFERENCE_ENTITY,
            year=year,
            next_number=next_work_closeout_number_from_existing_records(db, year),
        )
        db.add(counter)
        try:
            db.flush()
        except IntegrityError:
            db.rollback()
            return reserve_work_closeout_reference(db)

    number = counter.next_number
    counter.next_number += 1
    db.flush()

    return f"{WORK_CLOSEOUT_REFERENCE_PREFIX}-{year}-{number:04d}"


def next_work_closeout_number_from_existing_records(db: Session, year: int) -> int:
    prefix = f"{WORK_CLOSEOUT_REFERENCE_PREFIX}-{year}-"
    references = (
        db.query(SafetyWorkCloseOut.reference)
        .filter(SafetyWorkCloseOut.reference.like(f"{prefix}%"))
        .all()
    )

    highest = 0
    for (reference,) in references:
        suffix = reference.removeprefix(prefix)
        if suffix.isdigit():
            highest = max(highest, int(suffix))

    return highest + 1


def create_work_closeout(
    db: Session,
    data: WorkCloseOutCreate,
    current_user: User,
    completion_evidence: Optional[list[tuple[bytes, str, str, int]]] = None,
) -> SafetyWorkCloseOut:
    requester = get_employee_for_user(db, current_user)
    completion_evidence = completion_evidence or []

    authorization = get_work_authorization_for_closeout(
        db,
        data.work_authorization_id,
    )

    validate_work_closeout_create_rules(
        db=db,
        authorization=authorization,
        requester=requester,
        data=data,
    )

    record = SafetyWorkCloseOut(
        reference=reserve_work_closeout_reference(db),
        status=WorkCloseOutStatus.submitted,
        requester_id=requester.id,
        work_authorization_id=authorization.id,
        actual_start_at=data.actual_start_at,
        actual_completion_at=data.actual_completion_at,
        work_completed=data.work_completed,
        completed_as_approved=data.completed_as_approved,
        deviation_explanation=data.deviation_explanation,
        completion_summary=data.completion_summary,
        incident_observed=data.incident_observed,
        incident_note=data.incident_note,
        completion_notes=data.completion_notes,
        monitored_during_execution=data.monitored_during_execution,
        stayed_within_scope=data.stayed_within_scope,
        ppe_and_controls_maintained=data.ppe_and_controls_maintained,
        unsafe_condition_addressed=data.unsafe_condition_addressed,
        monitoring_comment=data.monitoring_comment,
        work_area_cleaned=data.work_area_cleaned,
        tools_removed=data.tools_removed,
        system_safe=data.system_safe,
        remaining_hazard=data.remaining_hazard,
        remaining_hazard_details=data.remaining_hazard_details,
    )

    db.add(record)
    db.flush()

    add_work_closeout_checklist_responses(
        db=db,
        record=record,
        data=data,
        answered_by=requester.id,
    )

    create_work_closeout_documents(
        db=db,
        work_closeout_id=record.id,
        files=completion_evidence,
        uploaded_by=requester.id,
    )
    start_work_closeout_workflow(
        db=db,
        record=record,
        requester=requester,
        authorization=authorization,
    )

    db.commit()

    return get_work_closeout(db, record.id)


def update_work_closeout(
    db: Session,
    work_closeout_id: str,
    data: WorkCloseOutUpdate,
    current_user: User,
    completion_evidence: Optional[list[tuple[bytes, str, str, int]]] = None,
) -> SafetyWorkCloseOut:
    requester = get_employee_for_user(db, current_user)
    record = get_work_closeout(db, work_closeout_id)
    completion_evidence = completion_evidence or []

    if record.requester_id != requester.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the requester can update this work close-out.",
        )

    if record.status not in (WorkCloseOutStatus.draft, WorkCloseOutStatus.returned):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft or returned work close-outs can be updated.",
        )

    if record.work_authorization_id != data.work_authorization_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Returned work close-out cannot be linked to a different work authorization.",
        )

    validate_work_closeout_schedule(data, record.work_authorization)

    record.status = WorkCloseOutStatus.submitted
    record.actual_start_at = data.actual_start_at
    record.actual_completion_at = data.actual_completion_at
    record.work_completed = data.work_completed
    record.completed_as_approved = data.completed_as_approved
    record.deviation_explanation = data.deviation_explanation
    record.completion_summary = data.completion_summary
    record.incident_observed = data.incident_observed
    record.incident_note = data.incident_note
    record.completion_notes = data.completion_notes
    record.monitored_during_execution = data.monitored_during_execution
    record.stayed_within_scope = data.stayed_within_scope
    record.ppe_and_controls_maintained = data.ppe_and_controls_maintained
    record.unsafe_condition_addressed = data.unsafe_condition_addressed
    record.monitoring_comment = data.monitoring_comment
    record.work_area_cleaned = data.work_area_cleaned
    record.tools_removed = data.tools_removed
    record.system_safe = data.system_safe
    record.remaining_hazard = data.remaining_hazard
    record.remaining_hazard_details = data.remaining_hazard_details

    record.reviews.clear()
    db.flush()

    add_work_closeout_checklist_responses(
        db=db,
        record=record,
        data=data,
        answered_by=requester.id,
    )

    delete_removed_work_closeout_documents(
        db=db,
        work_closeout_id=record.id,
        retained_completion_evidence_ids=data.retained_completion_evidence_ids,
    )

    create_work_closeout_documents(
        db=db,
        work_closeout_id=record.id,
        files=completion_evidence,
        uploaded_by=requester.id,
    )
    start_work_closeout_workflow(
        db=db,
        record=record,
        requester=requester,
        authorization=record.work_authorization,
    )

    db.commit()
    return get_work_closeout(db, record.id)


def start_work_closeout_workflow(
    db: Session,
    record: SafetyWorkCloseOut,
    requester: Employee,
    authorization: SafetyWorkAuthorization,
) -> None:
    initiation = authorization.work_initiation
    if not initiation or not initiation.assigned_supervisor_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Work close-out cannot start workflow without an assigned supervisor.",
        )

    engine = WorkflowEngine(db)
    engine.start(
        request_type=WORK_CLOSEOUT_REQUEST_TYPE,
        request_id=record.id,
        title=f"{record.reference} — {initiation.title}",
        requester=requester,
        picked_approvers={
            1: initiation.assigned_supervisor_id,
        },
    )


def validate_work_closeout_create_rules(
    db: Session,
    authorization: SafetyWorkAuthorization,
    requester: Employee,
    data: WorkCloseOutCreate,
) -> None:
    if authorization.status != WorkAuthorizationStatus.approved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Work close-out can only be created from an approved work authorization.",
        )

    if not is_closeout_requester_allowed(requester, authorization):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the work authorization requester, assigned supervisor, or assigned workers can submit work completion for close-out.",
        )

    existing_record = get_existing_active_closeout_for_authorization(
        db,
        authorization.id,
    )

    if existing_record:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": (
                    "A work close-out already exists for this work authorization. "
                    "Update and resubmit the existing close-out instead."
                ),
                "existing_work_closeout_id": existing_record.id,
                "existing_work_closeout_reference": existing_record.reference,
            },
        )

    validate_work_closeout_schedule(data, authorization)


def list_eligible_work_authorizations_for_closeout(
    db: Session,
    current_user: User,
) -> list[SafetyWorkAuthorization]:
    requester = get_employee_for_user(db, current_user)
    active_closeout_exists = exists().where(
        SafetyWorkCloseOut.work_authorization_id == SafetyWorkAuthorization.id,
        SafetyWorkCloseOut.is_active == True,
        SafetyWorkCloseOut.status.in_(ACTIVE_WORK_CLOSEOUT_STATUSES),
    )

    return (
        db.query(SafetyWorkAuthorization)
        .options(
            joinedload(SafetyWorkAuthorization.requester).joinedload(Employee.user),
            joinedload(SafetyWorkAuthorization.hse_inspector).joinedload(Employee.user),
            joinedload(SafetyWorkAuthorization.work_initiation)
            .joinedload(SafetyWorkInitiation.requester)
            .joinedload(Employee.user),
            joinedload(SafetyWorkAuthorization.work_initiation)
            .joinedload(SafetyWorkInitiation.assigned_supervisor)
            .joinedload(Employee.user),
            joinedload(SafetyWorkAuthorization.work_initiation)
            .joinedload(SafetyWorkInitiation.workers)
            .joinedload(SafetyWorkInitiationWorker.worker)
            .joinedload(Employee.user),
        )
        .filter(
            SafetyWorkAuthorization.is_active == True,
            SafetyWorkAuthorization.status == WorkAuthorizationStatus.approved,
            ~active_closeout_exists,
            or_(
                SafetyWorkAuthorization.requester_id == requester.id,
                SafetyWorkAuthorization.work_initiation.has(
                    or_(
                        SafetyWorkInitiation.requester_id == requester.id,
                        SafetyWorkInitiation.assigned_supervisor_id == requester.id,
                        SafetyWorkInitiation.workers.any(
                            SafetyWorkInitiationWorker.worker_id == requester.id,
                        ),
                    ),
                ),
            ),
        )
        .order_by(
            SafetyWorkAuthorization.created_at.desc(),
            SafetyWorkAuthorization.id.desc(),
        )
        .all()
    )


def is_closeout_requester_allowed(
    requester: Employee,
    authorization: SafetyWorkAuthorization,
) -> bool:
    initiation = authorization.work_initiation

    if requester.id in (authorization.requester_id, initiation.requester_id, initiation.assigned_supervisor_id):
        return True

    return any(worker.worker_id == requester.id for worker in initiation.workers)


def validate_work_closeout_schedule(
    data: WorkCloseOutCreate,
    authorization: SafetyWorkAuthorization,
) -> None:
    initiation = authorization.work_initiation
    planned_start = to_utc(initiation.planned_start_at) if initiation else None
    planned_end = to_utc(initiation.planned_end_at) if initiation else None
    authorization_requested_at = (
        to_utc(authorization.requested_at)
        if authorization.requested_at
        else None
    )
    actual_start = to_utc(data.actual_start_at)
    actual_completion = to_utc(data.actual_completion_at)

    if authorization_requested_at and (
        actual_start < authorization_requested_at
        or actual_completion < authorization_requested_at
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Actual work time cannot be before the work authorization request date.",
        )

    late_start_threshold = (
        planned_start + timedelta(minutes=SCHEDULE_DEVIATION_TOLERANCE_MINUTES)
        if planned_start is not None
        else None
    )
    early_completion_threshold = (
        planned_end - timedelta(minutes=SCHEDULE_DEVIATION_TOLERANCE_MINUTES)
        if planned_end is not None
        else None
    )
    schedule_deviated = (
        (planned_start is not None and actual_start < planned_start)
        or (late_start_threshold is not None and actual_start > late_start_threshold)
        or (
            early_completion_threshold is not None
            and actual_completion < early_completion_threshold
        )
        or (planned_end is not None and actual_completion > planned_end)
    )
    if schedule_deviated and not data.deviation_explanation:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Deviation explanation is required when actual work timing "
                "falls outside the approved work schedule."
            ),
        )


def add_work_closeout_checklist_responses(
    db: Session,
    record: SafetyWorkCloseOut,
    data: WorkCloseOutCreate,
    answered_by: str,
) -> None:
    response_group_id = record.id
    checklist_groups = (
        (SafetyChecklistStage.completion, data.completion_checklist_answers),
        (SafetyChecklistStage.monitoring, data.monitoring_checklist_answers),
        (SafetyChecklistStage.closeout_review, data.area_condition_checklist_answers),
    )

    for stage, answers in checklist_groups:
        add_parent_responses(
            db=db,
            data=ChecklistResponsesCreate(
                parent_type=SafetyChecklistParentType.work_closeout,
                parent_id=record.id,
                response_group_id=response_group_id,
                answers=answers,
            ),
            answered_by=answered_by,
        )


def to_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)

    return value.astimezone(timezone.utc)


def get_existing_active_closeout_for_authorization(
    db: Session,
    work_authorization_id: str,
) -> Optional[SafetyWorkCloseOut]:
    return (
        db.query(SafetyWorkCloseOut)
        .filter(
            SafetyWorkCloseOut.work_authorization_id == work_authorization_id,
            SafetyWorkCloseOut.is_active == True,
            SafetyWorkCloseOut.status.in_(ACTIVE_WORK_CLOSEOUT_STATUSES),
        )
        .order_by(SafetyWorkCloseOut.created_at.desc())
        .first()
    )


def get_work_authorization_for_closeout(
    db: Session,
    work_authorization_id: str,
) -> SafetyWorkAuthorization:
    authorization = (
        db.query(SafetyWorkAuthorization)
        .options(
            joinedload(SafetyWorkAuthorization.requester).joinedload(Employee.user),
            joinedload(SafetyWorkAuthorization.hse_inspector).joinedload(Employee.user),
            joinedload(SafetyWorkAuthorization.work_initiation)
            .joinedload(SafetyWorkInitiation.assigned_supervisor)
            .joinedload(Employee.user),
            joinedload(SafetyWorkAuthorization.work_initiation)
            .joinedload(SafetyWorkInitiation.workers)
            .joinedload(SafetyWorkInitiationWorker.worker)
            .joinedload(Employee.user),
        )
        .filter(
            SafetyWorkAuthorization.id == work_authorization_id,
            SafetyWorkAuthorization.is_active == True,
        )
        .first()
    )

    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work authorization not found.",
        )

    return authorization


def list_work_closeouts(
    db: Session,
    current_user: User,
    skip: int = 0,
    limit: int = 20,
    cursor_created_at: Optional[datetime] = None,
    cursor_id: Optional[str] = None,
    status_filter: Optional[WorkCloseOutStatus] = None,
    search: Optional[str] = None,
) -> list[SafetyWorkCloseOut]:
    employee = get_employee_for_user(db, current_user)
    current_approval_exists = exists().where(
        ApprovalRequest.request_type == WORK_CLOSEOUT_REQUEST_TYPE,
        ApprovalRequest.request_id == SafetyWorkCloseOut.id,
        ApprovalRequest.overall_status == ApprovalOverallStatus.pending,
        ApprovalStepAssignment.approval_request_id == ApprovalRequest.id,
        ApprovalStepAssignment.step_number == ApprovalRequest.current_step_number,
        ApprovalStepAssignment.assigned_to == employee.id,
    )

    query = (
        db.query(SafetyWorkCloseOut)
        .options(
            joinedload(SafetyWorkCloseOut.requester).joinedload(Employee.user),
            joinedload(SafetyWorkCloseOut.work_authorization)
            .joinedload(SafetyWorkAuthorization.work_initiation)
            .joinedload(SafetyWorkInitiation.workers),
            joinedload(SafetyWorkCloseOut.work_authorization)
            .joinedload(SafetyWorkAuthorization.work_initiation)
            .joinedload(SafetyWorkInitiation.assigned_supervisor)
            .joinedload(Employee.user),
        )
        .filter(SafetyWorkCloseOut.is_active == True)
    )

    if not is_safety_hse_employee(employee):
        query = query.filter(
            or_(
                SafetyWorkCloseOut.requester_id == employee.id,
                SafetyWorkCloseOut.work_authorization.has(
                    SafetyWorkAuthorization.work_initiation.has(
                        or_(
                            SafetyWorkInitiation.assigned_supervisor_id == employee.id,
                            SafetyWorkInitiation.workers.any(
                                SafetyWorkInitiationWorker.worker_id == employee.id,
                            ),
                        ),
                    ),
                ),
                current_approval_exists,
            )
        )

    if status_filter:
        query = query.filter(SafetyWorkCloseOut.status == status_filter)

    if search:
        search_value = f"%{search}%"
        query = (
            query.join(SafetyWorkCloseOut.work_authorization)
            .join(SafetyWorkAuthorization.work_initiation)
            .filter(
                SafetyWorkCloseOut.reference.ilike(search_value)
                | SafetyWorkAuthorization.reference.ilike(search_value)
                | SafetyWorkInitiation.reference.ilike(search_value)
                | SafetyWorkInitiation.title.ilike(search_value)
                | SafetyWorkInitiation.location.ilike(search_value)
            )
        )

    if cursor_created_at and cursor_id:
        query = query.filter(
            or_(
                SafetyWorkCloseOut.created_at < cursor_created_at,
                and_(
                    SafetyWorkCloseOut.created_at == cursor_created_at,
                    SafetyWorkCloseOut.id < cursor_id,
                ),
            )
        )

    query = query.order_by(
        SafetyWorkCloseOut.created_at.desc(),
        SafetyWorkCloseOut.id.desc(),
    )

    if skip > 0:
        query = query.offset(skip)

    return query.limit(limit).all()


def get_work_closeout_for_current_user(
    db: Session,
    work_closeout_id: str,
    current_user: User,
) -> SafetyWorkCloseOut:
    record = get_work_closeout(db, work_closeout_id)
    employee = get_employee_for_user(db, current_user)

    if not can_view_work_closeout(db, record, employee):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this work close-out.",
        )

    return record


def can_view_work_closeout(
    db: Session,
    record: SafetyWorkCloseOut,
    employee: Employee,
) -> bool:
    if is_safety_hse_employee(employee):
        return True
    if record.requester_id == employee.id:
        return True

    authorization = record.work_authorization
    initiation = authorization.work_initiation if authorization else None
    if initiation:
        if initiation.assigned_supervisor_id == employee.id:
            return True
        if any(worker.worker_id == employee.id for worker in initiation.workers):
            return True

    return is_current_work_closeout_approver(db, record.id, employee.id)


def is_current_work_closeout_approver(
    db: Session,
    work_closeout_id: str,
    employee_id: str,
) -> bool:
    return (
        db.query(ApprovalStepAssignment.id)
        .join(
            ApprovalRequest,
            ApprovalRequest.id == ApprovalStepAssignment.approval_request_id,
        )
        .filter(
            ApprovalRequest.request_type == WORK_CLOSEOUT_REQUEST_TYPE,
            ApprovalRequest.request_id == work_closeout_id,
            ApprovalRequest.overall_status == ApprovalOverallStatus.pending,
            ApprovalStepAssignment.step_number == ApprovalRequest.current_step_number,
            ApprovalStepAssignment.assigned_to == employee_id,
        )
        .first()
        is not None
    )


def get_work_closeout(
    db: Session,
    work_closeout_id: str,
) -> SafetyWorkCloseOut:
    record = (
        db.query(SafetyWorkCloseOut)
        .options(
            joinedload(SafetyWorkCloseOut.requester).joinedload(Employee.user),
            joinedload(SafetyWorkCloseOut.reviews)
            .joinedload(SafetyCloseOutReview.reviewer)
            .joinedload(Employee.user),
            joinedload(SafetyWorkCloseOut.work_authorization)
            .joinedload(SafetyWorkAuthorization.hse_inspector)
            .joinedload(Employee.user),
            joinedload(SafetyWorkCloseOut.work_authorization)
            .joinedload(SafetyWorkAuthorization.work_initiation)
            .joinedload(SafetyWorkInitiation.assigned_supervisor)
            .joinedload(Employee.user),
            joinedload(SafetyWorkCloseOut.work_authorization)
            .joinedload(SafetyWorkAuthorization.work_initiation)
            .joinedload(SafetyWorkInitiation.workers)
            .joinedload(SafetyWorkInitiationWorker.worker)
            .joinedload(Employee.user),
        )
        .filter(
            SafetyWorkCloseOut.id == work_closeout_id,
            SafetyWorkCloseOut.is_active == True,
        )
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work close-out not found.",
        )

    record.completion_evidence = list_work_closeout_documents(db, record.id)

    return record


def supervisor_decision(
    db: Session,
    work_closeout_id: str,
    data: WorkCloseOutDecisionCreate,
    current_user: User,
) -> tuple[SafetyWorkCloseOut, str]:
    reviewer = get_employee_for_user(db, current_user)
    record = get_work_closeout(db, work_closeout_id)

    validate_supervisor_decision(record, data, reviewer)

    approval_request_id = get_active_workflow_approval_request_id(
        db,
        record.id,
    )
    engine = WorkflowEngine(db)

    def mark_supervisor_review() -> None:
        add_closeout_review(
            db=db,
            record=record,
            reviewer_role=WorkCloseOutReviewerRole.supervisor,
            reviewer_id=reviewer.id,
            decision=data.decision,
            comment=data.comment,
        )
        record.status = status_after_intermediate_decision(record, data.decision)

    if data.decision in (WorkCloseOutDecision.approve, WorkCloseOutDecision.acknowledge):
        engine.approve(
            approval_request_id,
            reviewer,
            comment=data.comment or None,
        )
        mark_supervisor_review()
    elif data.decision == WorkCloseOutDecision.return_:
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
    return get_work_closeout(db, record.id), approval_request_id


def operations_head_decision(
    db: Session,
    work_closeout_id: str,
    data: WorkCloseOutDecisionCreate,
    current_user: User,
) -> tuple[SafetyWorkCloseOut, str]:
    reviewer = get_employee_for_user(db, current_user)
    record = get_work_closeout(db, work_closeout_id)

    validate_operations_head_decision(record, data, reviewer)

    approval_request_id = get_active_workflow_approval_request_id(
        db,
        record.id,
    )
    engine = WorkflowEngine(db)

    def mark_operations_head_review() -> None:
        add_closeout_review(
            db=db,
            record=record,
            reviewer_role=WorkCloseOutReviewerRole.operations_head,
            reviewer_id=reviewer.id,
            decision=data.decision,
            comment=data.comment,
        )
        record.status = status_after_intermediate_decision(record, data.decision)

    if data.decision in (WorkCloseOutDecision.approve, WorkCloseOutDecision.acknowledge):
        engine.approve(
            approval_request_id,
            reviewer,
            comment=data.comment or None,
        )
        mark_operations_head_review()
    elif data.decision == WorkCloseOutDecision.return_:
        engine.return_(
            approval_request_id,
            reviewer,
            comment=data.comment or None,
            on_returned=mark_operations_head_review,
        )
    else:
        engine.reject(
            approval_request_id,
            reviewer,
            comment=data.comment or None,
            on_rejected=mark_operations_head_review,
        )

    db.commit()
    return get_work_closeout(db, record.id), approval_request_id


def hse_decision(
    db: Session,
    work_closeout_id: str,
    data: WorkCloseOutHseReviewCreate,
    inspector: Employee,
) -> tuple[SafetyWorkCloseOut, str]:
    record = get_work_closeout(db, work_closeout_id)

    validate_hse_decision(record, data)

    approval_request_id = get_active_workflow_approval_request_id(
        db,
        record.id,
    )
    engine = WorkflowEngine(db)
    pending_verification_incident_id: Optional[str] = None

    def mark_hse_review() -> None:
        nonlocal pending_verification_incident_id
        add_closeout_review(
            db=db,
            record=record,
            reviewer_role=WorkCloseOutReviewerRole.hse,
            reviewer_id=inspector.id,
            decision=data.decision,
            comment=data.comment,
            verified_close_out=data.verified_close_out,
            area_safe_for_operations=data.area_safe_for_operations,
            corrective_action_required=data.corrective_action_required,
            corrective_action_details=data.corrective_action_details,
        )
        record.status = status_after_hse_decision(data.decision)
        if record.status == WorkCloseOutStatus.approved:
            pending_verification_incident_id = move_linked_incident_to_hse_verification(
                db,
                record,
                inspector,
            )

    if data.decision in (WorkCloseOutDecision.approve, WorkCloseOutDecision.acknowledge):
        engine.approve(
            approval_request_id,
            inspector,
            comment=data.comment or None,
            on_final_approval=mark_hse_review,
        )
    elif data.decision == WorkCloseOutDecision.return_:
        engine.return_(
            approval_request_id,
            inspector,
            comment=data.comment or None,
            on_returned=mark_hse_review,
        )
    else:
        engine.reject(
            approval_request_id,
            inspector,
            comment=data.comment or None,
            on_rejected=mark_hse_review,
        )

    if pending_verification_incident_id:
        incident_id = pending_verification_incident_id
        queue_after_commit(
            db,
            lambda fresh_db: incident_email.notify_pending_verification(
                fresh_db,
                incident_id,
            ),
            description=f"incident verification notifications for {incident_id}",
        )
    db.commit()

    return get_work_closeout(db, record.id), approval_request_id


def validate_supervisor_decision(
    record: SafetyWorkCloseOut,
    data: WorkCloseOutDecisionCreate,
    reviewer: Employee,
) -> None:
    if record.status != WorkCloseOutStatus.submitted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only submitted work close-outs can be reviewed by the supervisor.",
        )

    initiation = record.work_authorization.work_initiation
    if reviewer.id != initiation.assigned_supervisor_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the assigned supervisor can review this work close-out.",
        )

    validate_decision_for_closeout_type(record, data.decision)

    if data.decision in (WorkCloseOutDecision.return_, WorkCloseOutDecision.deny) and not data.comment:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Comment is required when returning or rejecting a work close-out.",
        )


def validate_operations_head_decision(
    record: SafetyWorkCloseOut,
    data: WorkCloseOutDecisionCreate,
    reviewer: Employee,
) -> None:
    if record.status != WorkCloseOutStatus.pending or not get_closeout_review(
        record,
        WorkCloseOutReviewerRole.supervisor,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Operations Head can only review a work close-out after supervisor review.",
        )

    require_safety_operations_approver(reviewer)

    validate_decision_for_closeout_type(record, data.decision)

    if data.decision in (WorkCloseOutDecision.return_, WorkCloseOutDecision.deny) and not data.comment:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Comment is required when returning or rejecting a work close-out.",
        )


def validate_hse_decision(
    record: SafetyWorkCloseOut,
    data: WorkCloseOutHseReviewCreate,
) -> None:
    if record.status != WorkCloseOutStatus.pending or not get_closeout_review(
        record,
        WorkCloseOutReviewerRole.operations_head,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="HSE can only review a work close-out after Operations Head review.",
        )

    validate_decision_for_closeout_type(record, data.decision)

    if data.decision in (WorkCloseOutDecision.return_, WorkCloseOutDecision.deny) and not data.comment:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Comment is required when returning or rejecting a work close-out.",
        )

    if data.decision == WorkCloseOutDecision.approve:
        if (
            not data.verified_close_out
            or not data.area_safe_for_operations
            or data.corrective_action_required
        ):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Work close-out cannot be approved unless HSE verified close-out, area is safe, and no corrective action is required.",
            )

    if data.corrective_action_required and not data.corrective_action_details:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Corrective action details are required when corrective action is required.",
        )


def validate_decision_for_closeout_type(
    record: SafetyWorkCloseOut,
    decision: WorkCloseOutDecision,
) -> None:
    is_exception = is_exception_closeout(record)

    if is_exception and decision == WorkCloseOutDecision.approve:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Close-outs with a remaining hazard or work not completed as approved cannot be approved. Acknowledge, return, or reject instead.",
        )

    if not is_exception and decision == WorkCloseOutDecision.acknowledge:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Only exception work close-outs can be acknowledged.",
        )


def status_after_intermediate_decision(
    record: SafetyWorkCloseOut,
    decision: WorkCloseOutDecision,
) -> WorkCloseOutStatus:
    if decision in (WorkCloseOutDecision.approve, WorkCloseOutDecision.acknowledge):
        return WorkCloseOutStatus.pending
    if decision == WorkCloseOutDecision.return_:
        return WorkCloseOutStatus.returned
    return WorkCloseOutStatus.denied


def status_after_hse_decision(decision: WorkCloseOutDecision) -> WorkCloseOutStatus:
    if decision == WorkCloseOutDecision.approve:
        return WorkCloseOutStatus.approved
    if decision == WorkCloseOutDecision.acknowledge:
        return WorkCloseOutStatus.acknowledged
    if decision == WorkCloseOutDecision.return_:
        return WorkCloseOutStatus.returned
    return WorkCloseOutStatus.denied


def add_closeout_review(
    db: Session,
    record: SafetyWorkCloseOut,
    reviewer_role: WorkCloseOutReviewerRole,
    reviewer_id: str,
    decision: WorkCloseOutDecision,
    comment: Optional[str] = None,
    verified_close_out: Optional[bool] = None,
    area_safe_for_operations: Optional[bool] = None,
    corrective_action_required: Optional[bool] = None,
    corrective_action_details: Optional[str] = None,
) -> SafetyCloseOutReview:
    if get_closeout_review(record, reviewer_role):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{reviewer_role.value.replace('_', ' ').title()} review already exists for this work close-out.",
        )

    review = SafetyCloseOutReview(
        work_closeout_id=record.id,
        reviewer_role=reviewer_role.value,
        reviewer_id=reviewer_id,
        decision=decision,
        comment=comment,
        verified_close_out=verified_close_out,
        area_safe_for_operations=area_safe_for_operations,
        corrective_action_required=corrective_action_required,
        corrective_action_details=corrective_action_details,
        decided_at=datetime.now(timezone.utc),
    )
    db.add(review)
    db.flush()
    return review


def get_closeout_review(
    record: SafetyWorkCloseOut,
    reviewer_role: WorkCloseOutReviewerRole,
) -> Optional[SafetyCloseOutReview]:
    return next(
        (
            review
            for review in (record.reviews or [])
            if review.reviewer_role == reviewer_role.value
        ),
        None,
    )


def is_exception_closeout(record: SafetyWorkCloseOut) -> bool:
    return (
        not record.completed_as_approved
        or record.remaining_hazard
    )


def move_linked_incident_to_hse_verification(
    db: Session,
    record: SafetyWorkCloseOut,
    actor: Employee,
) -> Optional[str]:
    authorization = record.work_authorization
    initiation = authorization.work_initiation if authorization else None
    incident_id = initiation.related_incident_report_id if initiation else None
    if not incident_id:
        return None

    incident = (
        db.query(SafetyIncidentReport)
        .filter(
            SafetyIncidentReport.id == incident_id,
            SafetyIncidentReport.is_active == True,
        )
        .first()
    )
    if not incident:
        return None
    if incident.status == IncidentReportStatus.closed:
        return None

    incident.status = IncidentReportStatus.pending_hse_verification
    incident.resolution_work_closeout_id = record.id
    db.add(
        WorkflowAuditTrail(
            id=str(uuid.uuid4()),
            workflow_id=None,
            request_id=incident.id,
            request_type="incident_report",
            actor_id=actor.id,
            actor_role=actor.job_title
            or (actor.department_rel.name if actor.department_rel else None),
            step_number=None,
            action=AuditAction.resolved,
            comment=(
                f"Corrective action completed through approved close-out "
                f"{record.reference}."
            ),
        )
    )
    return incident.id


def list_work_closeout_documents(
    db: Session,
    work_closeout_id: str,
) -> list[Document]:
    return (
        db.query(Document)
        .filter(
            Document.category == work_closeout_document_category(work_closeout_id),
            Document.type == "file",
        )
        .order_by(Document.created_at)
        .all()
    )


def delete_removed_work_closeout_documents(
    db: Session,
    work_closeout_id: str,
    retained_completion_evidence_ids: Optional[list[str]],
) -> None:
    if retained_completion_evidence_ids is None:
        return

    retained_ids = {
        int(attachment_id)
        for attachment_id in retained_completion_evidence_ids
        if str(attachment_id).isdigit()
    }
    query = db.query(Document).filter(
        Document.category == work_closeout_document_category(work_closeout_id),
        Document.type == "file",
    )
    if retained_ids:
        query = query.filter(~Document.id.in_(retained_ids))

    for document in query.all():
        db.delete(document)


def create_work_closeout_documents(
    db: Session,
    work_closeout_id: str,
    files: list[tuple[bytes, str, str, int]],
    uploaded_by: Optional[str],
) -> list[Document]:
    if not files:
        return []

    storage = get_storage_service()
    documents: list[Document] = []
    category = work_closeout_document_category(work_closeout_id)
    folder = f"safety/work-closeouts/{work_closeout_id}/completion"

    for file_bytes, filename, mime_type, file_size in files:
        result = storage.upload(
            file_bytes=file_bytes,
            filename=filename,
            folder=folder,
            resource_type=ResourceType.AUTO,
            overwrite=False,
        )
        document = Document(
            type="file",
            name=filename,
            category=category,
            file_path=result.url,
            file_size=result.file_size or file_size,
            mime_type=mime_type,
            uploaded_by=uploaded_by,
            parent_id=None,
        )
        db.add(document)
        documents.append(document)

    db.flush()
    return documents
