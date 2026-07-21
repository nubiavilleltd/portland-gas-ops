from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import and_, exists, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.employees.models import Employee
from app.safety.dependencies import get_employee_for_user
from app.safety.permissions import is_safety_hse_employee
from app.safety.work_authorizations.models import (
    SafetyWorkAuthorization,
    WorkAuthorizationDecision,
    WorkAuthorizationInspectionCheck,
    WorkAuthorizationInspectionResult,
    WorkAuthorizationStatus,
)
from app.safety.work_authorizations.schemas import (
    WorkAuthorizationCreate,
    WorkAuthorizationHseReviewCreate,
    WorkAuthorizationUpdate,
)
from app.safety.work_initiations.models import (
    SafetyWorkInitiation,
    SafetyWorkInitiationWorker,
    WorkInitiationStatus,
)
from app.shared.models.approval import (
    AllRequest,
    ApprovalOverallStatus,
    ApprovalRequest,
    ApprovalStepAssignment,
)
from app.shared.models.reference_counter import ReferenceCounter
from app.shared.models.user import User
from app.shared.models.document import Document
from app.shared.services.cloudinary_service import ResourceType, get_storage_service
from app.shared.services.workflow_engine import WorkflowEngine


WORK_AUTHORIZATION_REFERENCE_ENTITY = "work_authorization"
WORK_AUTHORIZATION_REFERENCE_PREFIX = "WA"
WORK_AUTHORIZATION_REQUEST_TYPE = "work_authorization"
WORK_AUTHORIZATION_DOCUMENT_CATEGORY_PREFIX = "safety_work_authorization"
WORK_AUTHORIZATION_HSE_DOCUMENT_CATEGORY_PREFIX = "safety_work_authorization_hse"


def work_authorization_document_category(work_authorization_id: str) -> str:
    return f"{WORK_AUTHORIZATION_DOCUMENT_CATEGORY_PREFIX}:{work_authorization_id}"


def work_authorization_hse_document_category(work_authorization_id: str) -> str:
    return f"{WORK_AUTHORIZATION_HSE_DOCUMENT_CATEGORY_PREFIX}:{work_authorization_id}"


def get_active_workflow_approval_request_id(
    db: Session,
    work_authorization_id: str,
) -> str:
    row = (
        db.query(AllRequest.approval_request_id)
        .join(
            ApprovalRequest,
            ApprovalRequest.id == AllRequest.approval_request_id,
        )
        .filter(
            AllRequest.request_type == WORK_AUTHORIZATION_REQUEST_TYPE,
            AllRequest.request_id == work_authorization_id,
            ApprovalRequest.overall_status == ApprovalOverallStatus.pending,
        )
        .first()
    )

    if not row:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No active workflow approval request found for this work authorization.",
        )

    return row.approval_request_id


def reserve_work_authorization_reference(db: Session) -> str:
    year = datetime.utcnow().year
    counter = (
        db.query(ReferenceCounter)
        .filter(
            ReferenceCounter.entity_type == WORK_AUTHORIZATION_REFERENCE_ENTITY,
            ReferenceCounter.year == year,
        )
        .with_for_update()
        .first()
    )

    if counter is None:
        counter = ReferenceCounter(
            entity_type=WORK_AUTHORIZATION_REFERENCE_ENTITY,
            year=year,
            next_number=next_work_authorization_number_from_existing_records(db, year),
        )
        db.add(counter)
        try:
            db.flush()
        except IntegrityError:
            db.rollback()
            return reserve_work_authorization_reference(db)

    number = counter.next_number
    counter.next_number += 1
    db.flush()

    return f"{WORK_AUTHORIZATION_REFERENCE_PREFIX}-{year}-{number:04d}"


def next_work_authorization_number_from_existing_records(db: Session, year: int) -> int:
    prefix = f"{WORK_AUTHORIZATION_REFERENCE_PREFIX}-{year}-"
    references = (
        db.query(SafetyWorkAuthorization.reference)
        .filter(SafetyWorkAuthorization.reference.like(f"{prefix}%"))
        .all()
    )
    highest = 0
    for (reference,) in references:
        suffix = reference.removeprefix(prefix)
        if suffix.isdigit():
            highest = max(highest, int(suffix))
    return highest + 1


def create_work_authorization(
    db: Session,
    data: WorkAuthorizationCreate,
    current_user: User,
    attachments: Optional[list[tuple[bytes, str, str, int]]] = None,
) -> SafetyWorkAuthorization:
    requester = get_employee_for_user(db, current_user)
    attachments = attachments or []
    work_initiation = get_work_initiation_for_authorization(
        db,
        data.work_initiation_id,
    )
    validate_work_authorization_create_rules(db, work_initiation, requester)

    record = SafetyWorkAuthorization(
        reference=reserve_work_authorization_reference(db),
        status=WorkAuthorizationStatus.submitted,
        requester_id=requester.id,
        work_initiation_id=work_initiation.id,
        gas_involved=data.gas_involved,
        pressurized_system=data.pressurized_system,
        heat_or_sparks=data.heat_or_sparks,
        electrical_isolation=data.electrical_isolation,
        lifting_equipment=data.lifting_equipment,
        ppe_available=data.ppe_available,
        additional_safety_note=data.additional_safety_note,
        attachment_notes=data.attachment_notes,
        attachments_json=[],
    )
    db.add(record)
    db.flush()

    create_work_authorization_documents(
        db=db,
        work_authorization_id=record.id,
        files=attachments,
        uploaded_by=requester.id,
        hse_evidence=False,
    )
    start_work_authorization_workflow(
        db=db,
        record=record,
        requester=requester,
    )

    db.commit()

    return get_work_authorization(db, record.id)


def update_work_authorization(
    db: Session,
    work_authorization_id: str,
    data: WorkAuthorizationUpdate,
    current_user: User,
    attachments: Optional[list[tuple[bytes, str, str, int]]] = None,
) -> SafetyWorkAuthorization:
    record = get_work_authorization(db, work_authorization_id)
    requester = get_employee_for_user(db, current_user)
    attachments = attachments or []

    if record.requester_id != requester.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the requester can update this work authorization.",
        )

    if record.status not in (WorkAuthorizationStatus.draft, WorkAuthorizationStatus.returned):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft or returned work authorizations can be updated.",
        )

    record.status = WorkAuthorizationStatus.submitted
    record.gas_involved = data.gas_involved
    record.pressurized_system = data.pressurized_system
    record.heat_or_sparks = data.heat_or_sparks
    record.electrical_isolation = data.electrical_isolation
    record.lifting_equipment = data.lifting_equipment
    record.ppe_available = data.ppe_available
    record.additional_safety_note = data.additional_safety_note
    record.attachment_notes = data.attachment_notes
    record.attachments_json = data.attachments or []

    clear_hse_review(record)
    delete_removed_work_authorization_documents(
        db=db,
        work_authorization_id=record.id,
        retained_attachment_ids=data.retained_attachment_ids,
        hse_evidence=False,
    )

    create_work_authorization_documents(
        db=db,
        work_authorization_id=record.id,
        files=attachments,
        uploaded_by=requester.id,
        hse_evidence=False,
    )
    start_work_authorization_workflow(
        db=db,
        record=record,
        requester=requester,
    )

    db.commit()
    return get_work_authorization(db, record.id)


def start_work_authorization_workflow(
    db: Session,
    record: SafetyWorkAuthorization,
    requester: Employee,
) -> None:
    engine = WorkflowEngine(db)
    engine.start(
        request_type=WORK_AUTHORIZATION_REQUEST_TYPE,
        request_id=record.id,
        title=f"{record.reference} — {record.work_initiation.title}",
        requester=requester,
    )


def clear_hse_review(record: SafetyWorkAuthorization) -> None:
    record.hse_inspector_id = None
    record.work_area_safe = None
    record.emergency_equipment_available = None
    record.gas_pressure_check_completed = None
    record.ppe_and_safety_kits_available = None
    record.safety_controls_in_place = None
    record.hse_inspection_result = None
    record.hse_inspection_comment = None
    record.hse_evidence_json = []
    record.hse_decision = None
    record.hse_decision_comment = None
    record.hse_decided_at = None


def validate_work_authorization_create_rules(
    db: Session,
    work_initiation: SafetyWorkInitiation,
    requester: Employee,
) -> None:
    if not work_initiation.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only active work initiations can be authorized.",
        )

    if work_initiation.status != WorkInitiationStatus.approved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Work authorization can only be created from an approved work initiation.",
        )

    if not is_work_authorization_requester_allowed(requester, work_initiation):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the work initiation requester, assigned supervisor, or assigned workers can request work authorization.",
        )

    existing_record = get_existing_active_authorization_for_work_initiation(
        db,
        work_initiation.id,
    )
    if existing_record:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A work authorization already exists for this work initiation.",
        )


def is_work_authorization_requester_allowed(
    requester: Employee,
    work_initiation: SafetyWorkInitiation,
) -> bool:
    if requester.id in (work_initiation.requester_id, work_initiation.assigned_supervisor_id):
        return True
    return any(worker.worker_id == requester.id for worker in work_initiation.workers)


def get_existing_active_authorization_for_work_initiation(
    db: Session,
    work_initiation_id: str,
) -> Optional[SafetyWorkAuthorization]:
    return (
        db.query(SafetyWorkAuthorization)
        .filter(
            SafetyWorkAuthorization.work_initiation_id == work_initiation_id,
            SafetyWorkAuthorization.is_active == True,
        )
        .order_by(SafetyWorkAuthorization.created_at.desc())
        .first()
    )


def get_work_initiation_for_authorization(
    db: Session,
    work_initiation_id: str,
) -> SafetyWorkInitiation:
    work_initiation = (
        db.query(SafetyWorkInitiation)
        .options(
            joinedload(SafetyWorkInitiation.requester).joinedload(Employee.user),
            joinedload(SafetyWorkInitiation.assigned_supervisor).joinedload(Employee.user),
            joinedload(SafetyWorkInitiation.workers)
            .joinedload(SafetyWorkInitiationWorker.worker)
            .joinedload(Employee.user),
        )
        .filter(
            SafetyWorkInitiation.id == work_initiation_id,
        )
        .first()
    )
    if not work_initiation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work initiation not found.",
        )
    return work_initiation


def list_eligible_work_initiations_for_authorization(
    db: Session,
    current_user: User,
) -> list[SafetyWorkInitiation]:
    requester = get_employee_for_user(db, current_user)
    active_authorization_exists = exists().where(
        SafetyWorkAuthorization.work_initiation_id == SafetyWorkInitiation.id,
        SafetyWorkAuthorization.is_active == True,
    )

    return (
        db.query(SafetyWorkInitiation)
        .options(
            joinedload(SafetyWorkInitiation.requester).joinedload(Employee.user),
            joinedload(SafetyWorkInitiation.assigned_supervisor).joinedload(Employee.user),
            joinedload(SafetyWorkInitiation.workers)
            .joinedload(SafetyWorkInitiationWorker.worker)
            .joinedload(Employee.user),
            joinedload(SafetyWorkInitiation.supervisor).joinedload(Employee.user),
            joinedload(SafetyWorkInitiation.operations_hod).joinedload(Employee.user),
        )
        .filter(
            SafetyWorkInitiation.is_active == True,
            SafetyWorkInitiation.status == WorkInitiationStatus.approved,
            ~active_authorization_exists,
            or_(
                SafetyWorkInitiation.requester_id == requester.id,
                SafetyWorkInitiation.assigned_supervisor_id == requester.id,
                SafetyWorkInitiation.workers.any(
                    SafetyWorkInitiationWorker.worker_id == requester.id,
                ),
            ),
        )
        .order_by(
            SafetyWorkInitiation.created_at.desc(),
            SafetyWorkInitiation.id.desc(),
        )
        .all()
    )


def list_work_authorizations(
    db: Session,
    current_user: User,
    skip: int = 0,
    limit: int = 20,
    cursor_created_at: Optional[datetime] = None,
    cursor_id: Optional[str] = None,
    status_filter: Optional[WorkAuthorizationStatus] = None,
    search: Optional[str] = None,
) -> list[SafetyWorkAuthorization]:
    employee = get_employee_for_user(db, current_user)
    current_approval_exists = exists().where(
        ApprovalRequest.request_type == WORK_AUTHORIZATION_REQUEST_TYPE,
        ApprovalRequest.request_id == SafetyWorkAuthorization.id,
        ApprovalRequest.overall_status == ApprovalOverallStatus.pending,
        ApprovalStepAssignment.approval_request_id == ApprovalRequest.id,
        ApprovalStepAssignment.step_number == ApprovalRequest.current_step_number,
        ApprovalStepAssignment.assigned_to == employee.id,
    )

    query = (
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
        .filter(SafetyWorkAuthorization.is_active == True)
    )

    if not is_safety_hse_employee(employee):
        query = query.filter(
            or_(
                SafetyWorkAuthorization.requester_id == employee.id,
                SafetyWorkAuthorization.work_initiation.has(
                    or_(
                        SafetyWorkInitiation.assigned_supervisor_id == employee.id,
                        SafetyWorkInitiation.workers.any(
                            SafetyWorkInitiationWorker.worker_id == employee.id,
                        ),
                    ),
                ),
                current_approval_exists,
            )
        )

    if status_filter:
        query = query.filter(SafetyWorkAuthorization.status == status_filter)

    if search:
        search_value = f"%{search}%"
        query = query.join(SafetyWorkAuthorization.work_initiation).filter(
            SafetyWorkAuthorization.reference.ilike(search_value)
            | SafetyWorkInitiation.reference.ilike(search_value)
            | SafetyWorkInitiation.title.ilike(search_value)
            | SafetyWorkInitiation.location.ilike(search_value)
        )

    if cursor_created_at and cursor_id:
        query = query.filter(
            or_(
                SafetyWorkAuthorization.created_at < cursor_created_at,
                and_(
                    SafetyWorkAuthorization.created_at == cursor_created_at,
                    SafetyWorkAuthorization.id < cursor_id,
                ),
            )
        )

    query = query.order_by(
        SafetyWorkAuthorization.created_at.desc(),
        SafetyWorkAuthorization.id.desc(),
    )

    if skip > 0:
        query = query.offset(skip)

    return query.limit(limit).all()


def get_work_authorization_for_current_user(
    db: Session,
    work_authorization_id: str,
    current_user: User,
) -> SafetyWorkAuthorization:
    record = get_work_authorization(db, work_authorization_id)
    employee = get_employee_for_user(db, current_user)

    if not can_view_work_authorization(db, record, employee):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this work authorization.",
        )

    return record


def can_view_work_authorization(
    db: Session,
    record: SafetyWorkAuthorization,
    employee: Employee,
) -> bool:
    if is_safety_hse_employee(employee):
        return True
    if record.requester_id == employee.id:
        return True

    initiation = record.work_initiation
    if initiation:
        if initiation.assigned_supervisor_id == employee.id:
            return True
        if any(worker.worker_id == employee.id for worker in initiation.workers):
            return True

    return is_current_work_authorization_approver(db, record.id, employee.id)


def is_current_work_authorization_approver(
    db: Session,
    work_authorization_id: str,
    employee_id: str,
) -> bool:
    return (
        db.query(ApprovalStepAssignment.id)
        .join(
            ApprovalRequest,
            ApprovalRequest.id == ApprovalStepAssignment.approval_request_id,
        )
        .filter(
            ApprovalRequest.request_type == WORK_AUTHORIZATION_REQUEST_TYPE,
            ApprovalRequest.request_id == work_authorization_id,
            ApprovalRequest.overall_status == ApprovalOverallStatus.pending,
            ApprovalStepAssignment.step_number == ApprovalRequest.current_step_number,
            ApprovalStepAssignment.assigned_to == employee_id,
        )
        .first()
        is not None
    )


def get_work_authorization(
    db: Session,
    work_authorization_id: str,
) -> SafetyWorkAuthorization:
    record = (
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

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work authorization not found.",
        )

    record.attachments = list_work_authorization_documents(
        db,
        record.id,
        hse_evidence=False,
    )
    record.hse_evidence = list_work_authorization_documents(
        db,
        record.id,
        hse_evidence=True,
    )

    return record


def list_work_authorization_documents(
    db: Session,
    work_authorization_id: str,
    hse_evidence: bool,
) -> list[Document]:
    category = (
        work_authorization_hse_document_category(work_authorization_id)
        if hse_evidence
        else work_authorization_document_category(work_authorization_id)
    )
    return (
        db.query(Document)
        .filter(
            Document.category == category,
            Document.type == "file",
        )
        .order_by(Document.created_at)
        .all()
    )


def delete_removed_work_authorization_documents(
    db: Session,
    work_authorization_id: str,
    retained_attachment_ids: Optional[list[str]],
    hse_evidence: bool,
) -> None:
    if retained_attachment_ids is None:
        return

    retained_ids = {
        int(attachment_id)
        for attachment_id in retained_attachment_ids
        if str(attachment_id).isdigit()
    }
    category = (
        work_authorization_hse_document_category(work_authorization_id)
        if hse_evidence
        else work_authorization_document_category(work_authorization_id)
    )
    query = db.query(Document).filter(
        Document.category == category,
        Document.type == "file",
    )

    if retained_ids:
        query = query.filter(~Document.id.in_(retained_ids))

    for document in query.all():
        db.delete(document)


def create_work_authorization_documents(
    db: Session,
    work_authorization_id: str,
    files: list[tuple[bytes, str, str, int]],
    uploaded_by: Optional[str],
    hse_evidence: bool,
) -> list[Document]:
    if not files:
        return []

    storage = get_storage_service()
    documents: list[Document] = []
    category = (
        work_authorization_hse_document_category(work_authorization_id)
        if hse_evidence
        else work_authorization_document_category(work_authorization_id)
    )
    folder = (
        f"safety/work-authorizations/{work_authorization_id}/hse"
        if hse_evidence
        else f"safety/work-authorizations/{work_authorization_id}/requester"
    )

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


def create_hse_review(
    db: Session,
    work_authorization_id: str,
    data: WorkAuthorizationHseReviewCreate,
    inspector: Employee,
    hse_evidence: Optional[list[tuple[bytes, str, str, int]]] = None,
) -> tuple[SafetyWorkAuthorization, str]:
    record = get_work_authorization(db, work_authorization_id)
    hse_evidence = hse_evidence or []

    if record.status != WorkAuthorizationStatus.submitted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only submitted work authorizations can be reviewed by HSE.",
        )

    validate_hse_decision(data)

    approval_request_id = get_active_workflow_approval_request_id(
        db,
        record.id,
    )

    engine = WorkflowEngine(db)

    def mark_hse_review() -> None:
        record.hse_inspector_id = inspector.id
        record.work_area_safe = data.work_area_safe
        record.emergency_equipment_available = data.emergency_equipment_available
        record.gas_pressure_check_completed = data.gas_pressure_check_completed
        record.ppe_and_safety_kits_available = data.ppe_and_safety_kits_available
        record.safety_controls_in_place = data.safety_controls_in_place
        record.hse_inspection_result = data.hse_inspection_result
        record.hse_inspection_comment = data.hse_inspection_comment
        record.hse_evidence_json = []
        record.hse_decision = data.decision
        record.hse_decision_comment = data.decision_comment
        record.hse_decided_at = datetime.now(timezone.utc)
        record.status = status_for_hse_decision(data.decision)

    if data.decision == WorkAuthorizationDecision.approve:
        engine.approve(
            approval_request_id,
            inspector,
            comment=data.decision_comment or None,
            on_final_approval=mark_hse_review,
        )
    elif data.decision == WorkAuthorizationDecision.return_:
        engine.return_(
            approval_request_id,
            inspector,
            comment=data.decision_comment or None,
            on_returned=mark_hse_review,
        )
    else:
        engine.reject(
            approval_request_id,
            inspector,
            comment=data.decision_comment or None,
            on_rejected=mark_hse_review,
        )

    create_work_authorization_documents(
        db=db,
        work_authorization_id=record.id,
        files=hse_evidence,
        uploaded_by=inspector.id,
        hse_evidence=True,
    )

    db.commit()
    return get_work_authorization(db, record.id), approval_request_id


def validate_hse_decision(data: WorkAuthorizationHseReviewCreate) -> None:
    failed_checks = {
        WorkAuthorizationInspectionCheck.fail,
    }
    has_failed_check = any(
        check in failed_checks
        for check in (
            data.work_area_safe,
            data.emergency_equipment_available,
            data.gas_pressure_check_completed,
            data.ppe_and_safety_kits_available,
            data.safety_controls_in_place,
        )
    )
    has_incomplete_check = any(
        check == WorkAuthorizationInspectionCheck.not_applicable
        for check in (
            data.work_area_safe,
            data.emergency_equipment_available,
            data.gas_pressure_check_completed,
            data.ppe_and_safety_kits_available,
            data.safety_controls_in_place,
        )
    )

    if has_incomplete_check:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Complete all HSE inspection checks before submitting a decision.",
        )

    if data.hse_inspection_result == WorkAuthorizationInspectionResult.returned:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="HSE inspection result must be passed or failed. Use the return decision to send the request back.",
        )

    if (
        data.hse_inspection_result == WorkAuthorizationInspectionResult.failed
        and not data.hse_inspection_comment
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="HSE inspection comment is required when the inspection result is failed.",
        )

    if data.decision == WorkAuthorizationDecision.approve:
        if has_failed_check or data.hse_inspection_result != WorkAuthorizationInspectionResult.passed:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Work authorization cannot be approved with failed HSE checks.",
            )

    if data.decision in (WorkAuthorizationDecision.return_, WorkAuthorizationDecision.deny):
        if not data.decision_comment:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="HSE comment is required when returning or denying work authorization.",
            )


def status_for_hse_decision(
    decision: WorkAuthorizationDecision,
) -> WorkAuthorizationStatus:
    if decision == WorkAuthorizationDecision.approve:
        return WorkAuthorizationStatus.approved
    if decision == WorkAuthorizationDecision.return_:
        return WorkAuthorizationStatus.returned
    return WorkAuthorizationStatus.denied
