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

        url = email_service.get_request_url(ar.request_type, ar.request_id)
        requester_name = (
            requester.user.full_name
            if requester and requester.user and requester.user.full_name
            else (requester.employee_no if requester else "Unknown")
        )

        email_service.send_approval_required(
            to_email=approver.user.email,
            approver_name=approver.user.full_name or approver.employee_no,
            requester_name=requester_name,
            request_type_label=email_service.get_request_type_label(ar.request_type),
            request_title=title,
            step_name=step_name,
            action_url=url,
        )
    except Exception:
        logger.exception("notify_step_assigned failed for AR %s", approval_request_id)


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

        url = email_service.get_request_url(ar.request_type, ar.request_id)

        email_service.send_approval_result(
            to_email=requester.user.email,
            requester_name=requester.user.full_name or requester.employee_no,
            request_type_label=email_service.get_request_type_label(ar.request_type),
            request_title=title,
            action=action,
            comment=comment,
            action_url=url,
        )
    except Exception:
        logger.exception("notify_request_result failed for AR %s", approval_request_id)


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
