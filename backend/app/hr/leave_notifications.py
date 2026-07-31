"""
Leave notifications for the employee a request was raised FOR.

When someone raises leave on a colleague's behalf ("Raise For: Others"), that
colleague is not the requester and therefore receives none of the standard
workflow emails — they would never learn that leave was booked in their name,
nor how it progressed. These functions keep them informed at every stage.

OWNERSHIP: this file, its template (templates/email/leave_employee_update.html
and leave_raised_for_employee.html) and the HR leave endpoints are the whole
feature. Nothing in app/shared is modified, so no other module's behaviour can
change as a result of it.

CONTRACT: every public function here is best-effort and NEVER raises. Call them
only AFTER the request transaction has committed — a notification must not be
able to affect, delay or roll back the approval it is reporting on.
"""

import logging

from sqlalchemy.orm import Session, joinedload

from app.shared.services import email_service

logger = logging.getLogger(__name__)

# Status pill colours, matching the palette used by the other request emails.
_AMBER = "#d97706"
_GREEN = "#16a34a"
_RED = "#dc2626"


def _employee_to_notify(db: Session, leave_request_id: str):
    """
    Resolve the employee who should hear about a leave request raised FOR them.

    Returns (leave_request, employee, requester_name), or None when there is
    nobody to tell:
      - the request or employee no longer exists, or has no email address
      - the request was self-raised, i.e. the employee IS the requester. They
        already receive the standard requester emails, so notifying again would
        send them everything twice. This is checked against the employee's user
        id rather than the form's "Raise For" value, because a requester can
        pick themselves from the employee list.
    """
    from app.hr.models import LeaveRequest
    from app.employees.models import Employee
    from app.shared.models.user import User

    lr = (
        db.query(LeaveRequest)
        .options(joinedload(LeaveRequest.leave_type))
        .filter(LeaveRequest.id == leave_request_id)
        .first()
    )
    if not lr:
        return None

    employee = (
        db.query(Employee)
        .options(joinedload(Employee.user))
        .filter(Employee.id == lr.employee_id)
        .first()
    )
    if not employee or not employee.user or not employee.user.email:
        return None

    # requester_id stores the User id by design (see create_leave_request).
    requester_user = db.query(User).filter(User.id == lr.requester_id).first()
    if requester_user and employee.user_id == requester_user.id:
        return None  # self-raised

    requester_name = (requester_user.full_name if requester_user else None) or "A colleague"
    return lr, employee, requester_name


def _date_range(lr) -> str:
    if lr.end_date and lr.end_date != lr.start_date:
        return f"{lr.start_date:%d %b %Y} – {lr.end_date:%d %b %Y}"
    return f"{lr.start_date:%d %b %Y}"


def _comment_row(comment: str | None) -> str:
    if not comment:
        return ""
    return (
        '<tr style="background:#f9fafb;">'
        '<td style="padding:10px 14px; font-size:13px; color:#6b7280; font-weight:600; '
        'border-top:1px solid #e5e7eb;">Comment</td>'
        f'<td style="padding:10px 14px; font-size:13px; color:#111118; '
        f'border-top:1px solid #e5e7eb;">{comment}</td></tr>'
    )


def _send_update(
    db: Session,
    leave_request_id: str,
    *,
    subject: str,
    heading: str,
    message: str,
    status_label: str,
    status_color: str,
    footnote: str,
    comment: str | None = None,
) -> None:
    """Render and send one stage email. Swallows every error by design."""
    try:
        resolved = _employee_to_notify(db, leave_request_id)
        if not resolved:
            return
        lr, employee, _requester_name = resolved

        html = email_service._render("leave_employee_update.html", {
            "subject":         subject,
            "heading":         heading,
            "employee_name":   employee.user.full_name or employee.employee_no,
            "message":         message,
            "reference":       lr.reference,
            "leave_type_name": lr.leave_type.leave_type_name if lr.leave_type else "Leave",
            "days":            str(lr.days or 0),
            "date_range":      _date_range(lr),
            "status_label":    status_label,
            "status_color":    status_color,
            "comment_row":     _comment_row(comment),
            "footnote":        footnote,
            "action_url":      email_service.get_request_url("leave_request", lr.id, db),
        })
        email_service._send(employee.user.email, subject, html)
    except Exception:
        logger.exception(
            "leave employee notification failed (%s) for leave_request %s",
            heading, leave_request_id,
        )


# ── Public stage notifications ────────────────────────────────────────────────

def notify_raised(db: Session, leave_request_id: str) -> None:
    """Stage 1 — someone raised this leave on the employee's behalf."""
    try:
        resolved = _employee_to_notify(db, leave_request_id)
        if not resolved:
            return
        lr, employee, requester_name = resolved
        leave_type = lr.leave_type.leave_type_name if lr.leave_type else "Leave"
        subject = f"Leave Requested On Your Behalf — {lr.reference}"

        email_service._send(
            employee.user.email,
            subject,
            email_service._render("leave_raised_for_employee.html", {
                "subject":         subject,
                "employee_name":   employee.user.full_name or employee.employee_no,
                "requester_name":  requester_name,
                "reference":       lr.reference,
                "leave_type_name": leave_type,
                "date_range":      _date_range(lr),
                "days":            str(lr.days or 0),
                "action_url":      email_service.get_request_url("leave_request", lr.id, db),
            }),
        )
    except Exception:
        logger.exception(
            "leave employee notification failed (raised) for leave_request %s",
            leave_request_id,
        )


def notify_step_approved(
    db: Session,
    leave_request_id: str,
    approver_name: str,
    step_name: str,
    next_step_name: str | None,
    comment: str | None = None,
) -> None:
    """Stage 2 — an intermediate approval; the request moves to the next step."""
    pending = f"It is now with {next_step_name}." if next_step_name else "It is moving to the next step."
    _send_update(
        db, leave_request_id,
        subject=f"Leave Progress — {step_name} approved",
        heading="Leave Request Progressing",
        message=(
            f"The leave raised on your behalf has been approved by {approver_name} "
            f"({step_name}). {pending}"
        ),
        status_label=f"Pending {next_step_name}" if next_step_name else "In Progress",
        status_color=_AMBER,
        footnote="You will be notified as it moves through the remaining steps.",
        comment=comment,
    )


def notify_outcome(
    db: Session,
    leave_request_id: str,
    action: str,                      # "approved" | "rejected" | "returned"
    approver_name: str,
    comment: str | None = None,
) -> None:
    """Stage 3 — the final outcome, including a return for revision."""
    meta = {
        "approved": dict(
            subject="Leave Approved",
            heading="Leave Approved",
            message="The leave raised on your behalf has been fully approved.",
            status_label="Approved",
            status_color=_GREEN,
            footnote="No further action is needed.",
        ),
        "rejected": dict(
            subject="Leave Not Approved",
            heading="Leave Not Approved",
            message=f"The leave raised on your behalf was declined by {approver_name}.",
            status_label="Denied",
            status_color=_RED,
            footnote="Speak to the person who raised it, or your HR team, if you have questions.",
        ),
        "returned": dict(
            subject="Leave Returned For Revision",
            heading="Leave Returned For Revision",
            message=(
                f"{approver_name} has sent the leave raised on your behalf back for "
                "revision. It has not been declined — whoever raised it needs to make "
                "changes and resubmit."
            ),
            status_label="Returned",
            status_color=_AMBER,
            footnote="You will be notified again once it is resubmitted and decided.",
        ),
    }.get(action)

    if not meta:
        return  # unknown action — stay silent rather than send something wrong

    resolved = _employee_to_notify(db, leave_request_id)
    reference = resolved[0].reference if resolved else ""

    _send_update(
        db, leave_request_id,
        subject=f"{meta['subject']} — {reference}" if reference else meta["subject"],
        heading=meta["heading"],
        message=meta["message"],
        status_label=meta["status_label"],
        status_color=meta["status_color"],
        footnote=meta["footnote"],
        comment=comment,
    )
