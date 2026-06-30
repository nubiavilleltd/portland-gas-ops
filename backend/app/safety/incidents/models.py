import enum
import uuid

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Enum as SAEnum,
    String,
    Text,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class IncidentReportStatus(str, enum.Enum):
    draft = "draft"
    submitted = "submitted"
    recommended = "recommended"
    resolved = "resolved"
    not_resolved = "not_resolved"
    closed = "closed"


class IncidentReportType(str, enum.Enum):
    incident = "incident"
    hazard = "hazard"
    near_miss = "near_miss"
    unsafe_act = "unsafe_act"
    unsafe_condition = "unsafe_condition"
    environmental_concern = "environmental_concern"
    other = "other"


class IncidentSeverityEstimate(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class IncidentHseDecision(str, enum.Enum):
    recommended = "recommended"
    resolved = "resolved"
    not_resolved = "not_resolved"


class SafetyIncidentReport(Base):
    __tablename__ = "safety_incident_reports"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    reference = Column(String(50), unique=True, nullable=False, index=True)

    status = Column(
        SAEnum(IncidentReportStatus),
        nullable=False,
        default=IncidentReportStatus.submitted,
        index=True,
    )

    title = Column(String(255), nullable=False)

    report_type = Column(
        SAEnum(IncidentReportType),
        nullable=False,
        index=True,
    )

    location = Column(String(255), nullable=False, index=True)
    exact_location = Column(String(255), nullable=True)

    observed_at = Column(DateTime(timezone=True), nullable=False, index=True)

    # Excel says this links to work authorizations.
    # We keep it as plain CHAR for now because work_authorizations may not exist yet.
    related_work_authorization_id = Column(CHAR(36), nullable=True)

    description = Column(Text, nullable=False)

    severity_estimate = Column(
        SAEnum(IncidentSeverityEstimate),
        nullable=True,
    )

    anyone_injured = Column(Boolean, nullable=False, default=False)
    property_damaged = Column(Boolean, nullable=False, default=False)

    gas_fire_environmental_concern = Column(
        Boolean,
        nullable=False,
        default=False,
        index=True,
    )

    immediate_action_taken = Column(Text, nullable=True)
    people_involved = Column(Text, nullable=True)
    additional_notes = Column(Text, nullable=True)

    # Excel says this references employees_table.id.
    # In this backend, the table is employees.
    reported_by = Column(
        CHAR(36),
        ForeignKey("employees.id"),
        nullable=False,
        index=True,
    )

    reported_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    # Excel says this links to work closeouts.
    # Keep as plain CHAR for now until closeout table exists.
    resolution_work_closeout_id = Column(CHAR(36), nullable=True)

    is_active = Column(Boolean, nullable=False, default=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    reporter = relationship("Employee", foreign_keys=[reported_by])
    hse_review = relationship(
        "SafetyIncidentHseReview",
        back_populates="incident_report",
        uselist=False,
    )


class SafetyIncidentHseReview(Base):
    __tablename__ = "safety_incident_hse_reviews"
    __table_args__ = (
        UniqueConstraint("incident_report_id", name="uq_safety_incident_hse_reviews_incident_report_id"),
    )

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_report_id = Column(
        CHAR(36),
        ForeignKey("safety_incident_reports.id"),
        nullable=False,
        index=True,
    )
    inspector_id = Column(
        CHAR(36),
        ForeignKey("employees.id"),
        nullable=False,
        index=True,
    )
    confirmed_report_type = Column(SAEnum(IncidentReportType), nullable=False)
    confirmed_severity = Column(SAEnum(IncidentSeverityEstimate), nullable=False, index=True)
    findings = Column(Text, nullable=False)
    root_cause = Column(Text, nullable=True)
    corrective_action_required = Column(Boolean, nullable=False, default=False, index=True)
    corrective_action_details = Column(Text, nullable=True)
    action_owner_id = Column(CHAR(36), ForeignKey("employees.id"), nullable=True, index=True)
    assigned_department = Column(String(100), nullable=True, index=True)
    target_completion_date = Column(Date, nullable=True, index=True)
    decision = Column(
        SAEnum(IncidentHseDecision),
        nullable=False,
        default=IncidentHseDecision.recommended,
        index=True,
    )
    comment = Column(Text, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    incident_report = relationship("SafetyIncidentReport", back_populates="hse_review")
    inspector = relationship("Employee", foreign_keys=[inspector_id])
    action_owner = relationship("Employee", foreign_keys=[action_owner_id])
