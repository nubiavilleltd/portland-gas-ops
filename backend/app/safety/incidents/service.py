from datetime import datetime
import logging
import uuid
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import and_, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.employees.models import Employee
from app.setups.models import Department as DepartmentModel
from app.safety.dependencies import get_employee_for_user
from app.shared.models.approval import AuditAction, WorkflowAuditTrail
from app.shared.models.document import Document
from app.shared.models.reference_counter import ReferenceCounter
from app.shared.models.user import AccountStatus, User
from app.shared.services import email_service
from app.shared.services.cloudinary_service import ResourceType, get_storage_service
from app.safety.incidents.models import (
    IncidentHseDecision,
    IncidentReportStatus,
    IncidentReportType,
    SafetyIncidentHseReview,
    SafetyIncidentReport,
)
from app.safety.incidents.schemas import (
    IncidentHseVerificationCreate,
    IncidentHseReviewCreate,
    IncidentReportCreate,
    IncidentReportUpdate,
    IncidentResolveCreate,
)
from app.safety.work_authorizations.models import SafetyWorkAuthorization
from app.safety.work_closeouts.models import SafetyWorkCloseOut, WorkCloseOutStatus
from app.safety.work_initiations.models import SafetyWorkInitiation

INCIDENT_REFERENCE_ENTITY = "incident_report"
INCIDENT_REFERENCE_PREFIX = "IH"
INCIDENT_DOCUMENT_CATEGORY_PREFIX = "safety_incident"
INCIDENT_AUDIT_REQUEST_TYPE = "incident_report"

logger = logging.getLogger(__name__)


def incident_document_category(incident_id: str) -> str:
    return f"{INCIDENT_DOCUMENT_CATEGORY_PREFIX}:{incident_id}"


def actor_name(employee: Employee | None) -> str:
    if employee and employee.user:
        return employee.user.full_name or employee.user.email
    return "Safety user"


def actor_role(employee: Employee | None) -> str | None:
    if not employee:
        return None
    return employee.job_title or (
        employee.department_rel.name if employee.department_rel else None
    )


def incident_severity_label(report: SafetyIncidentReport) -> str:
    return report.severity_estimate.value.title() if report.severity_estimate else "Not specified"


def incident_url(incident_id: str) -> str:
    return email_service.get_request_url("safety", f"incidents/{incident_id}")


def add_incident_audit_event(
    db: Session,
    report: SafetyIncidentReport,
    actor: Employee,
    action: AuditAction,
    comment: str | None = None,
) -> None:
    db.add(
        WorkflowAuditTrail(
            id=str(uuid.uuid4()),
            workflow_id=None,
            request_id=report.id,
            request_type=INCIDENT_AUDIT_REQUEST_TYPE,
            actor_id=actor.id,
            actor_role=actor_role(actor),
            step_number=None,
            action=action,
            comment=comment,
        )
    )


def get_primary_hse_inspector(db: Session) -> Employee | None:
    query = (
        db.query(Employee)
        .join(User, User.id == Employee.user_id)
        .join(DepartmentModel, Employee.department_id == DepartmentModel.id)
        .filter(
            DepartmentModel.code == "safety",
            User.account_status == AccountStatus.active,
        )
    )

    inspector = (
        query.filter(Employee.job_title == "HSE Inspector")
        .order_by(Employee.created_at.asc())
        .first()
    )
    return inspector or query.order_by(Employee.created_at.asc()).first()


def send_incident_submitted_email(
    db: Session,
    report: SafetyIncidentReport,
    reporter: Employee,
) -> None:
    inspector = get_primary_hse_inspector(db)
    if not inspector or not inspector.user or not inspector.user.email:
        return

    try:
        email_service.send_incident_notification(
            to_email=inspector.user.email,
            recipient_name=actor_name(inspector),
            subject=f"Incident/Hazard Report Submitted - {report.reference}",
            heading="New Incident/Hazard Report Submitted",
            message=(
                f"{actor_name(reporter)} submitted an incident/hazard report "
                "that needs HSE review."
            ),
            incident_reference=report.reference,
            incident_title=report.title,
            severity=incident_severity_label(report),
            location=report.location,
            details=report.description,
            action_label="Review Incident",
            action_url=incident_url(report.id),
        )
    except Exception:
        logger.exception("Incident submitted email failed for %s", report.id)


def send_incident_recommendation_email(review: SafetyIncidentHseReview) -> None:
    owner = review.action_owner
    report = review.incident_report
    if not owner or not owner.user or not owner.user.email or not report:
        return

    try:
        email_service.send_incident_notification(
            to_email=owner.user.email,
            recipient_name=actor_name(owner),
            subject=f"Corrective Action Assigned - {report.reference}",
            heading="Corrective Action Recommended",
            message=(
                "HSE has recommended corrective action and assigned this "
                "incident/hazard report to you."
            ),
            incident_reference=report.reference,
            incident_title=report.title,
            severity=incident_severity_label(report),
            location=report.location,
            details=review.corrective_action_details,
            action_label="View Corrective Action",
            action_url=incident_url(report.id),
        )
    except Exception:
        logger.exception("Incident recommendation email failed for %s", report.id)


def send_incident_resolved_emails(report: SafetyIncidentReport) -> None:
    recipients: list[Employee] = []
    if report.reporter:
        recipients.append(report.reporter)
    if report.hse_review and report.hse_review.inspector:
        recipients.append(report.hse_review.inspector)
    if report.hse_review and report.hse_review.action_owner:
        recipients.append(report.hse_review.action_owner)

    sent_to: set[str] = set()
    for recipient in recipients:
        if not recipient.user or not recipient.user.email:
            continue
        email = recipient.user.email
        if email in sent_to:
            continue
        sent_to.add(email)

        try:
            email_service.send_incident_notification(
                to_email=email,
                recipient_name=actor_name(recipient),
                subject=f"Incident/Hazard Resolved - {report.reference}",
                heading="Incident/Hazard Marked Resolved",
                message=(
                    "This incident/hazard report has been marked resolved. "
                    "Open the record to review the resolution details and audit trail."
                ),
                incident_reference=report.reference,
                incident_title=report.title,
                severity=incident_severity_label(report),
                location=report.location,
                details=(
                    report.hse_review.comment
                    if report.hse_review and report.hse_review.comment
                    else "The incident/hazard report has been marked resolved."
                ),
                action_label="View Incident",
                action_url=incident_url(report.id),
            )
        except Exception:
            logger.exception(
                "Incident resolved email failed for %s to %s",
                report.id,
                email,
            )


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
    attachments: Optional[list[tuple[bytes, str, str, int]]] = None,
) -> SafetyIncidentReport:
    employee = get_employee_for_user(db, current_user)
    attachments = attachments or []

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
    db.flush()

    create_incident_documents(
        db=db,
        incident_id=report.id,
        files=attachments,
        uploaded_by=employee.id,
    )
    add_incident_audit_event(
        db=db,
        report=report,
        actor=employee,
        action=AuditAction.submitted,
        comment="Incident/hazard report submitted for HSE review.",
    )

    db.commit()
    db.refresh(report)
    send_incident_submitted_email(db, report, employee)

    return get_incident_report(db, report.id)


def is_hse_employee(employee: Employee) -> bool:
    return bool(employee.department_rel and employee.department_rel.code == "safety")


def can_employee_view_incident(
    report: SafetyIncidentReport,
    employee: Employee,
) -> bool:
    if is_hse_employee(employee):
        return True

    if report.reported_by == employee.id:
        return True

    return bool(
        report.hse_review
        and report.hse_review.action_owner_id == employee.id
        and report.status
        in (
            IncidentReportStatus.recommended,
            IncidentReportStatus.pending_hse_verification,
            IncidentReportStatus.resolved,
            IncidentReportStatus.closed,
        )
    )


def require_incident_view_access(
    report: SafetyIncidentReport,
    employee: Employee,
) -> None:
    if can_employee_view_incident(report, employee):
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have access to this incident report.",
    )


def require_incident_reporter_edit_access(
    report: SafetyIncidentReport,
    employee: Employee,
) -> None:
    if report.reported_by != employee.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the reporter can edit this incident report.",
        )

    if report.status != IncidentReportStatus.submitted or report.hse_review:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incident reports can only be edited before HSE review.",
        )


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

    if data.corrective_action_required:
        if not data.corrective_action_details:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Corrective action details are required.",
            )
        if not data.assigned_department:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Assigned department is required for corrective action.",
            )
        if not data.action_owner_id:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Action owner is required for corrective action.",
            )
        if not data.target_completion_date:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Target completion date is required for corrective action.",
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
        if (
            data.assigned_department
            and (
                not action_owner.department_rel
                or action_owner.department_rel.name != data.assigned_department
            )
        ):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Action owner must belong to the assigned department.",
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
    add_incident_audit_event(
        db=db,
        report=report,
        actor=inspector,
        action=audit_action_for_hse_decision(data.decision),
        comment=data.comment or data.findings,
    )
    db.commit()
    db.refresh(review)

    saved_review = get_hse_review(db, review.id)
    if data.decision == IncidentHseDecision.recommended:
        send_incident_recommendation_email(saved_review)
    elif data.decision == IncidentHseDecision.resolved:
        send_incident_resolved_emails(get_incident_report(db, report.id))

    return saved_review


def incident_status_for_hse_decision(
    decision: IncidentHseDecision,
) -> IncidentReportStatus:
    if decision == IncidentHseDecision.recommended:
        return IncidentReportStatus.recommended
    if decision == IncidentHseDecision.resolved:
        return IncidentReportStatus.resolved
    return IncidentReportStatus.not_resolved


def audit_action_for_hse_decision(decision: IncidentHseDecision) -> AuditAction:
    if decision == IncidentHseDecision.recommended:
        return AuditAction.recommended
    if decision == IncidentHseDecision.resolved:
        return AuditAction.resolved
    return AuditAction.not_resolved


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
    current_user: User,
    skip: int = 0,
    limit: int = 20,
    cursor_reported_at: Optional[datetime] = None,
    cursor_id: Optional[str] = None,
    status_filter: Optional[IncidentReportStatus] = None,
    report_type: Optional[IncidentReportType] = None,
    search: Optional[str] = None,
) -> list[SafetyIncidentReport]:
    employee = get_employee_for_user(db, current_user)
    query = (
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
        .filter(SafetyIncidentReport.is_active == True)
    )

    if not is_hse_employee(employee):
        query = query.outerjoin(
            SafetyIncidentHseReview,
            SafetyIncidentHseReview.incident_report_id == SafetyIncidentReport.id,
        ).filter(
            or_(
                SafetyIncidentReport.reported_by == employee.id,
                and_(
                    SafetyIncidentHseReview.action_owner_id == employee.id,
                    SafetyIncidentReport.status.in_(
                        (
                            IncidentReportStatus.recommended,
                            IncidentReportStatus.pending_hse_verification,
                            IncidentReportStatus.resolved,
                            IncidentReportStatus.closed,
                        )
                    ),
                ),
            )
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

    if cursor_reported_at and cursor_id:
        query = query.filter(
            or_(
                SafetyIncidentReport.reported_at < cursor_reported_at,
                and_(
                    SafetyIncidentReport.reported_at == cursor_reported_at,
                    SafetyIncidentReport.id < cursor_id,
                ),
            )
        )

    query = query.order_by(
        SafetyIncidentReport.reported_at.desc(),
        SafetyIncidentReport.id.desc(),
    )

    if skip > 0:
        query = query.offset(skip)

    return query.limit(limit).all()


def get_incident_report(
    db: Session,
    incident_id: str,
    current_user: Optional[User] = None,
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

    if current_user is not None:
        employee = get_employee_for_user(db, current_user)
        require_incident_view_access(report, employee)

    report.attachments = list_incident_documents(db, report.id)

    return report


def list_incident_documents(db: Session, incident_id: str) -> list[Document]:
    return (
        db.query(Document)
        .filter(
            Document.category == incident_document_category(incident_id),
            Document.type == "file",
        )
        .order_by(Document.created_at)
        .all()
    )


def create_incident_documents(
    db: Session,
    incident_id: str,
    files: list[tuple[bytes, str, str, int]],
    uploaded_by: Optional[str],
) -> list[Document]:
    if not files:
        return []

    storage = get_storage_service()
    documents: list[Document] = []
    category = incident_document_category(incident_id)

    for file_bytes, filename, mime_type, file_size in files:
        result = storage.upload(
            file_bytes=file_bytes,
            filename=filename,
            folder=f"safety/incidents/{incident_id}",
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


def update_incident_report(
    db: Session,
    incident_id: str,
    data: IncidentReportUpdate,
    current_user: User,
) -> SafetyIncidentReport:
    report = get_incident_report(db, incident_id)
    employee = get_employee_for_user(db, current_user)
    require_incident_reporter_edit_access(report, employee)

    update_data = data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(report, field, value)

    db.commit()
    db.refresh(report)

    return get_incident_report(db, report.id)


def resolve_incident_with_closeout(
    db: Session,
    incident_id: str,
    data: IncidentResolveCreate,
    current_user: User,
) -> SafetyIncidentReport:
    get_incident_report(db, incident_id)
    get_employee_for_user(db, current_user)
    _ = data

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=(
            "Incident corrective action is resolved through approved work "
            "close-out and final HSE verification."
        ),
    )


def close_resolved_incident(
    db: Session,
    incident_id: str,
    data: IncidentHseVerificationCreate,
    inspector: Employee,
) -> SafetyIncidentReport:
    report = get_incident_report(db, incident_id)

    if report.status != IncidentReportStatus.pending_hse_verification:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only incident reports pending HSE verification can be closed.",
        )

    if not report.hse_review or not report.hse_review.corrective_action_required:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only corrective-action incident reports can use HSE verification.",
        )

    report.hse_review.inspector_id = inspector.id
    report.hse_review.comment = data.notes
    report.hse_review.decision = IncidentHseDecision.resolved
    report.status = IncidentReportStatus.closed
    add_incident_audit_event(
        db=db,
        report=report,
        actor=inspector,
        action=AuditAction.closed,
        comment=data.notes,
    )
    db.commit()
    db.refresh(report)

    return get_incident_report(db, report.id)


def mark_incident_not_resolved_after_verification(
    db: Session,
    incident_id: str,
    data: IncidentHseVerificationCreate,
    inspector: Employee,
) -> SafetyIncidentReport:
    report = get_incident_report(db, incident_id)

    if report.status != IncidentReportStatus.pending_hse_verification:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only incident reports pending HSE verification can be marked not resolved.",
        )

    if not report.hse_review or not report.hse_review.corrective_action_required:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only corrective-action incident reports can use HSE verification.",
        )

    report.hse_review.inspector_id = inspector.id
    report.hse_review.comment = data.notes
    report.hse_review.decision = IncidentHseDecision.not_resolved
    report.status = IncidentReportStatus.not_resolved
    add_incident_audit_event(
        db=db,
        report=report,
        actor=inspector,
        action=AuditAction.not_resolved,
        comment=data.notes,
    )
    db.commit()
    db.refresh(report)

    return get_incident_report(db, report.id)


def get_closeout_for_incident_resolution(
    db: Session,
    work_closeout_id: str,
    incident_id: str,
) -> SafetyWorkCloseOut:
    closeout = (
        db.query(SafetyWorkCloseOut)
        .join(SafetyWorkCloseOut.work_authorization)
        .join(SafetyWorkAuthorization.work_initiation)
        .filter(
            SafetyWorkCloseOut.id == work_closeout_id,
            SafetyWorkCloseOut.is_active == True,
            SafetyWorkCloseOut.status.in_(
                (WorkCloseOutStatus.approved, WorkCloseOutStatus.acknowledged),
            ),
            SafetyWorkInitiation.related_incident_report_id == incident_id,
        )
        .first()
    )

    if not closeout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Approved close-out linked to this incident report was not found.",
        )

    return closeout


def deactivate_incident_report(
    db: Session,
    incident_id: str,
    current_user: User,
) -> None:
    report = get_incident_report(db, incident_id)
    employee = get_employee_for_user(db, current_user)
    if not is_hse_employee(employee):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only HSE can deactivate incident reports.",
        )

    report.is_active = False

    db.commit()
