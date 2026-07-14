"""
Workflow Engine Models
======================
All tables that power the shared approval workflow engine.

Table overview:
  approval_workflows       — named workflow templates (e.g. "Procurement Approval")
  workflow_steps           — ordered steps per template; assignee_type drives resolver
  approver_groups          — named lists for requester_pick steps
  approver_group_members   — members of each group
  workflow_assignments     — maps request_type → active workflow_id
  approval_requests        — live tracker: one row per request entering a workflow
  approval_step_assignments — resolved approver for each step of each request
  approval_history         — immutable approver-action log (approve/reject/return)
  workflow_audit_trail     — full actor event log incl. requester actions (submitted, recalled)
  all_requests             — unified request registry for the All Requests dashboard
  notifications            — in-app notifications sent to employees
"""

import uuid
import enum

from sqlalchemy import (
    Column, String, Integer, Boolean, Text, DateTime, Enum as SAEnum, ForeignKey,
    quoted_name,
)
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


# ── Enums ─────────────────────────────────────────────────────────────────────

class AssigneeType(str, enum.Enum):
    role                         = "role"
    specific                     = "specific"
    requester_pick               = "requester_pick"
    requester_operations_manager = "requester_operations_manager"
    requester_hod                = "requester_hod"
    requester_skip_level         = "requester_skip_level"


class ApprovalOverallStatus(str, enum.Enum):
    pending  = "pending"
    approved = "approved"
    rejected = "rejected"
    returned = "returned"


class ApprovalHistoryAction(str, enum.Enum):
    approved  = "approved"
    rejected  = "rejected"
    returned  = "returned"
    escalated = "escalated"


class AuditAction(str, enum.Enum):
    submitted    = "submitted"
    approved     = "approved"
    rejected     = "rejected"
    returned     = "returned"
    escalated    = "escalated"
    recalled     = "recalled"
    recommended  = "recommended"
    resolved     = "resolved"
    not_resolved = "not_resolved"
    closed       = "closed"


class AllRequestStatus(str, enum.Enum):
    pending  = "pending"
    approved = "approved"
    rejected = "rejected"
    returned = "returned"


class NotificationType(str, enum.Enum):
    approval_required = "approval_required"
    approved          = "approved"
    rejected          = "rejected"
    returned          = "returned"
    info              = "info"


# ── Workflow Templates ─────────────────────────────────────────────────────────

class ApprovalWorkflow(Base):
    __tablename__ = "approval_workflows"

    id             = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name           = Column(String(100), nullable=False)
    description    = Column(Text, nullable=True)
    is_active      = Column(Boolean, nullable=False, default=True)
    reset_on_return= Column(Boolean, nullable=False, default=True)  # restart from step 1 on resubmit
    created_at     = Column(DateTime(timezone=True), server_default=func.now())

    steps       = relationship("WorkflowStep", back_populates="workflow", order_by="WorkflowStep.step_number")
    assignments = relationship("WorkflowAssignment", back_populates="workflow")


class WorkflowStep(Base):
    __tablename__ = "workflow_steps"

    id            = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workflow_id   = Column(CHAR(36), ForeignKey("approval_workflows.id", ondelete="CASCADE"), nullable=False)
    step_number   = Column(Integer, nullable=False)
    step_name     = Column(String(100), nullable=False)
    assignee_type = Column(SAEnum(AssigneeType), nullable=False)

    # Populated based on assignee_type:
    role        = Column(quoted_name("role", False), String(80), nullable=True)   # when assignee_type = role
    employee_id = Column(CHAR(36), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)   # when specific
    group_id    = Column(CHAR(36), ForeignKey("org_groups.id", ondelete="SET NULL"), nullable=True)  # when requester_pick

    # Button visibility on the ApprovalPanel for this step
    can_approve = Column(Boolean, nullable=False, default=True)
    can_reject  = Column(Boolean, nullable=False, default=True)
    can_return  = Column(Boolean, nullable=False, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    workflow = relationship("ApprovalWorkflow", back_populates="steps")
    employee = relationship("Employee", foreign_keys=[employee_id])
    group    = relationship("Group", foreign_keys=[group_id])


# ── Workflow Assignments (request_type → workflow_id) ─────────────────────────

class WorkflowAssignment(Base):
    __tablename__ = "workflow_assignments"

    id           = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    request_type = Column(String(50), nullable=False, unique=True)  # procurement | asset
    workflow_id  = Column(CHAR(36), ForeignKey("approval_workflows.id", ondelete="RESTRICT"), nullable=False)
    is_active    = Column(Boolean, nullable=False, default=True)
    updated_by   = Column(CHAR(36), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    updated_at   = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    workflow    = relationship("ApprovalWorkflow", back_populates="assignments")
    updated_by_employee = relationship("Employee", foreign_keys=[updated_by])


# ── Live Approval Tracker ─────────────────────────────────────────────────────

class ApprovalRequest(Base):
    __tablename__ = "approval_requests"

    id                  = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workflow_id         = Column(CHAR(36), ForeignKey("approval_workflows.id", ondelete="RESTRICT"), nullable=False)
    request_type        = Column(String(50), nullable=False)   # procurement | asset
    request_id          = Column(String(36), nullable=False)   # UUID of the source request row
    submitted_by        = Column(CHAR(36), ForeignKey("employees.id", ondelete="RESTRICT"), nullable=False)
    current_step_number = Column(Integer, nullable=False, default=1)
    overall_status      = Column(SAEnum(ApprovalOverallStatus), nullable=False, default=ApprovalOverallStatus.pending)
    attempt_number      = Column(Integer, nullable=False, default=1)
    created_at          = Column(DateTime(timezone=True), server_default=func.now())
    updated_at          = Column(DateTime(timezone=True), onupdate=func.now())

    workflow     = relationship("ApprovalWorkflow")
    submitter    = relationship("Employee", foreign_keys=[submitted_by])
    step_assignments = relationship("ApprovalStepAssignment", back_populates="approval_request")
    history      = relationship("ApprovalHistory", back_populates="approval_request")


class ApprovalStepAssignment(Base):
    __tablename__ = "approval_step_assignments"

    id                  = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    approval_request_id = Column(CHAR(36), ForeignKey("approval_requests.id", ondelete="CASCADE"), nullable=False)
    step_number         = Column(Integer, nullable=False)
    assigned_to         = Column(CHAR(36), ForeignKey("employees.id", ondelete="RESTRICT"), nullable=False)
    assigned_at         = Column(DateTime(timezone=True), server_default=func.now())

    approval_request = relationship("ApprovalRequest", back_populates="step_assignments")
    assignee         = relationship("Employee", foreign_keys=[assigned_to])


class ApprovalHistory(Base):
    __tablename__ = "approval_history"

    id                  = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    approval_request_id = Column(CHAR(36), ForeignKey("approval_requests.id", ondelete="CASCADE"), nullable=False)
    step_number         = Column(Integer, nullable=False)
    actor_id            = Column(CHAR(36), ForeignKey("employees.id", ondelete="RESTRICT"), nullable=False)
    action              = Column(SAEnum(ApprovalHistoryAction), nullable=False)
    comment             = Column(Text, nullable=True)
    acted_at            = Column(DateTime(timezone=True), server_default=func.now())

    approval_request = relationship("ApprovalRequest", back_populates="history")
    actor            = relationship("Employee", foreign_keys=[actor_id])


class WorkflowAuditTrail(Base):
    __tablename__ = "workflow_audit_trail"

    id           = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workflow_id  = Column(CHAR(36), ForeignKey("approval_workflows.id", ondelete="SET NULL"), nullable=True)
    request_id   = Column(String(36), nullable=False)   # UUID of the source request row
    request_type = Column(String(50), nullable=False)
    actor_id     = Column(CHAR(36), ForeignKey("employees.id", ondelete="RESTRICT"), nullable=False)
    actor_role   = Column(String(80), nullable=True)    # requester | line_manager | finance_manager | md …
    step_number  = Column(Integer, nullable=True)       # null for requester-initiated actions
    action       = Column(SAEnum(AuditAction), nullable=False)
    comment      = Column(Text, nullable=True)
    acted_at     = Column(DateTime(timezone=True), server_default=func.now())

    actor = relationship("Employee", foreign_keys=[actor_id])


# ── All Requests (unified dashboard) ─────────────────────────────────────────

class AllRequest(Base):
    __tablename__ = "all_requests"

    id                  = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    reference           = Column(String(20), nullable=False, unique=True)
    request_type        = Column(String(50), nullable=False)   # procurement | asset
    request_id          = Column(String(36), nullable=False)   # UUID of the source row
    title               = Column(String(200), nullable=False)
    raised_by           = Column(CHAR(36), ForeignKey("employees.id", ondelete="RESTRICT"), nullable=False)
    department          = Column(String(100), nullable=True)
    status              = Column(SAEnum(AllRequestStatus), nullable=False, default=AllRequestStatus.pending)
    approval_request_id = Column(CHAR(36), ForeignKey("approval_requests.id", ondelete="SET NULL"), nullable=True)
    created_at          = Column(DateTime(timezone=True), server_default=func.now())
    updated_at          = Column(DateTime(timezone=True), onupdate=func.now())

    raiser           = relationship("Employee", foreign_keys=[raised_by])
    approval_request = relationship("ApprovalRequest", foreign_keys=[approval_request_id])


# ── Notifications ──────────────────────────────────────────────────────────────

class Notification(Base):
    __tablename__ = "notifications"

    id             = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    recipient_id   = Column(CHAR(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    type           = Column(SAEnum(NotificationType), nullable=False)
    title          = Column(String(200), nullable=False)
    message        = Column(Text, nullable=False)
    reference_type = Column(String(50), nullable=True)   # procurement | asset
    reference_id   = Column(String(36), nullable=True)   # UUID of the source row
    is_read        = Column(Boolean, nullable=False, default=False)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())

    recipient = relationship("Employee", foreign_keys=[recipient_id])
