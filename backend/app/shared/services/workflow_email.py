"""
Workflow email notifications — sends emails at key points in the approval lifecycle.

Always call AFTER db.commit() so the data is stable. All functions swallow
their own exceptions — email failures must never block the API response.

Usage:
    result = engine.approve(...)
    db.commit()
    if result.overall_status.value == "approved":
        notify_request_result(db, approval_request_id, "approved", comment=body.comment)
    else:
        notify_step_assigned(db, approval_request_id)
"""

import logging
from sqlalchemy.orm import Session, joinedload

from app.shared.services import email_service

logger = logging.getLogger(__name__)


def notify_step_assigned(db: Session, approval_request_id: str) -> None:
    """
    Look up the current step's assigned approver and email them.
    Called after engine.start() or engine.approve() (mid-flow) commits.
    """
    try:
        from app.shared.models.approval import (
            ApprovalRequest, ApprovalStepAssignment,
            AllRequest, ApprovalOverallStatus, WorkflowStep,
        )
        from app.employees.models import Employee

        ar = (
            db.query(ApprovalRequest)
            .filter(ApprovalRequest.id == approval_request_id)
            .first()
        )
        if not ar or ar.overall_status != ApprovalOverallStatus.pending:
            return

        assignment = (
            db.query(ApprovalStepAssignment)
            .filter(
                ApprovalStepAssignment.approval_request_id == ar.id,
                ApprovalStepAssignment.step_number == ar.current_step_number,
            )
            .first()
        )
        if not assignment:
            return

        approver = (
            db.query(Employee)
            .options(joinedload(Employee.user))
            .filter(Employee.id == assignment.assigned_to)
            .first()
        )
        if not approver or not approver.user or not approver.user.email:
            return

        requester = (
            db.query(Employee)
            .options(joinedload(Employee.user))
            .filter(Employee.id == ar.submitted_by)
            .first()
        )

        all_req = (
            db.query(AllRequest)
            .filter(
                AllRequest.request_type == ar.request_type,
                AllRequest.request_id == ar.request_id,
            )
            .first()
        )
        title = (all_req.title if all_req else None) or ar.request_type

        step = (
            db.query(WorkflowStep)
            .filter(
                WorkflowStep.workflow_id == ar.workflow_id,
                WorkflowStep.step_number == ar.current_step_number,
            )
            .first()
        )
        step_name = step.step_name if step else ""

        url = email_service.get_request_url(ar.request_type, ar.request_id, db)
        requester_name = (
            requester.user.full_name
            if requester and requester.user and requester.user.full_name
            else (requester.employee_no if requester else "Unknown")
        )
        approval_email_copy = approval_required_copy_for_step(
            request_type=ar.request_type,
            request_title=title,
            step_name=step_name,
            step_number=ar.current_step_number,
        )

        email_service.send_approval_required(
            to_email=approver.user.email,
            approver_name=approver.user.full_name or approver.employee_no,
            requester_name=requester_name,
            request_type_label=email_service.get_request_type_label(ar.request_type),
            request_title=title,
            step_name=step_name,
            action_url=url,
            intro_message=approval_email_copy["intro_message"],
            action_message=approval_email_copy["action_message"],
            button_label=approval_email_copy["button_label"],
        )
    except Exception:
        logger.exception("notify_step_assigned failed for AR %s", approval_request_id)


def approval_required_copy_for_step(
    request_type: str,
    request_title: str,
    step_name: str,
    step_number: int,
) -> dict[str, str | None]:
    if (
        request_type == "work_initiation"
        and (
            step_number == 1
            or "supervisor" in (step_name or "").lower()
        )
    ):
        return {
            "intro_message": (
                f"You were selected as the supervisor for {request_title} "
                "Work Initiation."
            ),
            "action_message": (
                "Click the button above to view the work details and take the "
                "necessary supervisor action."
            ),
            "button_label": "View Details & Take Action",
        }

    return {
        "intro_message": None,
        "action_message": None,
        "button_label": "Review & Approve",
    }


def notify_request_result(
    db: Session,
    approval_request_id: str,
    action: str,
    comment: str | None = None,
) -> None:
    """
    Email the requester when their request is fully approved, rejected, or returned.
    Call AFTER db.commit().

    action: "approved" | "rejected" | "returned"
    """
    try:
        from app.shared.models.approval import ApprovalRequest, AllRequest
        from app.employees.models import Employee

        ar = (
            db.query(ApprovalRequest)
            .filter(ApprovalRequest.id == approval_request_id)
            .first()
        )
        if not ar:
            return

        requester = (
            db.query(Employee)
            .options(joinedload(Employee.user))
            .filter(Employee.id == ar.submitted_by)
            .first()
        )
        if not requester or not requester.user or not requester.user.email:
            return

        all_req = (
            db.query(AllRequest)
            .filter(
                AllRequest.request_type == ar.request_type,
                AllRequest.request_id == ar.request_id,
            )
            .first()
        )
        title = (all_req.title if all_req else None) or ar.request_type

        url = email_service.get_request_url(ar.request_type, ar.request_id, db)
        result_message_override = approved_result_message_for_request_type(
            ar.request_type,
            action,
        )

        email_service.send_approval_result(
            to_email=requester.user.email,
            requester_name=requester.user.full_name or requester.employee_no,
            request_type_label=email_service.get_request_type_label(ar.request_type),
            request_title=title,
            action=action,
            comment=comment,
            action_url=url,
            result_message_override=result_message_override,
        )
    except Exception:
        logger.exception("notify_request_result failed for AR %s", approval_request_id)


def approved_result_message_for_request_type(
    request_type: str,
    action: str,
) -> str | None:
    if action != "approved":
        return None

    if request_type == "work_initiation":
        return (
            "Your Work Initiation has been fully approved. You can now raise "
            "a Work Authorization request from the Safety Work Authorization page."
        )

    if request_type == "work_authorization":
        return (
            "Your Work Authorization has been fully approved. Once the work "
            "has been inspected and completed, you can raise a Work Completion "
            "and Close-Out request from the Safety Work Completion page."
        )

    return None


def notify_step_progress(
    db: Session,
    approval_request_id: str,
    approver_employee_id: str,
) -> None:
    """
    Email the requester after a mid-flow step is approved, telling them which
    step just passed and what's pending next.

    Call AFTER db.commit(), with the approver's employee_id (captured before
    the engine advances current_step_number).
    """
    try:
        from app.shared.models.approval import (
            ApprovalRequest, ApprovalStepAssignment,
            AllRequest, WorkflowStep,
        )
        from app.employees.models import Employee

        ar = (
            db.query(ApprovalRequest)
            .filter(ApprovalRequest.id == approval_request_id)
            .first()
        )
        if not ar:
            return

        requester = (
            db.query(Employee)
            .options(joinedload(Employee.user))
            .filter(Employee.id == ar.submitted_by)
            .first()
        )
        if not requester or not requester.user or not requester.user.email:
            return

        approver = (
            db.query(Employee)
            .options(joinedload(Employee.user))
            .filter(Employee.id == approver_employee_id)
            .first()
        )
        approver_name = (
            approver.user.full_name
            if approver and approver.user and approver.user.full_name
            else (approver.employee_no if approver else "Unknown")
        )

        all_req = (
            db.query(AllRequest)
            .filter(
                AllRequest.request_type == ar.request_type,
                AllRequest.request_id == ar.request_id,
            )
            .first()
        )
        title = (all_req.title if all_req else None) or ar.request_type

        # The engine has already advanced current_step_number to the next step.
        # So completed_step = current_step_number - 1, next_step = current_step_number.
        completed_step_number = ar.current_step_number - 1

        completed_step = (
            db.query(WorkflowStep)
            .filter(
                WorkflowStep.workflow_id == ar.workflow_id,
                WorkflowStep.step_number == completed_step_number,
            )
            .first()
        )
        next_step = (
            db.query(WorkflowStep)
            .filter(
                WorkflowStep.workflow_id == ar.workflow_id,
                WorkflowStep.step_number == ar.current_step_number,
            )
            .first()
        )

        step_name = completed_step.step_name if completed_step else f"Step {completed_step_number}"
        next_step_name = next_step.step_name if next_step else f"Step {ar.current_step_number}"

        url = email_service.get_request_url(ar.request_type, ar.request_id, db)
        subject = f"Request Update: {email_service.get_request_type_label(ar.request_type)} — Step {completed_step_number} Approved"

        html = email_service._render("request_progress.html", {
            "subject":            subject,
            "requester_name":     requester.user.full_name or requester.employee_no,
            "request_type_label": email_service.get_request_type_label(ar.request_type),
            "request_title":      title,
            "step_number":        str(completed_step_number),
            "step_name":          step_name,
            "approver_name":      approver_name,
            "next_step_name":     next_step_name,
            "action_url":         url,
        })
        email_service._send(requester.user.email, subject, html)
    except Exception:
        logger.exception("notify_step_progress failed for AR %s", approval_request_id)


def notify_new_request(db: Session, request_type: str, request_id: str) -> None:
    """
    Convenience wrapper: look up the approval_request_id from AllRequest,
    then call notify_step_assigned. Use this from module routers (e.g. procurement)
    after db.commit() on a new request submission.
    """
    try:
        from app.shared.models.approval import AllRequest

        all_req = (
            db.query(AllRequest)
            .filter(
                AllRequest.request_type == request_type,
                AllRequest.request_id == request_id,
            )
            .first()
        )
        if all_req and all_req.approval_request_id:
            notify_step_assigned(db, all_req.approval_request_id)
    except Exception:
        logger.exception("notify_new_request failed for %s/%s", request_type, request_id)
