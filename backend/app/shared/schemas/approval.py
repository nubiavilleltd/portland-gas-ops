"""
Workflow engine Pydantic schemas.
Full implementation lives in app/shared/workflow/ (to be built).
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.shared.models.approval import (
    ApprovalOverallStatus,
    AssigneeType,
    NotificationType,
    AllRequestStatus,
)


class WorkflowStepOut(BaseModel):
    id: str
    step_number: int
    step_name: str
    assignee_type: AssigneeType
    role: Optional[str]
    employee_id: Optional[str]
    group_id: Optional[str]
    can_approve: bool
    can_reject: bool
    can_return: bool

    class Config:
        from_attributes = True


class ApprovalWorkflowOut(BaseModel):
    id: str
    name: str
    description: Optional[str]
    is_active: bool
    reset_on_return: bool
    created_at: datetime
    steps: list[WorkflowStepOut] = []

    class Config:
        from_attributes = True


class ApprovalRequestOut(BaseModel):
    id: str
    workflow_id: str
    request_type: str
    request_id: str
    submitted_by: str
    current_step_number: int
    overall_status: ApprovalOverallStatus
    attempt_number: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class NotificationOut(BaseModel):
    id: str
    type: NotificationType
    title: str
    message: str
    reference_type: Optional[str]
    reference_id: Optional[str]
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ActionRequest(BaseModel):
    comment: Optional[str] = None
