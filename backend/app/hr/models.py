from sqlalchemy import (
    Column, String, Date, DateTime, Integer, Numeric, Enum as SAEnum,
    ForeignKey, Text, Boolean, UniqueConstraint
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
    # Sick-leave-style types: no entitlement cap, and no fixed end date required
    # (Start Date + optional Expected Return).
    is_uncapped = Column(Boolean, default=False, nullable=False, server_default="0")
    open_ended = Column(Boolean, default=False, nullable=False, server_default="0")
    # Minimum advance notice (in calendar days) required before a leave of this
    # type may start. 0 = no notice period (e.g. Sick Leave). Blocks a start date
    # that falls within the notice window from today.
    notice_days = Column(Integer, default=0, nullable=False, server_default="0")

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
    # Set when the employee marks they are back (open-ended leave, e.g. Sick).
    returned_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    requester = relationship("User", foreign_keys=[requester_id])
    employee = relationship("Employee", foreign_keys=[employee_id])
    leave_type = relationship("LeaveTypeSetup")
    reliever = relationship("Employee", foreign_keys=[reliever_id])
    document = relationship("Document", foreign_keys=[document_id])

    @property
    def open_ended(self) -> bool:
        """Whether this request's leave type has no fixed end date."""
        return bool(self.leave_type and self.leave_type.open_ended)

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
        # Get requester's job title through their employee record.
        if not self.requester:
            return None
        # Fast path: for a "self" request the requester IS the employee, whose
        # record is already loaded — no extra query. (requester_id is a User id,
        # employee.user_id is that same User id when they match.)
        if self.employee and self.employee.user_id == self.requester_id:
            return self.employee.job_title
        # Fallback for "raise for others": look up the requester's employee row.
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
        # Fast path: a list query can prefetch this in bulk and stash it here,
        # avoiding a per-row query. (Present even when the value is None.)
        if "_ar_id_prefetched" in self.__dict__:
            return self.__dict__["_ar_id_prefetched"]
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

    # Loan context snapshot (for the payslip PDF) — captured from the active loan
    # deducted this period, so the slip is a self-contained historical record.
    loan_description = Column(String(255), nullable=True)
    loan_total = Column(Numeric(15, 2), nullable=True)
    loan_outstanding = Column(Numeric(15, 2), nullable=True)  # outstanding AFTER this payment

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


# ─── Employee loans / recurring deductions ────────────────────────────────────


class LoanMode(str, enum.Enum):
    one_off     = "one_off"      # deducted once (total_amount == monthly_amount)
    installment = "installment"  # fixed-term: pays down total_amount, auto-stops
    standing    = "standing"     # open-ended recurring deduction (total_amount is NULL)


class LoanStatus(str, enum.Enum):
    active    = "active"
    completed = "completed"
    cancelled = "cancelled"


class EmployeeLoan(Base):
    """A loan or recurring deduction agreement for an employee. Payroll reads active
    loans at generation time; the per-period amount charged is recorded in
    ``LoanRepaymentCharge`` so regeneration is idempotent and installments auto-stop."""

    __tablename__ = "employee_loans"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id = Column(CHAR(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)

    description = Column(String(255), nullable=True)  # e.g. "Salary advance – Mar 2026"
    mode = Column(SAEnum(LoanMode), nullable=False)

    # Amounts (NGN, 2dp). monthly_amount = per-run deduction (whole amount for one_off).
    monthly_amount = Column(Numeric(15, 2), nullable=False)
    # Full repayable amount. NULL ⇒ standing (open-ended, no cap). For one_off == monthly_amount.
    total_amount = Column(Numeric(15, 2), nullable=True)

    # First period to deduct from, as YYYYMM (e.g. 202607). NULL ⇒ from the first run.
    start_period_yyyymm = Column(Integer, nullable=True)

    status = Column(SAEnum(LoanStatus), nullable=False, default=LoanStatus.active, index=True)
    created_by = Column(String(255), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    employee = relationship("Employee")
    charges = relationship("LoanRepaymentCharge", back_populates="loan", cascade="all, delete-orphan")


class LoanRepaymentCharge(Base):
    """Ledger row: how much a loan was deducted for a given payroll period. The unique
    (loan_id, period, year) constraint makes payslip regeneration idempotent."""

    __tablename__ = "loan_repayment_charges"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    loan_id = Column(CHAR(36), ForeignKey("employee_loans.id", ondelete="CASCADE"), nullable=False, index=True)
    payslip_id = Column(CHAR(36), ForeignKey("payslips.id", ondelete="CASCADE"), nullable=True, index=True)

    period = Column(String(20), nullable=False)  # e.g. "July 2026"
    year = Column(Integer, nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    loan = relationship("EmployeeLoan", back_populates="charges")
    payslip = relationship("Payslip")

    __table_args__ = (
        UniqueConstraint("loan_id", "period", "year", name="uq_loan_charge_period"),
    )
