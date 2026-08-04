"""
Workflow email notifications — sends emails at key points in the approval lifecycle.

WorkflowEngine queues the standard lifecycle emails and runs them only after
the request transaction commits successfully. All functions swallow their own
exceptions so email failures never block the API response.

Email content (subject, copy, button labels) is resolved via a two-level
registry:
  1. Per-module content file registered in _CONTENT_REGISTRY
     (e.g. app.procurement.email_content)
  2. Generic fallback: app.shared.services.generic_email_content

Each content file exposes hooks (on_submitted, on_step_assigned, etc.) that
return a dict of overrides, or None to fall back.

Modules customize wording through the content registry. They should not call
the standard lifecycle helpers after invoking WorkflowEngine because that
would send the same notification twice.
"""

import importlib
import logging
from dataclasses import dataclass

from sqlalchemy.orm import Session, joinedload

from app.shared.services import email_service

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# StepContext
# ---------------------------------------------------------------------------

@dataclass
class StepContext:
    step_number: int
    step_name: str
    total_steps: int


# ---------------------------------------------------------------------------
# Content registry
# ---------------------------------------------------------------------------

_CONTENT_REGISTRY: dict[str, str] = {
    "procurement":       "app.procurement.email_content",
    "asset":             "app.assets.email_content",
    "work_initiation":   "app.safety.work_initiations.email_content",
    "work_authorization": "app.safety.work_authorizations.email_content",
    "work_closeout":     "app.safety.work_closeouts.email_content",
    # Uncomment as each module creates its content file:
    # "leave": "app.leave.email_content",
}

_GENERIC_MODULE = "app.shared.services.generic_email_content"


# ---------------------------------------------------------------------------
# Hook dispatcher
# ---------------------------------------------------------------------------

def _call_hook(request_type: str, hook_name: str, ctx: dict) -> dict | None:
    """
    Try the registered per-module content file first; fall back to the generic
    module if the hook is absent or the module is not registered.

    Returns the hook's dict result, or None.
    """
    module_path = _CONTENT_REGISTRY.get(request_type)
    if module_path:
        try:
            mod = importlib.import_module(module_path)
            hook = getattr(mod, hook_name, None)
            if hook is not None:
                return hook(ctx)
        except Exception:
            logger.exception(
                "_call_hook: %s.%s failed for request_type=%s",
                module_path, hook_name, request_type,
            )

    # Generic fallback
    try:
        generic_mod = importlib.import_module(_GENERIC_MODULE)
        hook = getattr(generic_mod, hook_name, None)
        if hook is not None:
            return hook(ctx)
    except Exception:
        logger.exception(
            "_call_hook: generic %s.%s failed for request_type=%s",
            _GENERIC_MODULE, hook_name, request_type,
        )

    return None


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------

def _load_total_steps(db: Session, workflow_id: str) -> int:
    from app.shared.models.approval import WorkflowStep
    return db.query(WorkflowStep).filter(WorkflowStep.workflow_id == workflow_id).count()


def _load_step_ctx(db: Session, workflow_id: str, step_number: int, total_steps: int) -> StepContext:
    from app.shared.models.approval import WorkflowStep
    step = (
        db.query(WorkflowStep)
        .filter(
            WorkflowStep.workflow_id == workflow_id,
            WorkflowStep.step_number == step_number,
        )
        .first()
    )
    step_name = step.step_name if step else f"Step {step_number}"
    return StepContext(step_number=step_number, step_name=step_name, total_steps=total_steps)


def _employee_actor_label(employee, step_name: str | None = None) -> str:
    """
    Build a display label for an actor.

    If step_name is provided, use it as the role (the capacity they acted in).
    Otherwise fall back to their job_title.
    """
    if not employee:
        return "Unknown"

    name = (
        employee.user.full_name
        if employee.user and employee.user.full_name
        else employee.employee_no
    )

    # Prefer step_name (the capacity they acted in) over job_title
    role = step_name
    if not role:
        role = employee.job_title
        if not role and employee.user and employee.user.role:
            role_value = getattr(employee.user.role, "value", employee.user.role)
            role = str(role_value).replace("_", " ").title()

    return f"{name} ({role})" if role else name


# ---------------------------------------------------------------------------
# Public notify functions
# ---------------------------------------------------------------------------

def notify_submitted(db: Session, approval_request_id: str) -> None:
    """
    Email the requester immediately after they submit a request.
    Tells them it is now pending approval at Step 1.
    Call AFTER db.commit() (or after flush, inside engine).
    """
    try:
        from app.shared.models.approval import (
            ApprovalRequest, AllRequest, WorkflowStep, ApprovalStepAssignment,
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

        all_req = (
            db.query(AllRequest)
            .filter(
                AllRequest.request_type == ar.request_type,
                AllRequest.request_id == ar.request_id,
            )
            .first()
        )
        title = (all_req.title if all_req else None) or ar.request_type

        total_steps = _load_total_steps(db, ar.workflow_id)
        step = _load_step_ctx(db, ar.workflow_id, ar.current_step_number, total_steps)

        # Look up the assigned approver for the current step
        assignment = (
            db.query(ApprovalStepAssignment)
            .filter(
                ApprovalStepAssignment.approval_request_id == ar.id,
                ApprovalStepAssignment.step_number == ar.current_step_number,
            )
            .first()
        )
        approver_name = None
        if assignment:
            approver = (
                db.query(Employee)
                .options(joinedload(Employee.user))
                .filter(Employee.id == assignment.assigned_to)
                .first()
            )
            if approver and approver.user:
                approver_name = approver.user.full_name or approver.employee_no

        # Build pending_with label: "Name, Role: Step Name" or just "Step Name" if no approver found
        if approver_name:
            pending_with = f"{approver_name}, Role: {step.step_name}"
        else:
            pending_with = step.step_name

        ctx = {
            "db": db,
            "ar": ar,
            "requester_name": requester.user.full_name or requester.employee_no,
            "step": step,
            "request_title": title,
        }
        override = _call_hook(ar.request_type, "on_submitted", ctx)

        subject = (override or {}).get("subject") or (
            f"{email_service.get_request_type_label(ar.request_type)} Request Submitted"
        )
        url = email_service.get_request_url(ar.request_type, ar.request_id, db)

        html = email_service._render("request_submitted.html", {
            "subject":            subject,
            "requester_name":     ctx["requester_name"],
            "request_type_label": email_service.get_request_type_label(ar.request_type),
            "request_title":      title,
            "step_number":        str(ar.current_step_number),
            "step_name":          step.step_name,
            "pending_with":       pending_with,
            "action_url":         url,
        })
        email_service._send(requester.user.email, subject, html)
    except Exception:
        logger.exception("notify_submitted failed for AR %s", approval_request_id)


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

        requester_name = (
            requester.user.full_name
            if requester and requester.user and requester.user.full_name
            else (requester.employee_no if requester else "Unknown")
        )

        total_steps = _load_total_steps(db, ar.workflow_id)
        step = _load_step_ctx(db, ar.workflow_id, ar.current_step_number, total_steps)

        ctx = {
            "db": db,
            "ar": ar,
            "approver_name": approver.user.full_name or approver.employee_no,
            "requester_name": requester_name,
            "step": step,
            "request_title": title,
        }
        override = _call_hook(ar.request_type, "on_step_assigned", ctx)

        url = email_service.get_request_url(ar.request_type, ar.request_id, db)

        email_service.send_approval_required(
            to_email=approver.user.email,
            approver_name=ctx["approver_name"],
            requester_name=requester_name,
            request_type_label=email_service.get_request_type_label(ar.request_type),
            request_title=title,
            step_name=step.step_name,
            action_url=url,
            intro_message=(override or {}).get("intro_message"),
            action_message=(override or {}).get("action_message"),
            button_label=(override or {}).get("button_label", "Review & Approve"),
        )
    except Exception:
        logger.exception("notify_step_assigned failed for AR %s", approval_request_id)


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
        total_steps = _load_total_steps(db, ar.workflow_id)

        completed_step = _load_step_ctx(db, ar.workflow_id, completed_step_number, total_steps)
        next_step = _load_step_ctx(db, ar.workflow_id, ar.current_step_number, total_steps)

        # Use the completed step's name as the capacity the approver acted in
        approver_name = _employee_actor_label(approver, completed_step.step_name)

        # Look up the next step's assigned approver
        next_assignment = (
            db.query(ApprovalStepAssignment)
            .filter(
                ApprovalStepAssignment.approval_request_id == ar.id,
                ApprovalStepAssignment.step_number == ar.current_step_number,
            )
            .first()
        )
        next_approver_name = None
        if next_assignment:
            next_approver = (
                db.query(Employee)
                .options(joinedload(Employee.user))
                .filter(Employee.id == next_assignment.assigned_to)
                .first()
            )
            if next_approver and next_approver.user:
                next_approver_name = next_approver.user.full_name or next_approver.employee_no

        # Build pending_with label for next step
        if next_approver_name:
            next_pending_with = f"{next_approver_name}, Role: {next_step.step_name}"
        else:
            next_pending_with = next_step.step_name

        ctx = {
            "db": db,
            "ar": ar,
            "completed_step": completed_step,
            "next_step": next_step,
            "approver_name": approver_name,
            "request_title": title,
        }
        override = _call_hook(ar.request_type, "on_step_progress", ctx)

        subject = (override or {}).get("subject") or (
            f"{email_service.get_request_type_label(ar.request_type)} Request — Approved"
        )
        resolved_approver_name = (override or {}).get("approver_name") or approver_name
        url = email_service.get_request_url(ar.request_type, ar.request_id, db)

        html = email_service._render("request_progress.html", {
            "subject":            subject,
            "requester_name":     requester.user.full_name or requester.employee_no,
            "request_type_label": email_service.get_request_type_label(ar.request_type),
            "request_title":      title,
            "step_number":        str(completed_step_number),
            "step_name":          completed_step.step_name,
            "approver_name":      resolved_approver_name,
            "next_step_name":     next_step.step_name,
            "next_pending_with":  next_pending_with,
            "action_url":         url,
        })
        email_service._send(requester.user.email, subject, html)
    except Exception:
        logger.exception("notify_step_progress failed for AR %s", approval_request_id)


def notify_request_result(
    db: Session,
    approval_request_id: str,
    action: str,
    comment: str | None = None,
    actor_employee_id: str | None = None,
    actor_step_name: str | None = None,
) -> None:
    """
    Email the requester when their request is fully approved, rejected, or returned.
    Call AFTER db.commit().

    action: "approved" | "rejected" | "returned"
    actor_step_name: The step/role name the actor was acting as (e.g. "Operations Manager")
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

        actor = (
            db.query(Employee)
            .options(joinedload(Employee.user))
            .filter(Employee.id == actor_employee_id)
            .first()
            if actor_employee_id
            else None
        )
        actor_label = _employee_actor_label(actor, actor_step_name)

        all_req = (
            db.query(AllRequest)
            .filter(
                AllRequest.request_type == ar.request_type,
                AllRequest.request_id == ar.request_id,
            )
            .first()
        )
        title = (all_req.title if all_req else None) or ar.request_type

        ctx = {
            "db": db,
            "ar": ar,
            "request_title": title,
            "comment": comment,
            "actor_label": actor_label,
        }
        hook_name = {
            "approved": "on_approved",
            "rejected": "on_rejected",
            "returned": "on_returned",
        }.get(action, "on_approved")
        override = _call_hook(ar.request_type, hook_name, ctx)
        overrides = override or {}

        url = email_service.get_request_url(ar.request_type, ar.request_id, db)

        email_service.send_approval_result(
            to_email=requester.user.email,
            requester_name=requester.user.full_name or requester.employee_no,
            request_type_label=email_service.get_request_type_label(ar.request_type),
            request_title=title,
            action=action,
            comment=comment,
            action_url=url,
            actor_label=actor_label,
            result_message_override=overrides.get("result_message"),
            subject_override=overrides.get("subject"),
            result_heading_override=overrides.get("result_heading"),
            action_label_override=overrides.get("action_label"),
            action_color_override=overrides.get("action_color"),
        )
    except Exception:
        logger.exception("notify_request_result failed for AR %s", approval_request_id)


def notify_asset_allocation_needed(
    db: Session,
    request_id: str,
    actor_employee_id: str,
) -> None:
    """
    Email the approver who just gave final approval on an asset request,
    reminding them to allocate the specific assets now.
    Called AFTER db.commit() from the workflow approve endpoint.
    """
    try:
        from app.assets.models import AssetRequest
        from app.employees.models import Employee

        req = db.query(AssetRequest).filter(AssetRequest.id == request_id).first()
        if not req:
            return

        actor = (
            db.query(Employee)
            .options(joinedload(Employee.user))
            .filter(Employee.id == actor_employee_id)
            .first()
        )
        if not actor or not actor.user or not actor.user.email:
            return

        actor_name = actor.user.full_name or actor.employee_no
        req_url = email_service.get_request_url("asset", request_id)

        email_service.send_approval_required(
            to_email=actor.user.email,
            approver_name=actor_name,
            requester_name="",
            request_type_label="Asset",
            request_title=req.reference,
            step_name="Asset Allocation",
            action_url=req_url,
            intro_message=(
                f"Asset request {req.reference} has been fully approved. "
                "Please log in and allocate the specific assets to the requester now."
            ),
            action_message=(
                "Open the request using the button below, then click 'Allocate Assets' "
                "to assign assets from the registry to the requester."
            ),
            button_label="Allocate Assets Now",
        )
    except Exception:
        logger.exception("notify_asset_allocation_needed failed for request %s", request_id)


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
