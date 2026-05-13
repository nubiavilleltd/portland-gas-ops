from sqlalchemy import Column, String, Integer, DateTime, Enum as SAEnum, ForeignKey, Text
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.sql import func
import uuid
import enum
from app.database import Base


class ApprovalStatus(str, enum.Enum):
    draft = "draft"
    pending = "pending"
    in_progress = "in_progress"
    approved = "approved"
    rejected = "rejected"
    returned = "returned"


class StepType(str, enum.Enum):
    individual = "individual"
    group = "group"


class GroupRule(str, enum.Enum):
    any_one = "any_one"
    all_must = "all_must"


class DecisionStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    returned = "returned"


class ApprovalRequest(Base):
    __tablename__ = "approval_requests"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workflow_type = Column(String(100), nullable=False)
    reference_id = Column(String(100), nullable=False, index=True)
    reference_label = Column(String(255), nullable=False)
    status = Column(SAEnum(ApprovalStatus), nullable=False, default=ApprovalStatus.draft)
    current_step = Column(Integer, default=1)
    total_steps = Column(Integer, nullable=False)
    created_by = Column(CHAR(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class ApprovalStep(Base):
    __tablename__ = "approval_steps"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    request_id = Column(CHAR(36), ForeignKey("approval_requests.id", ondelete="CASCADE"), nullable=False)
    step_number = Column(Integer, nullable=False)
    step_type = Column(SAEnum(StepType), nullable=False, default=StepType.individual)
    group_rule = Column(SAEnum(GroupRule), nullable=True)
    status = Column(SAEnum(ApprovalStatus), nullable=False, default=ApprovalStatus.pending)
    completed_at = Column(DateTime(timezone=True), nullable=True)


class StepAssignee(Base):
    __tablename__ = "step_assignees"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    step_id = Column(CHAR(36), ForeignKey("approval_steps.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(CHAR(36), ForeignKey("users.id"), nullable=False)
    decision = Column(SAEnum(DecisionStatus), nullable=False, default=DecisionStatus.pending)
    decided_at = Column(DateTime(timezone=True), nullable=True)
    comment = Column(Text, nullable=True)


class ApprovalHistory(Base):
    __tablename__ = "approval_history"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    request_id = Column(CHAR(36), ForeignKey("approval_requests.id", ondelete="CASCADE"), nullable=False)
    action = Column(String(100), nullable=False)
    actor_id = Column(CHAR(36), ForeignKey("users.id"), nullable=False)
    step_number = Column(Integer, nullable=True)
    comment = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
