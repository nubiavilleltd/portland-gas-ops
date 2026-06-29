import enum
import uuid

from sqlalchemy import Boolean, Column, Date, DateTime, Enum as SAEnum, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.dialects.mysql import CHAR, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class SafetyChecklistParentType(str, enum.Enum):
    work_authorization = "work_authorization"
    work_closeout = "work_closeout"
    closeout_review = "closeout_review"
    incident_hse_review = "incident_hse_review"
    work_initiation = "work_initiation"
    incident_report = "incident_report"


class SafetyChecklistStage(str, enum.Enum):
    risk_assessment = "risk_assessment"
    inspection = "inspection"
    monitoring = "monitoring"
    hse_review = "hse_review"
    completion = "completion"
    closeout_review = "closeout_review"


class SafetyChecklistInputType(str, enum.Enum):
    boolean = "boolean"
    enum = "enum"
    text = "text"
    number = "number"
    date = "date"
    datetime = "datetime"


class SafetyChecklistTemplate(Base):
    __tablename__ = "safety_checklist_templates"
    __table_args__ = (
        UniqueConstraint("code", "version", name="uq_safety_checklist_templates_code_version"),
    )

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String(100), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    parent_type = Column(SAEnum(SafetyChecklistParentType), nullable=False, index=True)
    stage = Column(SAEnum(SafetyChecklistStage), nullable=False, index=True)
    version = Column(Integer, nullable=False, default=1, index=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    items = relationship(
        "SafetyChecklistItem",
        back_populates="template",
        cascade="all, delete-orphan",
        order_by="SafetyChecklistItem.sort_order",
    )


class SafetyChecklistItem(Base):
    __tablename__ = "safety_checklist_items"
    __table_args__ = (
        UniqueConstraint("template_id", "item_key", name="uq_safety_checklist_items_template_key"),
    )

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    template_id = Column(CHAR(36), ForeignKey("safety_checklist_templates.id", ondelete="CASCADE"), nullable=False, index=True)
    item_key = Column(String(100), nullable=False)
    label = Column(String(255), nullable=False)
    input_type = Column(SAEnum(SafetyChecklistInputType), nullable=False)
    options_json = Column(JSON, nullable=True)
    default_value = Column(String(255), nullable=True)
    is_required = Column(Boolean, nullable=False, default=False)
    severity_weight = Column(Integer, nullable=True)
    sort_order = Column(Integer, nullable=False, default=0, index=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    template = relationship("SafetyChecklistTemplate", back_populates="items")
    responses = relationship("SafetyChecklistResponse", back_populates="item")


class SafetyChecklistResponse(Base):
    __tablename__ = "safety_checklist_responses"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    template_id = Column(CHAR(36), ForeignKey("safety_checklist_templates.id"), nullable=False, index=True)
    template_code_snapshot = Column(String(100), nullable=False)
    template_name_snapshot = Column(String(255), nullable=False)
    template_version = Column(Integer, nullable=False)
    stage_snapshot = Column(String(100), nullable=False)
    item_id = Column(CHAR(36), ForeignKey("safety_checklist_items.id"), nullable=False, index=True)
    item_key_snapshot = Column(String(100), nullable=False)
    label_snapshot = Column(String(255), nullable=False)
    input_type_snapshot = Column(String(50), nullable=False)
    options_json_snapshot = Column(JSON, nullable=True)
    is_required_snapshot = Column(Boolean, nullable=False)
    sort_order_snapshot = Column(Integer, nullable=False)
    parent_type = Column(SAEnum(SafetyChecklistParentType), nullable=False, index=True)
    parent_id = Column(CHAR(36), nullable=False, index=True)
    response_group_id = Column(CHAR(36), nullable=True, index=True)
    value_boolean = Column(Boolean, nullable=True)
    value_text = Column(Text, nullable=True)
    value_number = Column(Numeric(18, 4), nullable=True)
    value_date = Column(Date, nullable=True)
    value_datetime = Column(DateTime(timezone=True), nullable=True)
    selected_option = Column(String(100), nullable=True)
    comment = Column(Text, nullable=True)
    answered_by = Column(CHAR(36), ForeignKey("employees.id"), nullable=False, index=True)
    answered_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    template = relationship("SafetyChecklistTemplate")
    item = relationship("SafetyChecklistItem", back_populates="responses")
    answered_employee = relationship("Employee", foreign_keys=[answered_by])
