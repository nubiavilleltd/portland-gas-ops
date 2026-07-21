from sqlalchemy import (
    Column, String, Date, DateTime, Integer, Numeric, Enum as SAEnum,
    ForeignKey, Text, Boolean
)
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from typing import Optional
import uuid
import enum

from app.core.database import Base


class LeaveType(str, enum.Enum):
    annual = "Annual Leave"
    sick = "Sick Leave"
    casual = "Casual Leave"
    maternity = "Maternity Leave"
    paternity = "Paternity Leave"
    compassionate = "Compassionate Leave"
    study = "Study Leave"


class LeaveTypeSetup(Base):
    __tablename__ = "leave_type_setup"

    id = Column(Integer, primary_key=True, autoincrement=True)
    leave_type_name = Column(String(100), unique=True, nullable=False)
    entitlement_days = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    leave_balances = relationship("LeaveBalance", back_populates="leave_type")


class LeaveRequestStatus(str, enum.Enum):
    draft = "draft"
    awaiting_approval = "awaiting_approval"
    pending = "pending"
    in_progress = "in_progress"
    returned = "returned"
    approved = "approved"
    denied = "denied"


class LeaveRequestType(str, enum.Enum):
    self = "self"
    others = "others"


class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    reference = Column(String(50), unique=True, nullable=False, index=True)  # LRQ-YYYYMMDD-XXXXXX

    # Foreign keys
    requester_id = Column(CHAR(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    employee_id = Column(CHAR(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    leave_type_id = Column(Integer, ForeignKey("leave_type_setup.id", ondelete="RESTRICT"), nullable=False)
    reliever_id = Column(CHAR(36), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)

    # Leave details
    request_type = Column(SAEnum(LeaveRequestType), default=LeaveRequestType.self, nullable=False)
    department = Column(String(100), nullable=True)
    job_title = Column(String(150), nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    days = Column(Integer, nullable=False)
    reason = Column(Text, nullable=True)

    status = Column(SAEnum(LeaveRequestStatus), default=LeaveRequestStatus.draft)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    requester = relationship("User", foreign_keys=[requester_id])
    employee = relationship("Employee", foreign_keys=[employee_id])
    leave_type = relationship("LeaveTypeSetup")
    reliever = relationship("Employee", foreign_keys=[reliever_id])
    document = relationship("Document", foreign_keys=[document_id])

    @property
    def employee_name(self) -> Optional[str]:
        if self.employee and self.employee.user:
            return f"{self.employee.user.first_name} {self.employee.user.last_name}".strip()
        return None

    @property
    def employee_no(self) -> Optional[str]:
        return self.employee.employee_no if self.employee else None

    @property
    def leave_type_name(self) -> Optional[str]:
        return self.leave_type.leave_type_name if self.leave_type else None

    @property
    def reliever_name(self) -> Optional[str]:
        if self.reliever and self.reliever.user:
            return f"{self.reliever.user.first_name} {self.reliever.user.last_name}".strip()
        return None

    @property
    def employee_department(self) -> Optional[str]:
        return self.department

    @property
    def requester_name(self) -> Optional[str]:
        if self.requester and self.requester.first_name:
            return f"{self.requester.first_name} {self.requester.last_name}".strip()
        return None

    @property
    def requester_job_title(self) -> Optional[str]:
        # Get requester's job title through their employee record
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
                # Gracefully handle database errors if employee table is missing columns
                pass
        return None

    @property
    def approval_request_id(self) -> Optional[str]:
        # Get the approval_request_id if this request is in the workflow
        try:
            from sqlalchemy.orm import object_session
            from app.shared.models.approval import ApprovalRequest
            session = object_session(self)
            if session:
                # Latest attempt — after a resubmit there are multiple attempts;
                # the newest one is the active workflow.
                approval_req = session.query(ApprovalRequest).filter(
                    ApprovalRequest.request_type == "leave_request",
                    ApprovalRequest.request_id == self.id,
                ).order_by(ApprovalRequest.attempt_number.desc()).first()
                if approval_req:
                    return approval_req.id
        except Exception:
            pass
        return None


class LeaveBalance(Base):
    __tablename__ = "leave_balance"

    id = Column(Integer, primary_key=True, autoincrement=True)
    employee_id = Column(CHAR(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    leave_type_id = Column(Integer, ForeignKey("leave_type_setup.id", ondelete="RESTRICT"), nullable=False)

    fiscal_year = Column(Integer, nullable=False)
    entitlement = Column(Integer, nullable=False)
    used = Column(Integer, default=0)
    remaining = Column(Integer, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    employee = relationship("Employee")
    leave_type = relationship("LeaveTypeSetup", back_populates="leave_balances")


class PayslipStatus(str, enum.Enum):
    draft = "draft"
    approved = "approved"
    processed = "processed"
    rejected = "rejected"


class Payslip(Base):
    __tablename__ = "payslips"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    payroll_ref = Column(String(50), nullable=True, index=True)  # PAY-YYYYMM-XXXXXX

    # Foreign key
    employee_id = Column(CHAR(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)

    # Employee info
    emp_code = Column(String(20), nullable=True)
    department = Column(String(100), nullable=True)

    # Payroll period
    period = Column(String(20), nullable=False)  # e.g., "June 2026"
    year = Column(Integer, nullable=False)

    # Earnings
    basic = Column(Numeric(15, 2), nullable=False)
    housing = Column(Numeric(15, 2), default=0)
    transport = Column(Numeric(15, 2), default=0)
    meal = Column(Numeric(15, 2), default=0)

    # Deductions
    paye = Column(Numeric(15, 2), default=0)
    pension = Column(Numeric(15, 2), default=0)
    nhf = Column(Numeric(15, 2), default=0)
    loan = Column(Numeric(15, 2), default=0)

    # Calculated
    net = Column(Numeric(15, 2), nullable=False)

    # Status
    payroll_status = Column(SAEnum(PayslipStatus), default=PayslipStatus.draft)
    prepared_by = Column(String(255), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    employee = relationship("Employee")

    @property
    def employee_name(self) -> Optional[str]:
        if self.employee and self.employee.user:
            return f"{self.employee.user.first_name or ''} {self.employee.user.last_name or ''}".strip()
        return None
