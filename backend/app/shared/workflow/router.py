"""
Workflow admin router — /api/workflow

All admin endpoints require admin or super_admin role.
Approval-action endpoints (/requests/, /my-approvals, /my-requests) require
any authenticated employee.

Route ordering matters: literal paths (/groups/, /assignments/, /requests/,
/my-approvals, /my-requests) are declared BEFORE path-parameter routes
(/{workflow_id}) to prevent FastAPI matching them as workflow_ids.

Admin endpoints:
  GET    /                                   list all workflows
  POST   /                                   create workflow

  GET    /groups/                            list approver groups
  POST   /groups/                            create group
  GET    /groups/{group_id}                  group detail + members
  PATCH  /groups/{group_id}                  update group
  POST   /groups/{group_id}/members          add member (by employee_id or employee_no)
  DELETE /groups/{group_id}/members/{id}     remove member

  GET    /assignments/                       list all request_type → workflow mappings
  PUT    /assignments/                       set/update a mapping

  GET    /admin/requests/                    all requests across modules (admin)

  GET    /{workflow_id}                      workflow detail + steps
  PATCH  /{workflow_id}                      update workflow
  DELETE /{workflow_id}                      delete workflow (only if unassigned)

  PUT    /{workflow_id}/steps/reorder        reorder all steps (before /{step_id})
  POST   /{workflow_id}/steps                add step
  PATCH  /{workflow_id}/steps/{step_id}      update step
  DELETE /{workflow_id}/steps/{step_id}      delete step (remaining steps renumbered)

Employee endpoints (any authenticated user):
  GET    /my-approvals                       requests pending my approval action
  GET    /my-requests                        all requests I have raised
  POST   /requests/{approval_request_id}/approve
  POST   /requests/{approval_request_id}/reject
  POST   /requests/{approval_request_id}/return
  GET    /audit/{request_type}/{request_id}  audit trail for a source request
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.shared.dependencies import require_roles, get_current_user
from app.shared.models.user import User
from app.employees.service import get_employee_by_user_id
from app.shared.workflow import service as svc
from app.shared.workflow.schemas import (
    WorkflowCreate, WorkflowUpdate, WorkflowListItem, WorkflowDetail,
    StepCreate, StepUpdate, StepOut, ReorderSteps,
    GroupCreate, GroupUpdate, GroupListItem, GroupDetail, AddMember, MemberOut,
    AssignmentSet, AssignmentOut,
)
from app.shared.services.workflow_engine import WorkflowEngine
from app.shared.services import workflow_email

router = APIRouter()

_admin = Depends(require_roles("admin", "super_admin"))
_any_user = Depends(get_current_user)


class ActionRequest(BaseModel):
    comment: Optional[str] = None


def _employee_id(current_user: User, db: Session) -> str:
    return get_employee_by_user_id(current_user.id, db).id


# ── 1. Literal root routes ────────────────────────────────────────────────────

@router.get("", response_model=List[WorkflowListItem])
def list_workflows(
    db: Session = Depends(get_db),
    current_user: User = _admin,
):
    return svc.list_workflows(db)


@router.post("", response_model=WorkflowDetail, status_code=201)
def create_workflow(
    data: WorkflowCreate,
    db: Session = Depends(get_db),
    current_user: User = _admin,
):
    wf = svc.create_workflow(data, db)
    db.commit()
    db.refresh(wf)
    return {
        "id":               wf.id,
        "name":             wf.name,
        "description":      wf.description,
        "is_active":        wf.is_active,
        "reset_on_return":  wf.reset_on_return,
        "created_at":       wf.created_at,
        "steps":            [],
        "assignment_count": 0,
    }


# ── 2. Approver Groups (literal prefix — must be before /{workflow_id}) ────────

@router.get("/groups", response_model=List[GroupListItem])
def list_groups(
    db: Session = Depends(get_db),
    current_user: User = _admin,
):
    return svc.list_groups(db)


@router.post("/groups", response_model=GroupDetail, status_code=201)
def create_group(
    data: GroupCreate,
    db: Session = Depends(get_db),
    current_user: User = _admin,
):
    emp_id = _employee_id(current_user, db)
    g = svc.create_group(data, emp_id, db)
    db.commit()
    db.refresh(g)
    return {
        "id":          g.id,
        "name":        g.name,
        "description": g.description,
        "is_active":   g.is_active,
        "created_at":  g.created_at,
        "members":     [],
    }


@router.get("/groups/{group_id}", response_model=GroupDetail)
def get_group(
    group_id: str,
    db: Session = Depends(get_db),
    current_user: User = _admin,
):
    return svc.get_group(group_id, db)


@router.patch("/groups/{group_id}", response_model=GroupDetail)
def update_group(
    group_id: str,
    data: GroupUpdate,
    db: Session = Depends(get_db),
    current_user: User = _admin,
):
    svc.update_group(group_id, data, db)
    db.commit()
    return svc.get_group(group_id, db)


@router.post("/groups/{group_id}/members", response_model=MemberOut, status_code=201)
def add_group_member(
    group_id: str,
    data: AddMember,
    db: Session = Depends(get_db),
    current_user: User = _admin,
):
    result = svc.add_group_member(group_id, data, db)
    db.commit()
    return result


@router.delete("/groups/{group_id}/members/{member_id}", status_code=204)
def remove_group_member(
    group_id: str,
    member_id: str,
    db: Session = Depends(get_db),
    current_user: User = _admin,
):
    svc.remove_group_member(group_id, member_id, db)
    db.commit()


# ── 3. Workflow Assignments (literal prefix — must be before /{workflow_id}) ───

@router.get("/assignments", response_model=List[AssignmentOut])
def list_assignments(
    db: Session = Depends(get_db),
    current_user: User = _admin,
):
    return svc.list_assignments(db)


@router.put("/assignments", response_model=AssignmentOut)
def set_assignment(
    data: AssignmentSet,
    db: Session = Depends(get_db),
    current_user: User = _admin,
):
    emp_id = _employee_id(current_user, db)
    result = svc.set_assignment(data, emp_id, db)
    db.commit()
    return result


# ── 4a. Previous requester_pick assignments — used to pre-fill forms on resubmit ──

@router.get("/picks/{request_type}/{request_id}")
def get_requester_picks(
    request_type: str,
    request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns the requester_pick assignments from the latest approval attempt
    for this source request.  Used by request forms to pre-fill the Approvers
    section when a requester edits and resubmits a returned request.

    Response shape: { "<step_number>": { employee_id, name, job_title, department } }
    Returns {} if no previous attempt exists or no requester_pick steps.
    """
    from app.shared.models.approval import (
        ApprovalRequest, ApprovalStepAssignment,
        ApprovalWorkflow, AssigneeType,
    )
    from app.employees.models import Employee
    from sqlalchemy.orm import joinedload

    ar = (
        db.query(ApprovalRequest)
        .filter(
            ApprovalRequest.request_type == request_type,
            ApprovalRequest.request_id  == request_id,
        )
        .order_by(ApprovalRequest.attempt_number.desc())
        .first()
    )
    if not ar:
        return {}

    wf = (
        db.query(ApprovalWorkflow)
        .options(joinedload(ApprovalWorkflow.steps))
        .filter(ApprovalWorkflow.id == ar.workflow_id)
        .first()
    )
    if not wf:
        return {}

    pick_step_numbers = {
        s.step_number for s in wf.steps
        if s.assignee_type == AssigneeType.requester_pick
    }
    if not pick_step_numbers:
        return {}

    assignments = (
        db.query(ApprovalStepAssignment)
        .filter(
            ApprovalStepAssignment.approval_request_id == ar.id,
            ApprovalStepAssignment.step_number.in_(pick_step_numbers),
        )
        .all()
    )

    result = {}
    for asa in assignments:
        emp = (
            db.query(Employee)
            .options(joinedload(Employee.user))
            .filter(Employee.id == asa.assigned_to)
            .first()
        )
        if emp:
            result[str(asa.step_number)] = {
                "employee_id": emp.id,
                "name":        emp.user.full_name if emp.user else "Unknown",
                "job_title":   emp.job_title,
                "department":  emp.department.value if emp.department else None,
            }
    return result


# ── 4b. Workflow for request type — used by request forms to detect requester_pick steps ──

@router.get("/for-type/{request_type}")
def workflow_for_type(
    request_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns the active workflow + steps for a given request type.
    Used by request forms (procurement, assets, etc.) to detect requester_pick
    steps and render a picker section before submission.
    Returns null if no workflow is assigned.
    """
    from app.shared.models.approval import (
        WorkflowAssignment, ApprovalWorkflow, WorkflowStep,
        ApproverGroup, ApproverGroupMember,
    )
    from app.employees.models import Employee
    from app.shared.models.user import User as UserModel
    from sqlalchemy.orm import joinedload

    assignment = (
        db.query(WorkflowAssignment)
        .filter(WorkflowAssignment.request_type == request_type)
        .first()
    )
    if not assignment:
        return None

    wf = (
        db.query(ApprovalWorkflow)
        .options(
            joinedload(ApprovalWorkflow.steps)
            .joinedload(WorkflowStep.group)
            .joinedload(ApproverGroup.members)
            .joinedload(ApproverGroupMember.employee)
            .joinedload(Employee.user)
        )
        .filter(ApprovalWorkflow.id == assignment.workflow_id, ApprovalWorkflow.is_active == True)  # noqa: E712
        .first()
    )
    if not wf:
        return None

    sorted_steps = sorted(wf.steps, key=lambda s: s.step_number)
    return {
        "id":   wf.id,
        "name": wf.name,
        "steps": [
            {
                "step_number":   s.step_number,
                "step_name":     s.step_name,
                "assignee_type": s.assignee_type.value,
                "group_id":      s.group_id,
                "group_name":    s.group.name if s.group else None,
                # group members — only populated for requester_pick steps
                "group_members": [
                    {
                        "id":         m.employee_id,
                        "name":       m.employee.user.full_name if m.employee and m.employee.user else "—",
                        "job_title":  m.employee.job_title if m.employee else None,
                        "department": m.employee.department.value if m.employee and m.employee.department else None,
                        "avatar_url": m.employee.user.profile_picture_url if m.employee and m.employee.user else None,
                    }
                    for m in (s.group.members if s.group else [])
                ],
            }
            for s in sorted_steps
        ],
    }


# ── 5. Admin: all requests view (literal — before /{workflow_id}) ────────────

@router.get("/admin/requests")
def admin_all_requests(
    request_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = _admin,
):
    engine = WorkflowEngine(db)
    return engine.all_requests_admin(skip=skip, limit=limit, request_type=request_type, status=status)


# ── 5. Employee: my approvals & my requests (literal — before /{workflow_id}) ─

@router.get("/my-approvals")
def my_approvals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = get_employee_by_user_id(current_user.id, db)
    engine = WorkflowEngine(db)
    return engine.my_approvals(employee.id)


@router.get("/my-requests")
def my_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = get_employee_by_user_id(current_user.id, db)
    engine = WorkflowEngine(db)
    return engine.my_requests(employee.id)


# ── 6. Approval actions (literal prefix — before /{workflow_id}) ─────────────

def _update_source_status(request_type: str, request_id: str, status: str, db: Session) -> None:
    """Update the status field on the source module's request row."""
    if request_type == "procurement":
        from app.procurement.models import ProcurementRequest
        row = db.query(ProcurementRequest).filter(ProcurementRequest.id == request_id).first()
        if row:
            row.status = status


@router.post("/requests/{approval_request_id}/approve")
def approve_request(
    approval_request_id: str,
    body: ActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = get_employee_by_user_id(current_user.id, db)
    engine = WorkflowEngine(db)
    ar = engine.get_approval_request(approval_request_id)

    def on_final_approval():
        _update_source_status(ar.request_type, ar.request_id, "approved", db)

    result = engine.approve(approval_request_id, employee, body.comment, on_final_approval=on_final_approval)
    db.commit()

    # Send email after commit — failures are swallowed inside the helpers
    if result.overall_status.value == "approved":
        workflow_email.notify_request_result(db, approval_request_id, "approved", comment=body.comment)
    else:
        workflow_email.notify_step_assigned(db, approval_request_id)

    return {"id": result.id, "overall_status": result.overall_status.value, "current_step_number": result.current_step_number}


@router.post("/requests/{approval_request_id}/reject")
def reject_request(
    approval_request_id: str,
    body: ActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = get_employee_by_user_id(current_user.id, db)
    engine = WorkflowEngine(db)
    ar = engine.get_approval_request(approval_request_id)

    def on_rejected():
        _update_source_status(ar.request_type, ar.request_id, "rejected", db)

    result = engine.reject(approval_request_id, employee, body.comment, on_rejected=on_rejected)
    db.commit()
    workflow_email.notify_request_result(db, approval_request_id, "rejected", comment=body.comment)
    return {"id": result.id, "overall_status": result.overall_status.value}


@router.post("/requests/{approval_request_id}/return")
def return_request(
    approval_request_id: str,
    body: ActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = get_employee_by_user_id(current_user.id, db)
    engine = WorkflowEngine(db)
    ar = engine.get_approval_request(approval_request_id)

    def on_returned():
        _update_source_status(ar.request_type, ar.request_id, "returned", db)

    result = engine.return_(approval_request_id, employee, body.comment, on_returned=on_returned)
    db.commit()
    workflow_email.notify_request_result(db, approval_request_id, "returned", comment=body.comment)
    return {"id": result.id, "overall_status": result.overall_status.value}


# ── 7. Audit trail (literal prefix — before /{workflow_id}) ──────────────────

@router.get("/audit/{request_type}/{request_id}")
def get_audit_trail(
    request_type: str,
    request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    engine = WorkflowEngine(db)
    return engine.audit_trail(request_type, request_id)


# ── 8. Workflow detail routes (path param — after ALL literals) ───────────────

@router.get("/{workflow_id}", response_model=WorkflowDetail)
def get_workflow(
    workflow_id: str,
    db: Session = Depends(get_db),
    current_user: User = _admin,
):
    return svc.get_workflow(workflow_id, db)


@router.patch("/{workflow_id}", response_model=WorkflowDetail)
def update_workflow(
    workflow_id: str,
    data: WorkflowUpdate,
    db: Session = Depends(get_db),
    current_user: User = _admin,
):
    svc.update_workflow(workflow_id, data, db)
    db.commit()
    return svc.get_workflow(workflow_id, db)


@router.delete("/{workflow_id}", status_code=204)
def delete_workflow(
    workflow_id: str,
    db: Session = Depends(get_db),
    current_user: User = _admin,
):
    svc.delete_workflow(workflow_id, db)
    db.commit()


# ── 5. Steps (reorder must be before /{step_id}) ─────────────────────────────

@router.put("/{workflow_id}/steps/reorder", response_model=List[StepOut])
def reorder_steps(
    workflow_id: str,
    data: ReorderSteps,
    db: Session = Depends(get_db),
    current_user: User = _admin,
):
    result = svc.reorder_steps(workflow_id, data, db)
    db.commit()
    return result


@router.post("/{workflow_id}/steps", response_model=StepOut, status_code=201)
def add_step(
    workflow_id: str,
    data: StepCreate,
    db: Session = Depends(get_db),
    current_user: User = _admin,
):
    result = svc.add_step(workflow_id, data, db)
    db.commit()
    return result


@router.patch("/{workflow_id}/steps/{step_id}", response_model=StepOut)
def update_step(
    workflow_id: str,
    step_id: str,
    data: StepUpdate,
    db: Session = Depends(get_db),
    current_user: User = _admin,
):
    result = svc.update_step(workflow_id, step_id, data, db)
    db.commit()
    return result


@router.delete("/{workflow_id}/steps/{step_id}", status_code=204)
def delete_step(
    workflow_id: str,
    step_id: str,
    db: Session = Depends(get_db),
    current_user: User = _admin,
):
    svc.delete_step(workflow_id, step_id, db)
    db.commit()
