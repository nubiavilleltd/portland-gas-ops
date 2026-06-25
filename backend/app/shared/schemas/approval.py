from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.shared.models.approval import ApprovalStatus, StepType, GroupRule, DecisionStatus


class ApprovalRequestResponse(BaseModel):
    id: str
    workflow_type: str
    reference_id: str
    reference_label: str
    status: ApprovalStatus
    current_step: int
    total_steps: int
    created_by: str
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class StepAssigneeResponse(BaseModel):
    id: str
    step_id: str
    user_id: str
    decision: DecisionStatus
    decided_at: Optional[datetime]
    comment: Optional[str]

    class Config:
        from_attributes = True


class ApprovalStepResponse(BaseModel):
    id: str
    request_id: str
    step_number: int
    step_type: StepType
    group_rule: Optional[GroupRule]
    status: ApprovalStatus
    completed_at: Optional[datetime]
    assignees: List[StepAssigneeResponse] = []

    class Config:
        from_attributes = True


class ApprovalHistoryResponse(BaseModel):
    id: str
    request_id: str
    action: str
    actor_id: str
    step_number: Optional[int]
    comment: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True


class ApprovalActionRequest(BaseModel):
    comment: Optional[str] = None
