"""Lifecycle email notifications for Incident/Hazard reports."""

from collections.abc import Iterable
import logging

from sqlalchemy.orm import Session, joinedload

from app.employees.models import Employee
from app.safety.incidents.models import SafetyIncidentHseReview, SafetyIncidentReport
from app.shared.services import email_service

logger = logging.getLogger(__name__)


def _load_report(db: Session, incident_id: str) -> SafetyIncidentReport | None:
    return (
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
        .filter(SafetyIncidentReport.id == incident_id)
        .first()
    )


def _employee_name(employee: Employee) -> str:
    if employee.user:
        return employee.user.full_name or employee.user.email
    return employee.employee_no or "Safety user"


def _severity(report: SafetyIncidentReport) -> str:
    return (
        report.severity_estimate.value.title()
        if report.severity_estimate
        else "Not specified"
    )


def _send(
    report: SafetyIncidentReport,
    recipient: Employee | None,
    *,
    subject: str,
    heading: str,
    message: str,
    details: str | None,
    action_label: str,
) -> str | None:
    if not recipient or not recipient.user or not recipient.user.email:
        return None

    email_service.send_incident_notification(
        to_email=recipient.user.email,
        recipient_name=_employee_name(recipient),
        subject=subject,
        heading=heading,
        message=message,
        incident_reference=report.reference,
        incident_title=report.title,
        severity=_severity(report),
        location=report.location,
        details=details,
        action_label=action_label,
        action_url=email_service.get_request_url("safety", f"incidents/{report.id}"),
    )
    return recipient.user.email.strip().lower()


def _send_unique(
    report: SafetyIncidentReport,
    notifications: Iterable[tuple[Employee | None, dict[str, str | None]]],
) -> None:
    sent_to: set[str] = set()
    for recipient, content in notifications:
        if not recipient or not recipient.user or not recipient.user.email:
            continue
        normalized_email = recipient.user.email.strip().lower()
        if normalized_email in sent_to:
            continue
        try:
            sent_email = _send(report, recipient, **content)
        except Exception:
            logger.exception(
                "Incident notification failed for %s to %s",
                report.id,
                normalized_email,
            )
            continue
        if sent_email:
            sent_to.add(sent_email)


def notify_submitted(db: Session, incident_id: str) -> None:
    from app.safety.incidents.service import get_primary_hse_inspector

    report = _load_report(db, incident_id)
    if not report:
        return

    inspector = get_primary_hse_inspector(db)
    reporter_name = (
        _employee_name(report.reporter) if report.reporter else "A safety user"
    )
    _send_unique(
        report,
        [
            (
                inspector,
                {
                    "subject": f"Incident/Hazard Review Required - {report.reference}",
                    "heading": "New Incident/Hazard Report",
                    "message": f"{reporter_name} submitted a report that requires HSE review.",
                    "details": report.description,
                    "action_label": "Review Incident",
                },
            ),
            (
                report.reporter,
                {
                    "subject": f"Incident/Hazard Report Submitted - {report.reference}",
                    "heading": "Report Submitted Successfully",
                    "message": "Your incident/hazard report has been submitted for HSE review.",
                    "details": report.description,
                    "action_label": "View Incident",
                },
            ),
        ],
    )


def notify_recommended(db: Session, incident_id: str) -> None:
    report = _load_report(db, incident_id)
    if not report or not report.hse_review:
        return

    details = report.hse_review.corrective_action_details
    _send_unique(
        report,
        [
            (
                report.hse_review.action_owner,
                {
                    "subject": f"Corrective Action Assigned - {report.reference}",
                    "heading": "Corrective Action Assigned to You",
                    "message": (
                        "HSE assigned you corrective action for this "
                        "incident/hazard report."
                    ),
                    "details": details,
                    "action_label": "View Corrective Action",
                },
            ),
            (
                report.reporter,
                {
                    "subject": f"Corrective Action Recommended - {report.reference}",
                    "heading": "Corrective Action Recommended",
                    "message": "HSE reviewed your report and recommended corrective action.",
                    "details": details,
                    "action_label": "View Incident",
                },
            ),
        ],
    )


def notify_pending_verification(db: Session, incident_id: str) -> None:
    from app.safety.incidents.service import get_primary_hse_inspector

    report = _load_report(db, incident_id)
    if not report:
        return

    review = report.hse_review
    inspector = (
        review.inspector
        if review and review.inspector
        else get_primary_hse_inspector(db)
    )
    details = (
        "Corrective work has completed its linked Work Close-Out and now "
        "requires final HSE verification."
    )
    _send_unique(
        report,
        [
            (
                inspector,
                {
                    "subject": f"Final HSE Verification Required - {report.reference}",
                    "heading": "Incident Ready for Final Verification",
                    "message": (
                        "The linked corrective work is complete. Verify the "
                        "outcome before closing this incident."
                    ),
                    "details": details,
                    "action_label": "Verify Incident",
                },
            ),
            (
                review.action_owner if review else None,
                {
                    "subject": f"Corrective Work Awaiting HSE Verification - {report.reference}",
                    "heading": "Corrective Work Submitted for Verification",
                    "message": (
                        "The linked corrective work is complete and awaiting "
                        "final HSE verification."
                    ),
                    "details": details,
                    "action_label": "View Incident",
                },
            ),
            (
                report.reporter,
                {
                    "subject": f"Incident Awaiting Final Verification - {report.reference}",
                    "heading": "Corrective Work Completed",
                    "message": (
                        "Corrective work is complete and the incident is "
                        "awaiting final HSE verification."
                    ),
                    "details": details,
                    "action_label": "View Incident",
                },
            ),
        ],
    )


def notify_closed(db: Session, incident_id: str) -> None:
    report = _load_report(db, incident_id)
    if not report:
        return

    review = report.hse_review
    details = (review.comment if review and review.comment else None) or (
        "HSE verified and closed this incident/hazard report."
    )
    content = {
        "subject": f"Incident/Hazard Closed - {report.reference}",
        "heading": "Incident/Hazard Closed",
        "message": "This incident/hazard report has been resolved, verified, and closed.",
        "details": details,
        "action_label": "View Incident",
    }
    _send_unique(
        report,
        [
            (report.reporter, content),
            (review.action_owner if review else None, content),
            (review.inspector if review else None, content),
        ],
    )


def notify_not_resolved(db: Session, incident_id: str) -> None:
    report = _load_report(db, incident_id)
    if not report:
        return

    review = report.hse_review
    details = (review.comment if review and review.comment else None) or (
        "HSE determined that the incident is not yet resolved."
    )
    content = {
        "subject": f"Further Corrective Action Required - {report.reference}",
        "heading": "Incident Not Resolved",
        "message": (
            "HSE verification found that this incident is not yet resolved. "
            "Review the findings and take further action."
        ),
        "details": details,
        "action_label": "View Incident",
    }
    _send_unique(
        report,
        [
            (review.action_owner if review else None, content),
            (report.reporter, content),
        ],
    )
