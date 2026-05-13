from sqlalchemy import Column, String, Boolean, DateTime, Enum as SAEnum, ForeignKey, Text, Numeric
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.sql import func
import uuid
import enum
from app.database import Base
from app.models.user import Department


class ProcurementStatus(str, enum.Enum):
    draft = "draft"
    pending = "pending"
    in_progress = "in_progress"
    approved = "approved"
    rejected = "rejected"
    completed = "completed"
    cancelled = "cancelled"


class ProcurementRequest(Base):
    __tablename__ = "procurement_requests"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    reference = Column(String(50), unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    department = Column(SAEnum(Department), nullable=False)
    estimated_amount = Column(Numeric(15, 2), nullable=True)
    status = Column(SAEnum(ProcurementStatus), nullable=False, default=ProcurementStatus.draft)
    vendor_name = Column(String(255), nullable=True)
    vendor_contact = Column(String(255), nullable=True)
    required_by = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(CHAR(36), ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
