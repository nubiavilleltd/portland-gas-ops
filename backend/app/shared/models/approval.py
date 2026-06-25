from sqlalchemy import Column, String, Integer, DateTime, Enum as SAEnum, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum
from app.core.database import Base


class ApprovalStatus(str, enum.Enum):
    pending     = "pending"
    in_progress = "in_progress"
    approved    = "approved"
    rejected    = "rejected"
    returned    = "returned"
    cancelled   = "cancelled"


class StepType(str, enum.Enum):
    individual = "individual"
    group      = "group"


class GroupRule(str, enum.Enum):
    any_one  = "any_one"
    all_must = "all_must"


class DecisionStatus(str, enum.Enum):
    pending  = "pending"
    approved = "approved"
    rejected = "rejected"
    returned = "returned"


class ApprovalRequest(Base):
    __tablename__ = "approval_requests"

    id              = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workflow_type   = Column(String(100), nullable=False)
    reference_id    = Column(String(36), nullable=False)
    reference_label = Column(String(255), nullable=False)
    status          = Column(SAEnum(ApprovalStatus), nullable=False, default=ApprovalStatus.pending)
    current_step    = Column(Integer, nullable=False, default=1)
    total_steps     = Column(Integer, nullable=False, default=1)
    created_by      = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at      = Column(DateTime, default=func.now())
    updated_at      = Column(DateTime, default=func.now(), onupdate=func.now())

    steps   = relationship("ApprovalStep", back_populates="request", order_by="ApprovalStep.step_number")
    history = relationship("ApprovalHistory", back_populates="request", order_by="ApprovalHistory.timestamp")


class ApprovalStep(Base):
    __tablename__ = "approval_steps"

    id           = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    request_id   = Column(String(36), ForeignKey("approval_requests.id"), nullable=False)
    step_number  = Column(Integer, nullable=False)
    step_type    = Column(SAEnum(StepType), nullable=False, default=StepType.individual)
    group_rule   = Column(SAEnum(GroupRule), nullable=True)
    status       = Column(SAEnum(ApprovalStatus), nullable=False, default=ApprovalStatus.pending)
    completed_at = Column(DateTime, nullable=True)

    request   = relationship("ApprovalRequest", back_populates="steps")
    assignees = relationship("StepAssignee", back_populates="step")


class StepAssignee(Base):
    __tablename__ = "step_assignees"

    id         = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    step_id    = Column(String(36), ForeignKey("approval_steps.id"), nullable=False)
    user_id    = Column(String(36), ForeignKey("users.id"), nullable=False)
    decision   = Column(SAEnum(DecisionStatus), nullable=False, default=DecisionStatus.pending)
    decided_at = Column(DateTime, nullable=True)
    comment    = Column(Text, nullable=True)

    step = relationship("ApprovalStep", back_populates="assignees")


class ApprovalHistory(Base):
    __tablename__ = "approval_history"

    id          = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    request_id  = Column(String(36), ForeignKey("approval_requests.id"), nullable=False)
    action      = Column(String(100), nullable=False)
    actor_id    = Column(String(36), ForeignKey("users.id"), nullable=False)
    step_number = Column(Integer, nullable=True)
    comment     = Column(Text, nullable=True)
    timestamp   = Column(DateTime, default=func.now())

    request = relationship("ApprovalRequest", back_populates="history")
