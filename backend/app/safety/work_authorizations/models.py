import enum
import uuid

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    JSON,
    String,
    Text,
)
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class WorkAuthorizationStatus(str, enum.Enum):
    draft = "draft"
    submitted = "submitted"
    approved = "approved"
    returned = "returned"
    denied = "denied"


class WorkAuthorizationDecision(str, enum.Enum):
    approve = "approve"
    return_ = "return"
    deny = "deny"


class WorkAuthorizationInspectionCheck(str, enum.Enum):
    pass_ = "pass"
    fail = "fail"
    not_applicable = "not_applicable"


class WorkAuthorizationInspectionResult(str, enum.Enum):
    passed = "passed"
    returned = "returned"
    failed = "failed"


inspection_check_enum = SAEnum(
    WorkAuthorizationInspectionCheck,
    values_callable=lambda enum_cls: [item.value for item in enum_cls],
)


class SafetyWorkAuthorization(Base):
    __tablename__ = "safety_work_authorizations"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    reference = Column(String(50), unique=True, nullable=False, index=True)
    status = Column(
        SAEnum(WorkAuthorizationStatus),
        nullable=False,
        default=WorkAuthorizationStatus.submitted,
        index=True,
    )

    requester_id = Column(CHAR(36), ForeignKey("employees.id"), nullable=False, index=True)
    work_initiation_id = Column(
        CHAR(36),
        ForeignKey("safety_work_initiations.id"),
        nullable=False,
        index=True,
    )

    gas_involved = Column(Boolean, nullable=False, default=False, index=True)
    pressurized_system = Column(Boolean, nullable=False, default=False)
    heat_or_sparks = Column(Boolean, nullable=False, default=False)
    electrical_isolation = Column(Boolean, nullable=False, default=False)
    lifting_equipment = Column(Boolean, nullable=False, default=False)
    ppe_available = Column(Boolean, nullable=False, default=False)
    additional_safety_note = Column(Text, nullable=True)
    attachment_notes = Column(Text, nullable=True)
    attachments_json = Column(JSON, nullable=True)

    hse_inspector_id = Column(CHAR(36), ForeignKey("employees.id"), nullable=True, index=True)
    work_area_safe = Column(inspection_check_enum, nullable=True)
    emergency_equipment_available = Column(inspection_check_enum, nullable=True)
    gas_pressure_check_completed = Column(inspection_check_enum, nullable=True)
    ppe_and_safety_kits_available = Column(inspection_check_enum, nullable=True)
    safety_controls_in_place = Column(inspection_check_enum, nullable=True)
    hse_inspection_result = Column(SAEnum(WorkAuthorizationInspectionResult), nullable=True)
    hse_inspection_comment = Column(Text, nullable=True)
    hse_evidence_json = Column(JSON, nullable=True)
    hse_decision = Column(
        SAEnum(
            WorkAuthorizationDecision,
            values_callable=lambda enum_cls: [item.value for item in enum_cls],
        ),
        nullable=True,
    )
    hse_decision_comment = Column(Text, nullable=True)
    hse_decided_at = Column(DateTime(timezone=True), nullable=True)

    requested_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    requester = relationship("Employee", foreign_keys=[requester_id])
    hse_inspector = relationship("Employee", foreign_keys=[hse_inspector_id])
    work_initiation = relationship("SafetyWorkInitiation")
