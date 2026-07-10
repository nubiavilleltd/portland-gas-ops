from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

from app.shared.models.approval import AssigneeType


# ── Workflows ──────────────────────────────────────────────────────────────────

class WorkflowCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    reset_on_return: bool = True


class WorkflowUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    is_active: Optional[bool] = None
    reset_on_return: Optional[bool] = None


class WorkflowListItem(BaseModel):
    id: str
    name: str
    description: Optional[str]
    is_active: bool
    reset_on_return: bool
    step_count: int
    assignment_count: int
    created_at: datetime

    class Config:
        from_attributes = True


# ── Steps ─────────────────────────────────────────────────────────────────────

class StepCreate(BaseModel):
    step_name: str = Field(..., min_length=1, max_length=100)
    assignee_type: AssigneeType
    role: Optional[str] = Field(None, max_length=80)
    employee_id: Optional[str] = None
    group_id: Optional[str] = None
    can_approve: bool = True
    can_reject: bool = True
    can_return: bool = False


class StepUpdate(BaseModel):
    step_name: Optional[str] = Field(None, min_length=1, max_length=100)
    assignee_type: Optional[AssigneeType] = None
    role: Optional[str] = Field(None, max_length=80)
    employee_id: Optional[str] = None
    group_id: Optional[str] = None
    can_approve: Optional[bool] = None
    can_reject: Optional[bool] = None
    can_return: Optional[bool] = None


class ReorderSteps(BaseModel):
    step_ids: List[str]  # ordered list of step UUIDs — first = step 1


class StepOut(BaseModel):
    id: str
    workflow_id: str
    step_number: int
    step_name: str
    assignee_type: AssigneeType
    role: Optional[str]
    employee_id: Optional[str]
    group_id: Optional[str]
    # resolved display names
    employee_name: Optional[str] = None
    group_name: Optional[str] = None
    can_approve: bool
    can_reject: bool
    can_return: bool
    created_at: datetime

    class Config:
        from_attributes = True


class WorkflowDetail(BaseModel):
    id: str
    name: str
    description: Optional[str]
    is_active: bool
    reset_on_return: bool
    created_at: datetime
    steps: List[StepOut] = []
    assignment_count: int = 0

    class Config:
        from_attributes = True


# ── Approver Groups ────────────────────────────────────────────────────────────

class GroupCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None


class GroupUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class AddMember(BaseModel):
    employee_id: str


class MemberOut(BaseModel):
    id: str
    employee_id: str
    employee_name: str
    employee_no: str
    job_title: Optional[str]
    department: Optional[str]

    class Config:
        from_attributes = True


class GroupListItem(BaseModel):
    id: str
    name: str
    description: Optional[str]
    is_active: bool
    member_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class GroupDetail(BaseModel):
    id: str
    name: str
    description: Optional[str]
    is_active: bool
    created_at: datetime
    members: List[MemberOut] = []

    class Config:
        from_attributes = True


# ── Workflow Assignments ───────────────────────────────────────────────────────

class AssignmentSet(BaseModel):
    request_type: str = Field(..., max_length=50)
    workflow_id: str


class AssignmentOut(BaseModel):
    id: str
    request_type: str
    workflow_id: str
    workflow_name: str
    is_active: bool
    updated_at: datetime

    class Config:
        from_attributes = True
