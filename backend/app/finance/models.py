from sqlalchemy import (
    Column, String, DateTime, Numeric, Enum as SAEnum,
    ForeignKey, Text, Date, Integer
)
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from typing import Optional
import uuid
import enum

from app.core.database import Base


class CashRequisitionStatus(str, enum.Enum):
    draft = "draft"
    pending = "pending"
    in_progress = "in_progress"
    returned = "returned"
    approved = "approved"
    denied = "denied"
    retired = "retired"


class CashRequisition(Base):
    __tablename__ = "cash_requisitions"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    reference = Column(String(50), unique=True, nullable=False, index=True)  # CRQ-YYYYMMDD-XXXXXX

    # Foreign keys
    requester_id = Column(CHAR(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)

    # Request details
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    department = Column(String(100), nullable=False)

    # Amount and currency
    amount = Column(Numeric(15, 2), nullable=False)
    currency = Column(String(3), default="NGN")  # NGN, USD, EUR, GBP

    # Expected retirement date
    expected_retirement = Column(Date, nullable=True)

    # Status
    status = Column(SAEnum(CashRequisitionStatus), default=CashRequisitionStatus.draft)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    requester = relationship("User")
    document = relationship("Document", foreign_keys=[document_id])

    @property
    def requester_name(self) -> Optional[str]:
        if self.requester and self.requester.first_name:
            return f"{self.requester.first_name} {self.requester.last_name}".strip()
        return None

    @property
    def requester_job_title(self) -> Optional[str]:
        # Requester's job title via their employee record
        if self.requester:
            try:
                from sqlalchemy.orm import object_session
                from app.employees.models import Employee
                session = object_session(self)
                if session:
                    employee = session.query(Employee).filter(Employee.user_id == self.requester.id).first()
                    if employee:
                        return employee.job_title
            except Exception:
                pass
        return None

    @property
    def approval_request_id(self) -> Optional[str]:
        # Latest attempt — after a resubmit there are multiple attempts.
        try:
            from sqlalchemy.orm import object_session
            from app.shared.models.approval import ApprovalRequest
            session = object_session(self)
            if session:
                approval_req = session.query(ApprovalRequest).filter(
                    ApprovalRequest.request_type == "cash_requisition",
                    ApprovalRequest.request_id == self.id,
                ).order_by(ApprovalRequest.attempt_number.desc()).first()
                if approval_req:
                    return approval_req.id
        except Exception:
            pass
        return None
