"""
Workflow admin router — /api/workflow

All endpoints require admin or super_admin role.

Route ordering matters: literal paths (/groups/, /assignments/) are declared
BEFORE path-parameter routes (/{workflow_id}) to prevent FastAPI matching
"groups" as a workflow_id.

Endpoints:
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

  GET    /{workflow_id}                      workflow detail + steps
  PATCH  /{workflow_id}                      update workflow
  DELETE /{workflow_id}                      delete workflow (only if unassigned)

  PUT    /{workflow_id}/steps/reorder        reorder all steps (before /{step_id})
  POST   /{workflow_id}/steps                add step
  PATCH  /{workflow_id}/steps/{step_id}      update step
  DELETE /{workflow_id}/steps/{step_id}      delete step (remaining steps renumbered)
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.shared.dependencies import require_roles
from app.shared.models.user import User
from app.employees.service import get_employee_by_user_id
from app.shared.workflow import service as svc
from app.shared.workflow.schemas import (
    WorkflowCreate, WorkflowUpdate, WorkflowListItem, WorkflowDetail,
    StepCreate, StepUpdate, StepOut, ReorderSteps,
    GroupCreate, GroupUpdate, GroupListItem, GroupDetail, AddMember, MemberOut,
    AssignmentSet, AssignmentOut,
)

router = APIRouter()

_admin = Depends(require_roles("admin", "super_admin"))


def _employee_id(current_user: User, db: Session) -> str:
    return get_employee_by_user_id(current_user.id, db).id


# ── 1. Literal root routes ────────────────────────────────────────────────────

@router.get("/", response_model=List[WorkflowListItem])
def list_workflows(
    db: Session = Depends(get_db),
    current_user: User = _admin,
):
    return svc.list_workflows(db)


@router.post("/", response_model=WorkflowDetail, status_code=201)
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

@router.get("/groups/", response_model=List[GroupListItem])
def list_groups(
    db: Session = Depends(get_db),
    current_user: User = _admin,
):
    return svc.list_groups(db)


@router.post("/groups/", response_model=GroupDetail, status_code=201)
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

@router.get("/assignments/", response_model=List[AssignmentOut])
def list_assignments(
    db: Session = Depends(get_db),
    current_user: User = _admin,
):
    return svc.list_assignments(db)


@router.put("/assignments/", response_model=AssignmentOut)
def set_assignment(
    data: AssignmentSet,
    db: Session = Depends(get_db),
    current_user: User = _admin,
):
    emp_id = _employee_id(current_user, db)
    result = svc.set_assignment(data, emp_id, db)
    db.commit()
    return result


# ── 4. Workflow detail routes (path param — after all literals) ───────────────

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
