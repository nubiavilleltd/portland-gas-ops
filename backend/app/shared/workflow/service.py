"""
Workflow admin service — CRUD for workflows, steps, and assignments.

Groups have been moved to app.setups.service (Phase 1 migration).
WorkflowEngine (the runtime that runs requests through steps) lives in workflow_engine.py.
"""

import uuid
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from fastapi import HTTPException, status

from app.shared.models.approval import (
    ApprovalWorkflow,
    WorkflowStep,
    WorkflowAssignment,
)
from app.employees.models import Employee
from app.setups.models import Group
from app.shared.models.user import User
from app.shared.workflow.schemas import (
    WorkflowCreate, WorkflowUpdate,
    StepCreate, StepUpdate, ReorderSteps,
    AssignmentSet,
)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_workflow_or_404(workflow_id: str, db: Session, workspace_id: str) -> ApprovalWorkflow:
    wf = (
        db.query(ApprovalWorkflow)
        .filter(
            ApprovalWorkflow.id == workflow_id,
            ApprovalWorkflow.workspace_id == workspace_id,
        )
        .first()
    )
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return wf


def _get_step_or_404(workflow_id: str, step_id: str, db: Session, workspace_id: str) -> WorkflowStep:
    step = (
        db.query(WorkflowStep)
        .join(ApprovalWorkflow, WorkflowStep.workflow_id == ApprovalWorkflow.id)
        .filter(WorkflowStep.id == step_id, WorkflowStep.workflow_id == workflow_id)
        .filter(ApprovalWorkflow.workspace_id == workspace_id)
        .first()
    )
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")
    return step


def _count_assignments(workflow_id: str, db: Session, workspace_id: str) -> int:
    return (
        db.query(WorkflowAssignment)
        .filter(
            WorkflowAssignment.workflow_id == workflow_id,
            WorkflowAssignment.workspace_id == workspace_id,
        )
        .count()
    )


def _renumber_steps(workflow_id: str, db: Session) -> None:
    """After a delete, reassign step_number 1..N in order."""
    steps = (
        db.query(WorkflowStep)
        .filter(WorkflowStep.workflow_id == workflow_id)
        .order_by(WorkflowStep.step_number)
        .all()
    )
    for i, step in enumerate(steps, start=1):
        step.step_number = i


def _validate_role_uniqueness(role: str, db: Session, workspace_id: str) -> None:
    """Warn admin if a role value resolves to more than one active employee."""
    count = (
        db.query(func.count(Employee.id))
        .join(Employee.user)
        .filter(User.role == role, Employee.workspace_id == workspace_id)
        .scalar()
    )
    if count and count > 1:
        raise HTTPException(
            status_code=422,
            detail=(
                f"The role '{role}' matches {count} employees. "
                "Use assignee_type='specific' to pick one person, or "
                "use assignee_type='requester_pick' with an approver group."
            ),
        )


def _build_step_out(step: WorkflowStep) -> dict:
    """Attach resolved display names to a step for the response."""
    out = {
        "id":            step.id,
        "workflow_id":   step.workflow_id,
        "step_number":   step.step_number,
        "step_name":     step.step_name,
        "assignee_type": step.assignee_type,
        "role":          step.role,
        "employee_id":   step.employee_id,
        "group_id":      step.group_id,
        "can_approve":   step.can_approve,
        "can_reject":    step.can_reject,
        "can_return":    step.can_return,
        "created_at":    step.created_at,
        "employee_name": step.employee.user.full_name if step.employee and step.employee.user else None,
        "group_name":    step.group.name if step.group else None,
    }
    return out


# ── Workflows ──────────────────────────────────────────────────────────────────

def list_workflows(db: Session, workspace_id: str) -> list:
    workflows = (
        db.query(ApprovalWorkflow)
        .filter(ApprovalWorkflow.workspace_id == workspace_id)
        .order_by(ApprovalWorkflow.created_at.desc())
        .all()
    )
    result = []
    for wf in workflows:
        result.append({
            "id":               wf.id,
            "name":             wf.name,
            "description":      wf.description,
            "is_active":        wf.is_active,
            "reset_on_return":  wf.reset_on_return,
            "step_count":       len(wf.steps),
            "assignment_count": _count_assignments(wf.id, db, workspace_id),
            "created_at":       wf.created_at,
        })
    return result


def create_workflow(data: WorkflowCreate, db: Session, workspace_id: str) -> ApprovalWorkflow:
    duplicate = (
        db.query(ApprovalWorkflow.id)
        .filter(
            ApprovalWorkflow.workspace_id == workspace_id,
            ApprovalWorkflow.name == data.name,
        )
        .first()
    )
    if duplicate:
        raise HTTPException(status_code=409, detail="A workflow with this name already exists in this workspace")

    wf = ApprovalWorkflow(
        id=str(uuid.uuid4()),
        workspace_id=workspace_id,
        name=data.name,
        description=data.description,
        is_active=True,
        reset_on_return=data.reset_on_return,
    )
    db.add(wf)
    return wf


def get_workflow(workflow_id: str, db: Session, workspace_id: str) -> dict:
    wf = (
        db.query(ApprovalWorkflow)
        .options(
            joinedload(ApprovalWorkflow.steps)
            .joinedload(WorkflowStep.employee)
            .joinedload(Employee.user),
            joinedload(ApprovalWorkflow.steps)
            .joinedload(WorkflowStep.group),
        )
        .filter(
            ApprovalWorkflow.id == workflow_id,
            ApprovalWorkflow.workspace_id == workspace_id,
        )
        .first()
    )
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")

    sorted_steps = sorted(wf.steps, key=lambda s: s.step_number)
    return {
        "id":               wf.id,
        "name":             wf.name,
        "description":      wf.description,
        "is_active":        wf.is_active,
        "reset_on_return":  wf.reset_on_return,
        "created_at":       wf.created_at,
        "assignment_count": _count_assignments(wf.id, db, workspace_id),
        "steps":            [_build_step_out(s) for s in sorted_steps],
    }


def update_workflow(workflow_id: str, data: WorkflowUpdate, db: Session, workspace_id: str) -> ApprovalWorkflow:
    wf = _get_workflow_or_404(workflow_id, db, workspace_id)
    if data.name is not None:
        duplicate = (
            db.query(ApprovalWorkflow.id)
            .filter(
                ApprovalWorkflow.workspace_id == workspace_id,
                ApprovalWorkflow.name == data.name,
                ApprovalWorkflow.id != workflow_id,
            )
            .first()
        )
        if duplicate:
            raise HTTPException(status_code=409, detail="A workflow with this name already exists in this workspace")
        wf.name = data.name
    if data.description is not None:
        wf.description = data.description
    if data.is_active is not None:
        wf.is_active = data.is_active
    if data.reset_on_return is not None:
        wf.reset_on_return = data.reset_on_return
    return wf


def delete_workflow(workflow_id: str, db: Session, workspace_id: str) -> None:
    wf = _get_workflow_or_404(workflow_id, db, workspace_id)
    if _count_assignments(workflow_id, db, workspace_id) > 0:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete a workflow that is assigned to a request type. Remove the assignment first.",
        )
    db.delete(wf)


# ── Steps ─────────────────────────────────────────────────────────────────────

def add_step(workflow_id: str, data: StepCreate, db: Session, workspace_id: str) -> dict:
    _get_workflow_or_404(workflow_id, db, workspace_id)

    # Validate role uniqueness
    if data.assignee_type.value == "role" and data.role:
        _validate_role_uniqueness(data.role, db, workspace_id)

    if data.assignee_type.value == "specific":
        employee = (
            db.query(Employee.id)
            .filter(Employee.id == data.employee_id, Employee.workspace_id == workspace_id)
            .first()
        )
        if not employee:
            raise HTTPException(status_code=422, detail="The selected employee is not in this workspace")
    if data.assignee_type.value == "requester_pick":
        group = (
            db.query(Group.id)
            .filter(Group.id == data.group_id, Group.workspace_id == workspace_id)
            .first()
        )
        if not group:
            raise HTTPException(status_code=422, detail="The selected approver group is not in this workspace")

    # Auto-number: max existing + 1
    max_num = (
        db.query(func.max(WorkflowStep.step_number))
        .filter(WorkflowStep.workflow_id == workflow_id)
        .scalar()
    ) or 0

    step = WorkflowStep(
        id=str(uuid.uuid4()),
        workflow_id=workflow_id,
        step_number=max_num + 1,
        step_name=data.step_name,
        assignee_type=data.assignee_type,
        role=data.role if data.assignee_type.value == "role" else None,
        employee_id=data.employee_id if data.assignee_type.value == "specific" else None,
        group_id=data.group_id if data.assignee_type.value == "requester_pick" else None,
        can_approve=data.can_approve,
        can_reject=data.can_reject,
        can_return=data.can_return,
    )
    db.add(step)
    db.flush()  # populate step.id before eagerly loading joins

    # Reload with joins for response
    db.refresh(step)
    return _build_step_out(step)


def update_step(workflow_id: str, step_id: str, data: StepUpdate, db: Session, workspace_id: str) -> dict:
    step = _get_step_or_404(workflow_id, step_id, db, workspace_id)

    if data.assignee_type is not None:
        step.assignee_type = data.assignee_type
        # Clear fields that don't apply to the new type
        step.role        = None
        step.employee_id = None
        step.group_id    = None

    if data.role is not None:
        if data.assignee_type and data.assignee_type.value == "role":
            _validate_role_uniqueness(data.role, db, workspace_id)
        step.role = data.role

    if data.employee_id is not None:
        employee = (
            db.query(Employee.id)
            .filter(Employee.id == data.employee_id, Employee.workspace_id == workspace_id)
            .first()
        )
        if not employee:
            raise HTTPException(status_code=422, detail="The selected employee is not in this workspace")
        step.employee_id = data.employee_id

    if data.group_id is not None:
        group = (
            db.query(Group.id)
            .filter(Group.id == data.group_id, Group.workspace_id == workspace_id)
            .first()
        )
        if not group:
            raise HTTPException(status_code=422, detail="The selected approver group is not in this workspace")
        step.group_id = data.group_id

    if data.step_name is not None:
        step.step_name = data.step_name

    if data.can_approve is not None:
        step.can_approve = data.can_approve
    if data.can_reject is not None:
        step.can_reject = data.can_reject
    if data.can_return is not None:
        step.can_return = data.can_return

    db.flush()
    db.refresh(step)
    return _build_step_out(step)


def delete_step(workflow_id: str, step_id: str, db: Session, workspace_id: str) -> None:
    step = _get_step_or_404(workflow_id, step_id, db, workspace_id)
    db.delete(step)
    db.flush()
    _renumber_steps(workflow_id, db)


def reorder_steps(workflow_id: str, data: ReorderSteps, db: Session, workspace_id: str) -> list:
    _get_workflow_or_404(workflow_id, db, workspace_id)

    steps = (
        db.query(WorkflowStep)
        .filter(WorkflowStep.workflow_id == workflow_id)
        .all()
    )
    step_map = {s.id: s for s in steps}

    # Validate all IDs belong to this workflow
    for sid in data.step_ids:
        if sid not in step_map:
            raise HTTPException(status_code=422, detail=f"Step {sid} not found in this workflow")

    if len(data.step_ids) != len(steps):
        raise HTTPException(status_code=422, detail="step_ids must include every step in the workflow")

    for i, sid in enumerate(data.step_ids, start=1):
        step_map[sid].step_number = i

    db.flush()
    return [_build_step_out(step_map[sid]) for sid in data.step_ids]


# ── Workflow Assignments ───────────────────────────────────────────────────────

def list_assignments(db: Session, workspace_id: str) -> list:
    assignments = (
        db.query(WorkflowAssignment)
        .options(joinedload(WorkflowAssignment.workflow))
        .filter(WorkflowAssignment.workspace_id == workspace_id)
        .all()
    )
    return [
        {
            "id":            a.id,
            "request_type":  a.request_type,
            "workflow_id":   a.workflow_id,
            "workflow_name": a.workflow.name if a.workflow else "—",
            "is_active":     a.is_active,
            "updated_at":    a.updated_at,
        }
        for a in assignments
    ]


def set_assignment(data: AssignmentSet, actor_employee_id: str, db: Session, workspace_id: str) -> dict:
    # Validate workflow exists and is active
    wf = db.query(ApprovalWorkflow).filter(
        ApprovalWorkflow.id == data.workflow_id,
        ApprovalWorkflow.is_active == True,  # noqa: E712
        ApprovalWorkflow.workspace_id == workspace_id,
    ).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found or is inactive")

    # Upsert
    existing = (
        db.query(WorkflowAssignment)
        .filter(
            WorkflowAssignment.request_type == data.request_type,
            WorkflowAssignment.workspace_id == workspace_id,
        )
        .first()
    )
    if existing:
        existing.workflow_id = data.workflow_id
        existing.updated_by  = actor_employee_id
        a = existing
    else:
        a = WorkflowAssignment(
            id=str(uuid.uuid4()),
            workspace_id=workspace_id,
            request_type=data.request_type,
            workflow_id=data.workflow_id,
            is_active=True,
            updated_by=actor_employee_id,
        )
        db.add(a)

    db.flush()
    return {
        "id":            a.id,
        "request_type":  a.request_type,
        "workflow_id":   a.workflow_id,
        "workflow_name": wf.name,
        "is_active":     a.is_active,
        "updated_at":    a.updated_at,
    }
