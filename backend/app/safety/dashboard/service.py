from collections import Counter
from typing import Optional

from sqlalchemy.orm import Session, joinedload

from app.employees.models import Employee
from app.safety.incidents.models import (
    IncidentReportStatus,
    SafetyIncidentReport,
)
from app.safety.work_authorizations.models import (
    SafetyWorkAuthorization,
    WorkAuthorizationDecision,
    WorkAuthorizationInspectionCheck,
    WorkAuthorizationInspectionResult,
    WorkAuthorizationStatus,
)
from app.safety.work_closeouts.models import (
    SafetyCloseOutReview,
    SafetyWorkCloseOut,
    WorkCloseOutDecision,
    WorkCloseOutReviewerRole,
    WorkCloseOutStatus,
)
from app.safety.work_initiations.models import (
    SafetyWorkInitiation,
    SafetyWorkInitiationWorker,
    WorkInitiationStatus,
)
from app.safety.dashboard.schemas import (
    SafetyDashboardAttention,
    SafetyDashboardMetrics,
    SafetyDashboardOngoingWorkItem,
    SafetyDashboardQueueItem,
    SafetyDashboardResponse,
    SafetyDashboardTrendRow,
)


INCIDENT_SEVERITY_RANK = {
    "critical": 4,
    "high": 3,
    "medium": 2,
    "low": 1,
}

FINAL_CLOSEOUT_STATUSES = {
    WorkCloseOutStatus.approved,
    WorkCloseOutStatus.acknowledged,
    WorkCloseOutStatus.denied,
}


def get_safety_dashboard(db: Session) -> SafetyDashboardResponse:
    incidents = list_incidents(db)
    authorizations = list_work_authorizations(db)
    closeouts = list_work_closeouts(db)
    initiations = list_work_initiations(db)

    pending_hse_queue = build_pending_hse_queue(
        incidents=incidents,
        authorizations=authorizations,
        closeouts=closeouts,
    )
    approved_closeouts = [
        closeout
        for closeout in closeouts
        if closeout.status == WorkCloseOutStatus.approved
    ]
    acknowledged_closeouts = [
        closeout
        for closeout in closeouts
        if closeout.status == WorkCloseOutStatus.acknowledged
    ]
    clean_closeouts = [
        closeout
        for closeout in approved_closeouts
        if is_clean_closeout(closeout, authorizations)
    ]
    works_with_hazards = [
        closeout
        for closeout in closeouts
        if has_closeout_hazard(closeout)
    ]
    compliance_rate = (
        round((len(clean_closeouts) / len(approved_closeouts)) * 100)
        if approved_closeouts
        else 0
    )

    return SafetyDashboardResponse(
        metrics=SafetyDashboardMetrics(
            pending_hse_requests=len(pending_hse_queue),
            clean_close_outs=len(clean_closeouts),
            unsuccessful_close_outs=len(acknowledged_closeouts),
            works_with_hazards=len(works_with_hazards),
            end_to_end_compliance_rate=compliance_rate,
            compliant_close_outs=len(clean_closeouts),
            approved_close_outs=len(approved_closeouts),
        ),
        pending_hse_queue=pending_hse_queue,
        top_hazard_types=top_counts(
            [
                enum_value(incident.report_type).replace("_", " ").title()
                for incident in incidents
                if incident.status != IncidentReportStatus.draft
            ],
        ),
        top_hazard_locations=top_counts(
            [
                incident.location or "Unspecified"
                for incident in incidents
                if incident.status != IncidentReportStatus.draft
            ],
        ),
        safety_attention=SafetyDashboardAttention(
            gas_fire_environmental_concerns=sum(
                1 for incident in incidents if incident.gas_fire_environmental_concern
            ),
            open_corrective_actions=sum(
                1
                for incident in incidents
                if incident.status
                in (
                    IncidentReportStatus.recommended,
                    IncidentReportStatus.pending_hse_verification,
                    IncidentReportStatus.resolved,
                    IncidentReportStatus.not_resolved,
                )
            ),
            approved_close_outs_reviewed=len(approved_closeouts),
        ),
        ongoing_work=build_ongoing_work(
            initiations=initiations,
            authorizations=authorizations,
            closeouts=closeouts,
        ),
    )


def list_incidents(db: Session) -> list[SafetyIncidentReport]:
    return (
        db.query(SafetyIncidentReport)
        .options(joinedload(SafetyIncidentReport.hse_review))
        .filter(SafetyIncidentReport.is_active == True)
        .all()
    )


def list_work_authorizations(db: Session) -> list[SafetyWorkAuthorization]:
    return (
        db.query(SafetyWorkAuthorization)
        .options(
            joinedload(SafetyWorkAuthorization.work_initiation)
            .joinedload(SafetyWorkInitiation.assigned_supervisor)
            .joinedload(Employee.user),
            joinedload(SafetyWorkAuthorization.work_initiation)
            .joinedload(SafetyWorkInitiation.workers)
            .joinedload(SafetyWorkInitiationWorker.worker)
            .joinedload(Employee.user),
        )
        .filter(SafetyWorkAuthorization.is_active == True)
        .all()
    )


def list_work_closeouts(db: Session) -> list[SafetyWorkCloseOut]:
    return (
        db.query(SafetyWorkCloseOut)
        .options(
            joinedload(SafetyWorkCloseOut.reviews)
            .joinedload(SafetyCloseOutReview.reviewer)
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
        .filter(SafetyWorkCloseOut.is_active == True)
        .all()
    )


def list_work_initiations(db: Session) -> list[SafetyWorkInitiation]:
    return (
        db.query(SafetyWorkInitiation)
        .options(
            joinedload(SafetyWorkInitiation.requester).joinedload(Employee.user),
            joinedload(SafetyWorkInitiation.assigned_supervisor).joinedload(Employee.user),
            joinedload(SafetyWorkInitiation.workers)
            .joinedload(SafetyWorkInitiationWorker.worker)
            .joinedload(Employee.user),
        )
        .filter(SafetyWorkInitiation.is_active == True)
        .all()
    )


def build_pending_hse_queue(
    incidents: list[SafetyIncidentReport],
    authorizations: list[SafetyWorkAuthorization],
    closeouts: list[SafetyWorkCloseOut],
) -> list[SafetyDashboardQueueItem]:
    incident_reviews = [
        SafetyDashboardQueueItem(
            id=incident.id,
            reference=incident.reference,
            type="Incident Review",
            title=incident.title or "Untitled incident or hazard report",
            location=incident.location or "-",
            href=f"/safety/incidents/{incident.id}",
            detail=(
                "Gas, fire, or environmental concern flagged"
                if incident.gas_fire_environmental_concern
                else enum_value(incident.report_type).replace("_", " ").title()
            ),
            sort_score=INCIDENT_SEVERITY_RANK.get(enum_value(incident.severity_estimate), 0),
            submitted_at=incident.reported_at,
        )
        for incident in incidents
        if incident.status == IncidentReportStatus.submitted
    ]

    authorization_reviews = [
        SafetyDashboardQueueItem(
            id=authorization.id,
            reference=authorization.reference,
            type="Work Authorization",
            title=work_initiation_title(authorization.work_initiation),
            location=work_initiation_location(authorization.work_initiation),
            href=f"/safety/work-authorization/{authorization.id}",
            detail=get_authorization_risk_summary(authorization),
            sort_score=get_authorization_sort_score(authorization),
            submitted_at=authorization.requested_at,
        )
        for authorization in authorizations
        if authorization.status == WorkAuthorizationStatus.submitted
    ]

    closeout_reviews = [
        SafetyDashboardQueueItem(
            id=closeout.id,
            reference=closeout.reference,
            type="Close-Out Verification",
            title=work_initiation_title(
                closeout.work_authorization.work_initiation
                if closeout.work_authorization
                else None,
            ),
            location=work_initiation_location(
                closeout.work_authorization.work_initiation
                if closeout.work_authorization
                else None,
            ),
            href=f"/safety/work-close-out/{closeout.id}",
            detail=(
                "Close-out has hazard, deviation, or monitoring concern"
                if has_closeout_hazard(closeout)
                else "Operations has approved; HSE verification is pending"
            ),
            sort_score=3 if has_closeout_hazard(closeout) else 1,
            submitted_at=closeout.submitted_at,
        )
        for closeout in closeouts
        if closeout.status == WorkCloseOutStatus.pending
        and get_closeout_review(closeout, WorkCloseOutReviewerRole.operations_head)
        and not get_closeout_review(closeout, WorkCloseOutReviewerRole.hse)
    ]

    return sorted(
        [*incident_reviews, *authorization_reviews, *closeout_reviews],
        key=lambda item: (
            item.sort_score,
            item.submitted_at or item.submitted_at,
            item.reference,
        ),
        reverse=True,
    )


def build_ongoing_work(
    initiations: list[SafetyWorkInitiation],
    authorizations: list[SafetyWorkAuthorization],
    closeouts: list[SafetyWorkCloseOut],
) -> list[SafetyDashboardOngoingWorkItem]:
    closeout_by_authorization = latest_by(
        closeouts,
        key=lambda item: item.work_authorization_id,
        date_attr="created_at",
    )

    rows: list[SafetyDashboardOngoingWorkItem] = []
    for authorization in authorizations:
        if authorization.status != WorkAuthorizationStatus.approved:
            continue

        initiation = authorization.work_initiation
        if not initiation:
            initiation = next(
                (
                    item
                    for item in initiations
                    if item.id == authorization.work_initiation_id
                ),
                None,
            )
        if not initiation:
            continue

        closeout = closeout_by_authorization.get(authorization.id)
        if closeout and closeout.status in FINAL_CLOSEOUT_STATUSES:
            continue

        stage, status, href, updated_at = ongoing_stage(
            initiation=initiation,
            authorization=authorization,
            closeout=closeout,
        )

        rows.append(
            SafetyDashboardOngoingWorkItem(
                id=closeout.id if closeout else authorization.id if authorization else initiation.id,
                reference=(
                    closeout.reference
                    if closeout
                    else authorization.reference
                    if authorization
                    else initiation.reference
                ),
                title=initiation.title,
                location=initiation.location,
                exact_work_area=initiation.exact_work_area,
                supervisor=employee_name(initiation.assigned_supervisor),
                assigned_workers=[
                    employee_name(worker.worker) or "Worker"
                    for worker in sorted(
                        initiation.workers or [],
                        key=lambda item: employee_name(item.worker) or "",
                    )
                ],
                requester=employee_name(initiation.requester),
                current_stage=stage,
                status=status,
                href=href,
                planned_start_at=initiation.planned_start_at,
                planned_end_at=initiation.planned_end_at,
                updated_at=updated_at,
            )
        )

    return sorted(
        rows,
        key=lambda item: (item.updated_at or item.planned_start_at, item.reference),
        reverse=True,
    )[:20]


def ongoing_stage(
    initiation: SafetyWorkInitiation,
    authorization: Optional[SafetyWorkAuthorization],
    closeout: Optional[SafetyWorkCloseOut],
) -> tuple[str, str, str, Optional[object]]:
    if closeout:
        return (
            "Close-Out Review",
            enum_value(closeout.status),
            f"/safety/work-close-out/{closeout.id}",
            closeout.updated_at or closeout.created_at,
        )

    return (
        "Authorized Work",
        enum_value(authorization.status) if authorization else enum_value(initiation.status),
        f"/safety/work-authorization/{authorization.id}" if authorization else f"/safety/work-initiation/{initiation.id}",
        (authorization.updated_at or authorization.created_at)
        if authorization
        else initiation.updated_at or initiation.created_at,
    )


def is_clean_closeout(
    closeout: SafetyWorkCloseOut,
    authorizations: list[SafetyWorkAuthorization],
) -> bool:
    hse_review = get_closeout_review(closeout, WorkCloseOutReviewerRole.hse)
    authorization = next(
        (
            item
            for item in authorizations
            if item.id == closeout.work_authorization_id
        ),
        closeout.work_authorization,
    )

    return (
        closeout.status == WorkCloseOutStatus.approved
        and bool(hse_review)
        and hse_review.decision == WorkCloseOutDecision.approve
        and closeout.work_completed
        and closeout.completed_as_approved
        and not closeout.incident_observed
        and closeout.monitored_during_execution
        and closeout.stayed_within_scope
        and closeout.ppe_and_controls_maintained
        and closeout.work_area_cleaned
        and closeout.tools_removed
        and closeout.system_safe
        and not closeout.remaining_hazard
        and bool(hse_review.area_safe_for_operations)
        and not bool(hse_review.corrective_action_required)
        and is_authorization_compliant(authorization)
    )


def is_authorization_compliant(authorization: Optional[SafetyWorkAuthorization]) -> bool:
    if not authorization:
        return False

    required_checks = (
        authorization.work_area_safe,
        authorization.emergency_equipment_available,
        authorization.gas_pressure_check_completed,
        authorization.ppe_and_safety_kits_available,
        authorization.safety_controls_in_place,
    )

    return (
        authorization.status == WorkAuthorizationStatus.approved
        and authorization.hse_decision == WorkAuthorizationDecision.approve
        and authorization.hse_inspection_result == WorkAuthorizationInspectionResult.passed
        and all(check == WorkAuthorizationInspectionCheck.pass_ for check in required_checks)
    )


def has_closeout_hazard(closeout: SafetyWorkCloseOut) -> bool:
    hse_review = get_closeout_review(closeout, WorkCloseOutReviewerRole.hse)
    return (
        not closeout.completed_as_approved
        or closeout.remaining_hazard
        or bool(hse_review and hse_review.corrective_action_required)
    )


def get_closeout_review(
    closeout: SafetyWorkCloseOut,
    role: WorkCloseOutReviewerRole,
) -> Optional[SafetyCloseOutReview]:
    return next(
        (
            review
            for review in closeout.reviews or []
            if review.reviewer_role == role.value
        ),
        None,
    )


def get_authorization_sort_score(authorization: SafetyWorkAuthorization) -> int:
    if authorization.gas_involved and (
        authorization.pressurized_system or authorization.heat_or_sparks
    ):
        return 3
    if (
        authorization.heat_or_sparks
        or authorization.electrical_isolation
        or authorization.pressurized_system
    ):
        return 2
    return 1


def get_authorization_risk_summary(authorization: SafetyWorkAuthorization) -> str:
    risks = [
        "gas" if authorization.gas_involved else "",
        "pressurized system" if authorization.pressurized_system else "",
        "hot work" if authorization.heat_or_sparks else "",
        "electrical isolation" if authorization.electrical_isolation else "",
        "lifting" if authorization.lifting_equipment else "",
    ]
    selected = [risk for risk in risks if risk]
    return (
        f"Risk indicators: {', '.join(selected)}"
        if selected
        else "No high-risk indicator selected"
    )


def top_counts(items: list[str]) -> list[SafetyDashboardTrendRow]:
    counts = Counter(item for item in items if item)
    return [
        SafetyDashboardTrendRow(label=label, value=value)
        for label, value in sorted(
            counts.items(),
            key=lambda item: (-item[1], item[0]),
        )[:5]
    ]


def latest_by(items, key, date_attr: str):
    latest = {}
    for item in items:
        current_key = key(item)
        current_date = getattr(item, date_attr)
        existing = latest.get(current_key)
        if not existing or current_date > getattr(existing, date_attr):
            latest[current_key] = item
    return latest


def work_initiation_title(initiation: Optional[SafetyWorkInitiation]) -> str:
    return initiation.title if initiation else "Work Initiation"


def work_initiation_location(initiation: Optional[SafetyWorkInitiation]) -> str:
    return initiation.location if initiation else "-"


def employee_name(employee: Optional[Employee]) -> Optional[str]:
    if not employee or not employee.user:
        return None
    return employee.user.full_name or employee.user.email


def enum_value(value) -> str:
    return getattr(value, "value", value) or ""
