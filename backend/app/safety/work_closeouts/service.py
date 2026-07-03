from datetime import datetime
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import and_, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.employees.models import Department, Employee
from app.safety.dependencies import get_employee_for_user
from app.safety.work_authorizations.models import (
    SafetyWorkAuthorization,
    WorkAuthorizationStatus,
)
from app.safety.work_closeouts.models import (
    SafetyWorkCloseOut,
    WorkCloseOutAnswer,
    WorkCloseOutDecision,
    WorkCloseOutStatus,
)
from app.safety.work_closeouts.schemas import (
    WorkCloseOutCreate,
    WorkCloseOutDecisionCreate,
    WorkCloseOutHseReviewCreate,
)
from app.safety.work_initiations.models import (
    SafetyWorkInitiation,
    SafetyWorkInitiationWorker,
)
from app.shared.models.document import Document
from app.shared.models.reference_counter import ReferenceCounter
from app.shared.models.user import User, UserRole
from app.shared.services.cloudinary_service import ResourceType, get_storage_service


WORK_CLOSEOUT_REFERENCE_ENTITY = "work_closeout"
WORK_CLOSEOUT_REFERENCE_PREFIX = "WCO"
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

    create_work_closeout_documents(
        db=db,
        work_closeout_id=record.id,
        files=completion_evidence,
        uploaded_by=requester.id,
    )

    db.commit()

    return get_work_closeout(db, record.id)


def validate_work_closeout_create_rules(
    db: Session,
    authorization: SafetyWorkAuthorization,
    requester: Employee,
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


def is_closeout_requester_allowed(
    requester: Employee,
    authorization: SafetyWorkAuthorization,
) -> bool:
    initiation = authorization.work_initiation

    if requester.id in (authorization.requester_id, initiation.requester_id, initiation.assigned_supervisor_id):
        return True

    return any(worker.worker_id == requester.id for worker in initiation.workers)


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
    skip: int = 0,
    limit: int = 20,
    cursor_created_at: Optional[datetime] = None,
    cursor_id: Optional[str] = None,
    status_filter: Optional[WorkCloseOutStatus] = None,
    search: Optional[str] = None,
) -> list[SafetyWorkCloseOut]:
    query = (
        db.query(SafetyWorkCloseOut)
        .options(
            joinedload(SafetyWorkCloseOut.requester).joinedload(Employee.user),
            joinedload(SafetyWorkCloseOut.work_authorization)
            .joinedload(SafetyWorkAuthorization.work_initiation),
        )
        .filter(SafetyWorkCloseOut.is_active == True)
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


def get_work_closeout(
    db: Session,
    work_closeout_id: str,
) -> SafetyWorkCloseOut:
    record = (
        db.query(SafetyWorkCloseOut)
        .options(
            joinedload(SafetyWorkCloseOut.requester).joinedload(Employee.user),
            joinedload(SafetyWorkCloseOut.supervisor).joinedload(Employee.user),
            joinedload(SafetyWorkCloseOut.operations_head).joinedload(Employee.user),
            joinedload(SafetyWorkCloseOut.hse_inspector).joinedload(Employee.user),
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
) -> SafetyWorkCloseOut:
    reviewer = get_employee_for_user(db, current_user)
    record = get_work_closeout(db, work_closeout_id)

    validate_supervisor_decision(record, data, reviewer)

    record.supervisor_decision = data.decision
    record.supervisor_id = reviewer.id
    record.supervisor_comment = data.comment
    record.supervisor_decided_at = datetime.utcnow()
    record.status = status_after_intermediate_decision(record, data.decision)

    db.commit()
    return get_work_closeout(db, record.id)


def operations_head_decision(
    db: Session,
    work_closeout_id: str,
    data: WorkCloseOutDecisionCreate,
    current_user: User,
) -> SafetyWorkCloseOut:
    reviewer = get_employee_for_user(db, current_user)
    record = get_work_closeout(db, work_closeout_id)

    validate_operations_head_decision(record, data, reviewer, current_user)

    record.operations_head_decision = data.decision
    record.operations_head_id = reviewer.id
    record.operations_head_comment = data.comment
    record.operations_head_decided_at = datetime.utcnow()
    record.status = status_after_intermediate_decision(record, data.decision)

    db.commit()
    return get_work_closeout(db, record.id)


def hse_decision(
    db: Session,
    work_closeout_id: str,
    data: WorkCloseOutHseReviewCreate,
    inspector: Employee,
) -> SafetyWorkCloseOut:
    record = get_work_closeout(db, work_closeout_id)

    validate_hse_decision(record, data)

    record.hse_inspector_id = inspector.id
    record.hse_verified_close_out = data.verified_close_out
    record.hse_area_safe_for_operations = data.area_safe_for_operations
    record.hse_corrective_action_required = data.corrective_action_required
    record.hse_corrective_action_details = data.corrective_action_details
    record.hse_decision = data.decision
    record.hse_comment = data.comment
    record.hse_decided_at = datetime.utcnow()
    record.status = status_after_hse_decision(data.decision)

    db.commit()
    return get_work_closeout(db, record.id)


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
            detail="Comment is required when returning or denying a work close-out.",
        )


def validate_operations_head_decision(
    record: SafetyWorkCloseOut,
    data: WorkCloseOutDecisionCreate,
    reviewer: Employee,
    current_user: User,
) -> None:
    if record.status != WorkCloseOutStatus.pending or not record.supervisor_decision:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Operations Head can only review a work close-out after supervisor review.",
        )

    if current_user.role not in (UserRole.super_admin, UserRole.admin):
        if reviewer.department != Department.operations:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only Operations department users can perform Operations Head close-out review.",
            )

    validate_decision_for_closeout_type(record, data.decision)

    if data.decision in (WorkCloseOutDecision.return_, WorkCloseOutDecision.deny) and not data.comment:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Comment is required when returning or denying a work close-out.",
        )


def validate_hse_decision(
    record: SafetyWorkCloseOut,
    data: WorkCloseOutHseReviewCreate,
) -> None:
    if record.status != WorkCloseOutStatus.pending or not record.operations_head_decision:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="HSE can only review a work close-out after Operations Head review.",
        )

    validate_decision_for_closeout_type(record, data.decision)

    if data.decision in (WorkCloseOutDecision.return_, WorkCloseOutDecision.deny) and not data.comment:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Comment is required when returning or denying a work close-out.",
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
            detail="Exception work close-outs cannot be approved. Acknowledge, return, or deny instead.",
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


def is_exception_closeout(record: SafetyWorkCloseOut) -> bool:
    return (
        not record.work_completed
        or not record.completed_as_approved
        or record.incident_observed
        or not record.monitored_during_execution
        or not record.stayed_within_scope
        or not record.ppe_and_controls_maintained
        or record.unsafe_condition_addressed == WorkCloseOutAnswer.yes
        or not record.work_area_cleaned
        or not record.tools_removed
        or not record.system_safe
        or record.remaining_hazard
    )


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
