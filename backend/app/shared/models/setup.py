from sqlalchemy import (
    Column, String, DateTime, Integer, Enum as SAEnum,
    ForeignKey, Text
)
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class DepartmentSetup(Base):
    __tablename__ = "department_setup"

    id = Column(Integer, primary_key=True, autoincrement=True)
    department_name = Column(String(100), unique=True, nullable=False, index=True)
    head_of_dept = Column(String(255), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ApprovalStage(str, enum.Enum):
    reliever = "reliever"
    manager = "manager"
    hr = "hr"
    finance = "finance"


class ApprovalStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class RequestApproval(Base):
    __tablename__ = "request_approvals"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # Generic request reference
    request_id = Column(String(50), nullable=False, index=True)  # FK to leave_requests.reference, cash_requisitions.reference, or invoices.reference
    request_type = Column(String(50), nullable=False)  # "leave", "cash_requisition", "invoice"

    # Approver
    approver_id = Column(CHAR(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Approval stage
    approval_stage = Column(SAEnum(ApprovalStage), nullable=False)
    status = Column(SAEnum(ApprovalStatus), default=ApprovalStatus.pending)
    comments = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    approver = relationship("User")
