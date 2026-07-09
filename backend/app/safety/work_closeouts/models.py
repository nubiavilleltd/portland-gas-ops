import enum
import uuid

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    String,
    Text,
    UniqueConstraint,
)

from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base

class WorkCloseOutStatus(str, enum.Enum):
    draft = "draft"
    submitted = "submitted"
    pending = "pending"
    returned = "returned"
    denied = "denied"
    approved = "approved"
    acknowledged = "acknowledged"


class WorkCloseOutDecision(str, enum.Enum):
    approve = "approve"
    acknowledge = "acknowledge"
    return_ = "return"
    deny = "deny"


class WorkCloseOutAnswer(str, enum.Enum):
    yes = "yes"
    no = "no"
    not_applicable = "not_applicable"


class WorkCloseOutReviewerRole(str, enum.Enum):
    supervisor = "supervisor"
    operations_head = "operations_head"
    hse = "hse"


class SafetyWorkCloseOut(Base):
    __tablename__ = "safety_work_closeouts"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    reference = Column(String(50), unique=True, nullable=False, index=True)

    status = Column(
        SAEnum(WorkCloseOutStatus),
        nullable=False,
        default=WorkCloseOutStatus.submitted,
        index=True,
    )

    requester_id = Column(CHAR(36), ForeignKey("employees.id"), nullable=False, index=True)

    work_authorization_id = Column(
        CHAR(36),
        ForeignKey("safety_work_authorizations.id"),
        nullable=False,
        index=True,
    )

    actual_start_at = Column(DateTime(timezone=True), nullable=False, index=True)
    actual_completion_at = Column(DateTime(timezone=True), nullable=False, index=True)

    work_completed = Column(Boolean, nullable=False, default=True)
    completed_as_approved = Column(Boolean, nullable=False, default=True)
    deviation_explanation = Column(Text, nullable=True)
    completion_summary = Column(Text, nullable=False)
    incident_observed = Column(Boolean, nullable=False, default=False)
    incident_note = Column(Text, nullable=True)
    completion_notes = Column(Text, nullable=True)

    monitored_during_execution = Column(Boolean, nullable=False, default=True)
    stayed_within_scope = Column(Boolean, nullable=False, default=True)
    ppe_and_controls_maintained = Column(Boolean, nullable=False, default=True)
    unsafe_condition_addressed = Column(
        SAEnum(
            WorkCloseOutAnswer,
            values_callable=lambda enum_cls: [item.value for item in enum_cls],
        ),
        nullable=False,
        default=WorkCloseOutAnswer.not_applicable,
    )
    monitoring_comment = Column(Text, nullable=True)

    work_area_cleaned = Column(Boolean, nullable=False, default=True)
    tools_removed = Column(Boolean, nullable=False, default=True)
    system_safe = Column(Boolean, nullable=False, default=True)
    remaining_hazard = Column(Boolean, nullable=False, default=False)
    remaining_hazard_details = Column(Text, nullable=True)

    submitted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    requester = relationship("Employee", foreign_keys=[requester_id])
    work_authorization = relationship("SafetyWorkAuthorization")
    reviews = relationship(
        "SafetyCloseOutReview",
        back_populates="work_closeout",
        cascade="all, delete-orphan",
        order_by="SafetyCloseOutReview.created_at",
    )


class SafetyCloseOutReview(Base):
    __tablename__ = "safety_closeout_reviews"
    __table_args__ = (
        UniqueConstraint(
            "work_closeout_id",
            "reviewer_role",
            name="uq_safety_closeout_reviews_closeout_role",
        ),
    )

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    work_closeout_id = Column(
        CHAR(36),
        ForeignKey("safety_work_closeouts.id"),
        nullable=False,
        index=True,
    )
    reviewer_role = Column(String(100), nullable=False, index=True)
    reviewer_id = Column(CHAR(36), ForeignKey("employees.id"), nullable=False, index=True)
    decision = Column(
        SAEnum(
            WorkCloseOutDecision,
            values_callable=lambda enum_cls: [item.value for item in enum_cls],
        ),
        nullable=False,
        index=True,
    )
    comment = Column(Text, nullable=True)
    verified_close_out = Column(Boolean, nullable=True)
    area_safe_for_operations = Column(Boolean, nullable=True)
    corrective_action_required = Column(Boolean, nullable=True)
    corrective_action_details = Column(Text, nullable=True)
    decided_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    work_closeout = relationship("SafetyWorkCloseOut", back_populates="reviews")
    reviewer = relationship("Employee", foreign_keys=[reviewer_id])
