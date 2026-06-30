from datetime import datetime
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.employees.models import Employee
from app.safety.dependencies import get_employee_for_user
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
)
from app.safety.work_initiations.models import (
    SafetyWorkInitiation,
    SafetyWorkInitiationWorker,
    WorkInitiationStatus,
)
from app.shared.models.reference_counter import ReferenceCounter
from app.shared.models.user import User


WORK_AUTHORIZATION_REFERENCE_ENTITY = "work_authorization"
WORK_AUTHORIZATION_REFERENCE_PREFIX = "WA"
ACTIVE_WORK_AUTHORIZATION_STATUSES = (
    WorkAuthorizationStatus.draft,
    WorkAuthorizationStatus.submitted,
    WorkAuthorizationStatus.returned,
    WorkAuthorizationStatus.approved,
)


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
) -> SafetyWorkAuthorization:
    requester = get_employee_for_user(db, current_user)
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
        attachments_json=[item.model_dump() for item in data.attachments],
    )
    db.add(record)
    db.commit()

    return get_work_authorization(db, record.id)


def validate_work_authorization_create_rules(
    db: Session,
    work_initiation: SafetyWorkInitiation,
    requester: Employee,
) -> None:
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
            detail={
                "message": (
                    "A work authorization already exists for this work initiation. "
                    "Update and resubmit the existing request instead."
                ),
                "existing_work_authorization_id": existing_record.id,
                "existing_work_authorization_reference": existing_record.reference,
            },
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
            SafetyWorkAuthorization.status.in_(ACTIVE_WORK_AUTHORIZATION_STATUSES),
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
            SafetyWorkInitiation.is_active == True,
        )
        .first()
    )
    if not work_initiation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work initiation not found.",
        )
    return work_initiation


def list_work_authorizations(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    status_filter: Optional[WorkAuthorizationStatus] = None,
    search: Optional[str] = None,
) -> list[SafetyWorkAuthorization]:
    query = (
        db.query(SafetyWorkAuthorization)
        .options(
            joinedload(SafetyWorkAuthorization.requester).joinedload(Employee.user),
            joinedload(SafetyWorkAuthorization.work_initiation),
        )
        .filter(SafetyWorkAuthorization.is_active == True)
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

    return (
        query.order_by(SafetyWorkAuthorization.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
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

    return record


def create_hse_review(
    db: Session,
    work_authorization_id: str,
    data: WorkAuthorizationHseReviewCreate,
    inspector: Employee,
) -> SafetyWorkAuthorization:
    record = get_work_authorization(db, work_authorization_id)

    if record.status != WorkAuthorizationStatus.submitted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only submitted work authorizations can be reviewed by HSE.",
        )

    validate_hse_decision(data)

    record.hse_inspector_id = inspector.id
    record.work_area_safe = data.work_area_safe
    record.emergency_equipment_available = data.emergency_equipment_available
    record.gas_pressure_check_completed = data.gas_pressure_check_completed
    record.ppe_and_safety_kits_available = data.ppe_and_safety_kits_available
    record.safety_controls_in_place = data.safety_controls_in_place
    record.hse_inspection_result = data.hse_inspection_result
    record.hse_inspection_comment = data.hse_inspection_comment
    record.hse_evidence_json = [item.model_dump() for item in data.hse_evidence]
    record.hse_decision = data.decision
    record.hse_decision_comment = data.decision_comment
    record.hse_decided_at = datetime.utcnow()
    record.status = status_for_hse_decision(data.decision)

    db.commit()
    return get_work_authorization(db, record.id)


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
