"""
WorkflowEngine — the shared approval runtime.

Called by each module when a request enters the approval lifecycle:

    engine = WorkflowEngine(db)
    approval_req = engine.start(
        request_type="procurement",
        request_id=req.id,
        title="Office Supplies — PRQ-0042",
        requester=employee,
    )
    db.commit()

Approve / reject / return come from the /api/workflow/requests/{id}/… endpoints,
which are the single entry-point used by the My Approvals page.

All DB writes happen inside the caller's transaction.
Email notifications (if any) should be sent AFTER commit.
"""

import uuid
import logging
from datetime import datetime, date
from typing import Callable

from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException

from app.shared.models.approval import (
    ApprovalRequest,
    ApprovalStepAssignment,
    ApprovalHistory,
    WorkflowAuditTrail,
    AllRequest,
    ApprovalWorkflow,
    WorkflowStep,
    WorkflowAssignment,
    ApprovalOverallStatus,
    ApprovalHistoryAction,
    AuditAction,
    AllRequestStatus,
    NotificationType,
    AssigneeType,
)
from app.core.datetime_utils import utc_isoformat
from app.employees.models import Employee
from app.shared.services import notification_service

logger = logging.getLogger(__name__)


# ── Assignee Resolver ─────────────────────────────────────────────────────────

def _resolve_assignee(
    step: WorkflowStep,
    requester: Employee,
    db: Session,
    picked_approvers: dict[int, str] | None = None,
) -> str:
    """
    Returns the employee_id of the resolved approver for this step.
    Raises HTTP 422 if the assignee cannot be resolved.
    """
    atype = step.assignee_type

    if atype == AssigneeType.specific:
        if not step.employee_id:
            raise HTTPException(422, f"Step '{step.step_name}': no specific employee configured")
        return step.employee_id

    if atype == AssigneeType.role:
        if not step.role:
            raise HTTPException(422, f"Step '{step.step_name}': no role configured")
        from app.shared.models.user import User
        emp = (
            db.query(Employee)
            .join(Employee.user)
            .filter(User.role == step.role)
            .first()
        )
        if not emp:
            raise HTTPException(
                422,
                f"Step '{step.step_name}': no active employee found with role '{step.role}'. "
                "Ask an admin to assign a user with that role.",
            )
        return emp.id

    if atype == AssigneeType.requester_pick:
        if picked_approvers and step.step_number in picked_approvers:
            return picked_approvers[step.step_number]
        raise HTTPException(
            422,
            f"Step '{step.step_name}' requires you to pick an approver. "
            "Pass picked_approvers={{step_number: employee_id}}.",
        )

    if atype == AssigneeType.requester_operations_manager:
        if not requester.operating_manager_id:
            raise HTTPException(
                422,
                "You do not have an operations manager assigned. Contact HR before submitting.",
            )
        return requester.operating_manager_id

    if atype == AssigneeType.requester_skip_level:
        if not requester.operating_manager_id:
            raise HTTPException(422, "You do not have an operations manager assigned. Contact HR.")
        mgr = db.query(Employee).filter(Employee.id == requester.operating_manager_id).first()
        if not mgr or not mgr.operating_manager_id:
            raise HTTPException(
                422,
                "Your operations manager does not have a skip-level manager assigned. Contact HR.",
            )
        return mgr.operating_manager_id

    if atype == AssigneeType.requester_hod:
        # HOD = top of the requester's management chain (manager with no manager above)
        if not requester.operating_manager_id:
            raise HTTPException(422, "You do not have an operations manager assigned. Contact HR.")
        current_id = requester.operating_manager_id
        hod_id = current_id
        seen: set[str] = set()
        while current_id and current_id not in seen:
            seen.add(current_id)
            mgr = db.query(Employee).filter(Employee.id == current_id).first()
            if not mgr:
                break
            if mgr.operating_manager_id:
                hod_id = mgr.operating_manager_id
                current_id = mgr.operating_manager_id
            else:
                hod_id = mgr.id
                break
        return hod_id

    raise HTTPException(500, f"Unknown assignee_type: {atype}")


# ── Reference generator ───────────────────────────────────────────────────────

_REQUEST_TYPE_PREFIX = {
    "procurement":    "REQ-PROC",
    "asset":          "REQ-ASSET",
    "leave":          "REQ-LEAVE",
    "work_initiation":    "REQ-WI",
    "work_authorization": "REQ-WA",
    "work_closeout":      "REQ-WC",
}


def _next_all_request_reference(request_type: str, db: Session) -> str:
    from app.shared.utils.helpers import generate_reference
    prefix = _REQUEST_TYPE_PREFIX.get(request_type, "REQ")
    return generate_reference(prefix, db, AllRequest, AllRequest.reference)


# ── WorkflowEngine ─────────────────────────────────────────────────────────────

class WorkflowEngine:
    def __init__(self, db: Session):
        self.db = db

    # ── Internal helpers ───────────────────────────────────────────────────────

    def _get_active_workflow(self, request_type: str) -> ApprovalWorkflow:
        assignment = (
            self.db.query(WorkflowAssignment)
            .filter(WorkflowAssignment.request_type == request_type)
            .first()
        )
        if not assignment:
            raise HTTPException(
                422,
                f"No workflow is assigned for '{request_type}' requests. "
                "Ask an admin to configure it under Workflow Assignments.",
            )
        wf = (
            self.db.query(ApprovalWorkflow)
            .options(joinedload(ApprovalWorkflow.steps))
            .filter(
                ApprovalWorkflow.id == assignment.workflow_id,
                ApprovalWorkflow.is_active == True,  # noqa: E712
            )
            .first()
        )
        if not wf:
            raise HTTPException(422, "The assigned workflow is inactive. Ask an admin to activate it.")
        if not wf.steps:
            raise HTTPException(422, "The assigned workflow has no steps. Ask an admin to add steps.")
        return wf

    def _get_approval_request(self, approval_request_id: str) -> ApprovalRequest:
        req = (
            self.db.query(ApprovalRequest)
            .options(
                joinedload(ApprovalRequest.workflow).joinedload(ApprovalWorkflow.steps)
            )
            .filter(ApprovalRequest.id == approval_request_id)
            .first()
        )
        if not req:
            raise HTTPException(404, "Approval request not found")
        return req

    def get_approval_request(self, approval_request_id: str) -> ApprovalRequest:
        """Public accessor used by router endpoints."""
        return self._get_approval_request(approval_request_id)

    def _current_step(self, approval_req: ApprovalRequest) -> WorkflowStep | None:
        return next(
            (s for s in approval_req.workflow.steps if s.step_number == approval_req.current_step_number),
            None,
        )

    def _create_step_assignment(
        self, approval_request_id: str, step_number: int, assignee_id: str
    ) -> None:
        self.db.add(ApprovalStepAssignment(
            id=str(uuid.uuid4()),
            approval_request_id=approval_request_id,
            step_number=step_number,
            assigned_to=assignee_id,
        ))

    def _audit(
        self,
        workflow_id: str,
        request_id: str,
        request_type: str,
        actor_id: str,
        actor_role: str | None,
        action: AuditAction,
        step_number: int | None = None,
        comment: str | None = None,
    ) -> None:
        self.db.add(WorkflowAuditTrail(
            id=str(uuid.uuid4()),
            workflow_id=workflow_id,
            request_id=request_id,
            request_type=request_type,
            actor_id=actor_id,
            actor_role=actor_role,
            step_number=step_number,
            action=action,
            comment=comment,
        ))

    def _check_actor_is_assigned(
        self, approval_req: ApprovalRequest, actor: Employee
    ) -> ApprovalStepAssignment:
        assignment = (
            self.db.query(ApprovalStepAssignment)
            .filter(
                ApprovalStepAssignment.approval_request_id == approval_req.id,
                ApprovalStepAssignment.step_number == approval_req.current_step_number,
            )
            .first()
        )
        if not assignment or assignment.assigned_to != actor.id:
            raise HTTPException(403, "You are not the assigned approver for this step")
        return assignment

    def _update_all_requests_status(
        self, request_type: str, request_id: str, status: AllRequestStatus
    ) -> None:
        row = (
            self.db.query(AllRequest)
            .filter(
                AllRequest.request_type == request_type,
                AllRequest.request_id == request_id,
            )
            .first()
        )
        if row:
            row.status = status

    # ── Public API ─────────────────────────────────────────────────────────────

    def start(
        self,
        request_type: str,
        request_id: str,
        title: str,
        requester: Employee,
        picked_approvers: dict[int, str] | None = None,
    ) -> ApprovalRequest:
        """
        Called when a request is submitted (draft → pending).

        Creates the approval_request row, resolves step 1 assignee,
        creates the step assignment, sends a notification to the step 1
        approver, writes the audit trail, and creates/updates the
        all_requests row.

        picked_approvers: {step_number: employee_id} — required for any
        steps whose assignee_type is 'requester_pick'.
        """
        wf = self._get_active_workflow(request_type)
        sorted_steps = sorted(wf.steps, key=lambda s: s.step_number)
        first_step = sorted_steps[0]

        assignee_id = _resolve_assignee(first_step, requester, self.db, picked_approvers)

        # Upsert all_requests row
        all_req = (
            self.db.query(AllRequest)
            .filter(
                AllRequest.request_type == request_type,
                AllRequest.request_id == request_id,
            )
            .first()
        )
        if all_req:
            all_req.status = AllRequestStatus.pending
        else:
            reference = _next_all_request_reference(request_type, self.db)
            all_req = AllRequest(
                id=str(uuid.uuid4()),
                reference=reference,
                request_type=request_type,
                request_id=request_id,
                title=title,
                raised_by=requester.id,
                department=requester.department_rel.name if requester.department_rel else None,
                status=AllRequestStatus.pending,
            )
            self.db.add(all_req)

        # Determine attempt number (resubmit gets a new row)
        last_attempt = (
            self.db.query(ApprovalRequest)
            .filter(
                ApprovalRequest.request_type == request_type,
                ApprovalRequest.request_id == request_id,
            )
            .order_by(ApprovalRequest.attempt_number.desc())
            .first()
        )
        attempt_number = (last_attempt.attempt_number + 1) if last_attempt else 1

        approval_req = ApprovalRequest(
            id=str(uuid.uuid4()),
            workflow_id=wf.id,
            request_type=request_type,
            request_id=request_id,
            submitted_by=requester.id,
            current_step_number=first_step.step_number,
            overall_status=ApprovalOverallStatus.pending,
            attempt_number=attempt_number,
        )
        self.db.add(approval_req)
        self.db.flush()  # get approval_req.id

        all_req.approval_request_id = approval_req.id

        self._create_step_assignment(approval_req.id, first_step.step_number, assignee_id)

        # Pre-create assignments for any requester_pick steps beyond step 1.
        # These are picked by the requester at submission and must be stored now
        # because picked_approvers won't be available when the engine advances later.
        if picked_approvers:
            for step in sorted_steps[1:]:
                if step.assignee_type == AssigneeType.requester_pick:
                    pid = picked_approvers.get(step.step_number)
                    if pid:
                        self._create_step_assignment(approval_req.id, step.step_number, pid)

        notification_service.create_notification(
            db=self.db,
            recipient_id=assignee_id,
            type=NotificationType.approval_required,
            title="Approval Required",
            message=(
                f"A {request_type} request requires your approval: \"{title}\" "
                f"(Step {first_step.step_number}: {first_step.step_name})."
            ),
            reference_type=request_type,
            reference_id=request_id,
        )

        # Notify the requester that their submission is now in the approval queue
        notification_service.create_notification(
            db=self.db,
            recipient_id=requester.id,
            type=NotificationType.approval_required,
            title="Request Submitted",
            message=(
                f"Your {request_type} request \"{title}\" has been submitted "
                f"and is pending approval at Step {first_step.step_number}: {first_step.step_name}."
            ),
            reference_type=request_type,
            reference_id=request_id,
        )

        self._audit(
            workflow_id=wf.id,
            request_id=request_id,
            request_type=request_type,
            actor_id=requester.id,
            actor_role="requester",
            action=AuditAction.submitted,
        )

        return approval_req

    def approve(
        self,
        approval_request_id: str,
        actor: Employee,
        comment: str | None = None,
        on_final_approval: Callable[[], None] | None = None,
    ) -> ApprovalRequest:
        """
        Actor approves the current step.
        - If more steps remain: advances to next step, notifies next approver.
        - If this is the last step: marks the overall request approved,
          updates all_requests, notifies the requester, calls on_final_approval().

        on_final_approval: callback for the source module to update its own status field.
        """
        approval_req = self._get_approval_request(approval_request_id)

        if approval_req.overall_status != ApprovalOverallStatus.pending:
            raise HTTPException(409, f"This request is already {approval_req.overall_status.value}")

        self._check_actor_is_assigned(approval_req, actor)
        current_step = self._current_step(approval_req)
        if not current_step:
            raise HTTPException(500, "Could not locate current step in workflow")

        self.db.add(ApprovalHistory(
            id=str(uuid.uuid4()),
            approval_request_id=approval_req.id,
            step_number=approval_req.current_step_number,
            actor_id=actor.id,
            action=ApprovalHistoryAction.approved,
            comment=comment,
        ))
        self._audit(
            workflow_id=approval_req.workflow_id,
            request_id=approval_req.request_id,
            request_type=approval_req.request_type,
            actor_id=actor.id,
            actor_role=current_step.step_name,
            action=AuditAction.approved,
            step_number=approval_req.current_step_number,
            comment=comment,
        )

        sorted_steps = sorted(approval_req.workflow.steps, key=lambda s: s.step_number)
        next_step = next(
            (s for s in sorted_steps if s.step_number > approval_req.current_step_number),
            None,
        )

        if next_step:
            approval_req.current_step_number = next_step.step_number
            # Check for a pre-created assignment (e.g. requester_pick pre-resolved at submission)
            pre_assigned = (
                self.db.query(ApprovalStepAssignment)
                .filter(
                    ApprovalStepAssignment.approval_request_id == approval_req.id,
                    ApprovalStepAssignment.step_number == next_step.step_number,
                )
                .first()
            )
            if pre_assigned:
                next_assignee_id = pre_assigned.assigned_to
            else:
                requester = (
                    self.db.query(Employee)
                    .filter(Employee.id == approval_req.submitted_by)
                    .first()
                )
                next_assignee_id = _resolve_assignee(next_step, requester, self.db)
                self._create_step_assignment(approval_req.id, next_step.step_number, next_assignee_id)

            notification_service.create_notification(
                db=self.db,
                recipient_id=next_assignee_id,
                type=NotificationType.approval_required,
                title="Approval Required",
                message=(
                    f"A {approval_req.request_type} request requires your approval "
                    f"(Step {next_step.step_number}: {next_step.step_name})."
                ),
                reference_type=approval_req.request_type,
                reference_id=approval_req.request_id,
            )

            # Notify the requester of mid-flow progress
            requester_emp_mid = (
                self.db.query(Employee)
                .filter(Employee.id == approval_req.submitted_by)
                .first()
            )
            if requester_emp_mid:
                notification_service.create_notification(
                    db=self.db,
                    recipient_id=requester_emp_mid.id,
                    type=NotificationType.approval_required,
                    title="Request Update",
                    message=(
                        f"Your {approval_req.request_type} request has been approved at "
                        f"Step {current_step.step_number} ({current_step.step_name}) "
                        f"and is now pending Step {next_step.step_number}: {next_step.step_name}."
                    ),
                    reference_type=approval_req.request_type,
                    reference_id=approval_req.request_id,
                )
        else:
            # Final step approved — workflow complete
            approval_req.overall_status = ApprovalOverallStatus.approved
            self._update_all_requests_status(
                approval_req.request_type, approval_req.request_id, AllRequestStatus.approved
            )

            requester_emp = (
                self.db.query(Employee)
                .filter(Employee.id == approval_req.submitted_by)
                .first()
            )
            if requester_emp:
                notification_service.create_notification(
                    db=self.db,
                    recipient_id=requester_emp.id,
                    type=NotificationType.approved,
                    title="Request Approved",
                    message=f"Your {approval_req.request_type} request has been fully approved.",
                    reference_type=approval_req.request_type,
                    reference_id=approval_req.request_id,
                )

            if on_final_approval:
                on_final_approval()

        return approval_req

    def reject(
        self,
        approval_request_id: str,
        actor: Employee,
        comment: str | None = None,
        on_rejected: Callable[[], None] | None = None,
    ) -> ApprovalRequest:
        """
        Reject the request — terminal state; requester cannot resubmit.
        Notifies the requester. Calls on_rejected() so the source module
        can update its own status field.
        """
        approval_req = self._get_approval_request(approval_request_id)

        if approval_req.overall_status != ApprovalOverallStatus.pending:
            raise HTTPException(409, f"This request is already {approval_req.overall_status.value}")

        self._check_actor_is_assigned(approval_req, actor)
        current_step = self._current_step(approval_req)
        if not current_step:
            raise HTTPException(500, "Could not locate current step in workflow")

        self.db.add(ApprovalHistory(
            id=str(uuid.uuid4()),
            approval_request_id=approval_req.id,
            step_number=approval_req.current_step_number,
            actor_id=actor.id,
            action=ApprovalHistoryAction.rejected,
            comment=comment,
        ))
        self._audit(
            workflow_id=approval_req.workflow_id,
            request_id=approval_req.request_id,
            request_type=approval_req.request_type,
            actor_id=actor.id,
            actor_role=current_step.step_name,
            action=AuditAction.rejected,
            step_number=approval_req.current_step_number,
            comment=comment,
        )

        approval_req.overall_status = ApprovalOverallStatus.rejected
        self._update_all_requests_status(
            approval_req.request_type, approval_req.request_id, AllRequestStatus.rejected
        )

        requester_emp = (
            self.db.query(Employee)
            .filter(Employee.id == approval_req.submitted_by)
            .first()
        )
        if requester_emp:
            notification_service.create_notification(
                db=self.db,
                recipient_id=requester_emp.id,
                type=NotificationType.rejected,
                title="Request Rejected",
                message=(
                    f"Your {approval_req.request_type} request has been rejected."
                    + (f" Reason: {comment}" if comment else "")
                ),
                reference_type=approval_req.request_type,
                reference_id=approval_req.request_id,
            )

        if on_rejected:
            on_rejected()

        return approval_req

    def return_(
        self,
        approval_request_id: str,
        actor: Employee,
        comment: str | None = None,
        on_returned: Callable[[], None] | None = None,
    ) -> ApprovalRequest:
        """
        Return the request to the requester for revision.
        The requester can resubmit (which creates a new ApprovalRequest row
        with attempt_number+1). All prior rows are kept for history.
        Calls on_returned() so the source module can update its own status field.
        """
        approval_req = self._get_approval_request(approval_request_id)

        if approval_req.overall_status != ApprovalOverallStatus.pending:
            raise HTTPException(409, f"This request is already {approval_req.overall_status.value}")

        self._check_actor_is_assigned(approval_req, actor)
        current_step = self._current_step(approval_req)
        if not current_step:
            raise HTTPException(500, "Could not locate current step in workflow")

        self.db.add(ApprovalHistory(
            id=str(uuid.uuid4()),
            approval_request_id=approval_req.id,
            step_number=approval_req.current_step_number,
            actor_id=actor.id,
            action=ApprovalHistoryAction.returned,
            comment=comment,
        ))
        self._audit(
            workflow_id=approval_req.workflow_id,
            request_id=approval_req.request_id,
            request_type=approval_req.request_type,
            actor_id=actor.id,
            actor_role=current_step.step_name,
            action=AuditAction.returned,
            step_number=approval_req.current_step_number,
            comment=comment,
        )

        approval_req.overall_status = ApprovalOverallStatus.returned
        self._update_all_requests_status(
            approval_req.request_type, approval_req.request_id, AllRequestStatus.returned
        )

        requester_emp = (
            self.db.query(Employee)
            .filter(Employee.id == approval_req.submitted_by)
            .first()
        )
        if requester_emp:
            notification_service.create_notification(
                db=self.db,
                recipient_id=requester_emp.id,
                type=NotificationType.returned,
                title="Request Returned for Revision",
                message=(
                    f"Your {approval_req.request_type} request has been returned for revision."
                    + (f" Comment: {comment}" if comment else "")
                    + " You may edit and resubmit it."
                ),
                reference_type=approval_req.request_type,
                reference_id=approval_req.request_id,
            )

        if on_returned:
            on_returned()

        return approval_req

    # ── Query helpers (used by /my-approvals and /my-requests endpoints) ──────

    def my_approvals(self, employee_id: str) -> list[dict]:
        """
        Returns all approval_requests where the current step is assigned to
        this employee and the overall status is still pending.
        """
        rows = (
            self.db.query(ApprovalStepAssignment)
            .join(
                ApprovalRequest,
                ApprovalRequest.id == ApprovalStepAssignment.approval_request_id,
            )
            .filter(
                ApprovalStepAssignment.assigned_to == employee_id,
                ApprovalRequest.overall_status == ApprovalOverallStatus.pending,
                ApprovalRequest.current_step_number == ApprovalStepAssignment.step_number,
            )
            .all()
        )

        result = []
        for asa in rows:
            ar = self.db.query(ApprovalRequest).filter(ApprovalRequest.id == asa.approval_request_id).first()
            if not ar:
                continue
            all_req = (
                self.db.query(AllRequest)
                .filter(
                    AllRequest.request_type == ar.request_type,
                    AllRequest.request_id == ar.request_id,
                )
                .first()
            )
            result.append({
                "approval_request_id": ar.id,
                "request_type":        ar.request_type,
                "request_id":          ar.request_id,
                "reference":           all_req.reference if all_req else None,
                "title":               all_req.title if all_req else None,
                "department":          all_req.department if all_req else None,
                "current_step_number": ar.current_step_number,
                "attempt_number":      ar.attempt_number,
                "submitted_at":        utc_isoformat(ar.created_at),
            })
        return result

    def my_requests(self, employee_id: str) -> list[dict]:
        """
        Returns all all_requests rows raised by this employee, newest first.
        """
        rows = (
            self.db.query(AllRequest)
            .filter(AllRequest.raised_by == employee_id)
            .order_by(AllRequest.created_at.desc())
            .all()
        )
        result = []
        for row in rows:
            result.append({
                "id":                  row.id,
                "reference":           row.reference,
                "request_type":        row.request_type,
                "request_id":          row.request_id,
                "title":               row.title,
                "status":              row.status.value,
                "department":          row.department,
                "approval_request_id": row.approval_request_id,
                "created_at":          utc_isoformat(row.created_at),
                "updated_at":          utc_isoformat(row.updated_at),
            })
        return result

    def all_requests_admin(
        self,
        skip: int = 0,
        limit: int = 50,
        request_type: str | None = None,
        status: str | None = None,
    ) -> list[dict]:
        """Admin view: all requests across all modules."""
        q = self.db.query(AllRequest)
        if request_type:
            q = q.filter(AllRequest.request_type == request_type)
        if status:
            q = q.filter(AllRequest.status == status)
        rows = q.order_by(AllRequest.created_at.desc()).offset(skip).limit(limit).all()

        result = []
        for row in rows:
            raiser = row.raiser
            result.append({
                "id":                  row.id,
                "reference":           row.reference,
                "request_type":        row.request_type,
                "request_id":          row.request_id,
                "title":               row.title,
                "status":              row.status.value,
                "department":          row.department,
                "raised_by_name":      raiser.user.full_name if raiser and raiser.user else None,
                "raised_by_no":        raiser.employee_no if raiser else None,
                "approval_request_id": row.approval_request_id,
                "created_at":          utc_isoformat(row.created_at),
            })
        return result

    def audit_trail(self, request_type: str, request_id: str) -> list[dict]:
        """Return the full audit trail for a specific source request."""
        rows = (
            self.db.query(WorkflowAuditTrail)
            .filter(
                WorkflowAuditTrail.request_type == request_type,
                WorkflowAuditTrail.request_id == request_id,
            )
            .order_by(WorkflowAuditTrail.acted_at.asc())
            .all()
        )
        result = []
        for row in rows:
            actor = row.actor
            result.append({
                "id":          row.id,
                "action":      row.action.value,
                "actor_name":  actor.user.full_name if actor and actor.user else None,
                "actor_role":  row.actor_role,
                "step_number": row.step_number,
                "comment":     row.comment,
                "acted_at":    utc_isoformat(row.acted_at),
            })
        return result
