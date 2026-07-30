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


class WorkInitiationStatus(str, enum.Enum):
    draft = "draft"
    submitted = "submitted"
    pending = "pending"
    returned = "returned"
    denied = "denied"
    approved = "approved"


class WorkInitiationCategory(str, enum.Enum):
    routine_work = "routine_work"
    maintenance = "maintenance"
    incident_hazard = "incident_hazard"
    customer_work = "customer_work"
    project_work = "project_work"
    emergency_work = "emergency_work"
    other = "other"


class WorkInitiationDecision(str, enum.Enum):
    approve = "approve"
    return_ = "return"
    deny = "deny"


class SafetyWorkInitiation(Base):
    __tablename__ = "safety_work_initiations"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    reference = Column(String(50), unique=True, nullable=False, index=True)
    status = Column(
        SAEnum(WorkInitiationStatus),
        nullable=False,
        default=WorkInitiationStatus.submitted,
        index=True,
    )
    requester_id = Column(CHAR(36), ForeignKey("employees.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    work_category = Column(SAEnum(WorkInitiationCategory), nullable=False, index=True)
    other_work_category = Column(String(255), nullable=True)
    related_incident_report_id = Column(
        CHAR(36),
        ForeignKey("safety_incident_reports.id"),
        nullable=True,
        index=True,
    )
    work_type = Column(String(255), nullable=False)
    other_work_type = Column(String(255), nullable=True)
    location = Column(String(255), nullable=False, index=True)
    exact_work_area = Column(String(255), nullable=True)
    work_description = Column(Text, nullable=False)
    reason_for_work = Column(Text, nullable=False)
    assigned_department = Column(String(100), nullable=False, index=True)
    assigned_supervisor_id = Column(CHAR(36), ForeignKey("employees.id"), nullable=False, index=True)
    contractors_needed = Column(Boolean, nullable=False, default=False)
    selected_contractor_name = Column(String(255), nullable=True)
    contractor_contact_email = Column(String(255), nullable=True)
    planned_start_at = Column(DateTime(timezone=True), nullable=False, index=True)
    planned_end_at = Column(DateTime(timezone=True), nullable=False, index=True)
    materials_required = Column(Text, nullable=True)
    supervisor_decision = Column(
        SAEnum(
            WorkInitiationDecision,
            values_callable=lambda enum_cls: [item.value for item in enum_cls],
        ),
        nullable=True,
    )
    supervisor_id = Column(CHAR(36), ForeignKey("employees.id"), nullable=True)
    supervisor_comment = Column(Text, nullable=True)
    supervisor_decided_at = Column(DateTime(timezone=True), nullable=True)
    operations_hod_decision = Column(
        SAEnum(
            WorkInitiationDecision,
            values_callable=lambda enum_cls: [item.value for item in enum_cls],
        ),
        nullable=True,
    )
    operations_hod_id = Column(CHAR(36), ForeignKey("employees.id"), nullable=True)
    operations_hod_comment = Column(Text, nullable=True)
    operations_hod_decided_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    requester = relationship("Employee", foreign_keys=[requester_id])
    assigned_supervisor = relationship("Employee", foreign_keys=[assigned_supervisor_id])
    supervisor = relationship("Employee", foreign_keys=[supervisor_id])
    operations_hod = relationship("Employee", foreign_keys=[operations_hod_id])
    related_incident_report = relationship("SafetyIncidentReport")
    workers = relationship(
        "SafetyWorkInitiationWorker",
        back_populates="work_initiation",
        cascade="all, delete-orphan",
    )


class SafetyWorkInitiationWorker(Base):
    __tablename__ = "safety_work_initiation_workers"
    __table_args__ = (
        UniqueConstraint(
            "work_initiation_id",
            "worker_id",
            name="uq_safety_work_initiation_workers_pair",
        ),
    )

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    work_initiation_id = Column(
        CHAR(36),
        ForeignKey("safety_work_initiations.id"),
        nullable=False,
        index=True,
    )
    worker_id = Column(CHAR(36), ForeignKey("employees.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    work_initiation = relationship("SafetyWorkInitiation", back_populates="workers")
    worker = relationship("Employee", foreign_keys=[worker_id])
