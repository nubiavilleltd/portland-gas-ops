from pydantic import BaseModel, Field, model_validator
from typing import Optional, List
from datetime import datetime, date


class DocumentInfo(BaseModel):
    id: int
    name: str
    file_path: Optional[str] = None
    mime_type: Optional[str] = None

    class Config:
        from_attributes = True


# ── Leave Type Schemas ───────────────────────────────────────────────────────

# ── Create (HR admin submits this) ───────────────────────────────────────────

class LeaveTypeCreate(BaseModel):
    leave_type_name: str = Field(..., min_length=1, max_length=100)
    # 0 is allowed for uncapped types (no entitlement limit).
    entitlement_days: int = Field(0, ge=0)
    description: Optional[str] = None
    is_active: bool = True
    is_uncapped: bool = False   # no entitlement cap (e.g. Sick Leave)
    open_ended: bool = False    # no fixed End Date required
    notice_days: int = Field(0, ge=0)   # min advance-notice window (calendar days)


# ── Full update (all fields optional) ────────────────────────────────────────

class LeaveTypeUpdate(BaseModel):
    leave_type_name: Optional[str] = Field(None, min_length=1, max_length=100)
    entitlement_days: Optional[int] = Field(None, ge=0)
    description: Optional[str] = None
    is_active: Optional[bool] = None
    is_uncapped: Optional[bool] = None
    open_ended: Optional[bool] = None
    notice_days: Optional[int] = Field(None, ge=0)


# ── Response (returned to client) ────────────────────────────────────────────

class LeaveTypeRead(BaseModel):
    id: int
    leave_type_name: str
    entitlement_days: int
    description: Optional[str]
    is_active: bool
    is_uncapped: bool = False
    open_ended: bool = False
    notice_days: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class LeaveBalanceRead(BaseModel):
    leave_type_id: int
    leave_type_name: str
    fiscal_year: int
    entitlement: int
    used: int
    remaining: int

    class Config:
        from_attributes = True


class EmployeeLeaveBalancesRead(BaseModel):
    employee_id: str
    name: str
    job_title: Optional[str] = None
    department: Optional[str] = None
    fiscal_year: int
    balances: list[LeaveBalanceRead]


# ── Leave Request Schemas ────────────────────────────────────────────────────

class LeaveRequestCreate(BaseModel):
    employee_id: str
    leave_type_id: int
    # The reliever is the approver chosen for the workflow's requester_pick step.
    # It may be omitted when picked_approvers is supplied — it is derived from it.
    reliever_id: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None  # optional for open-ended types (e.g. Sick Leave)
    request_type: str = "self"  # "self" or "others"
    reason: Optional[str] = None
    document_id: Optional[int] = None
    picked_approvers: Optional[dict[int, str]] = None  # {step_number: employee_id} for requester_pick steps
    # Start the approval workflow in the SAME transaction as the create. Without
    # this the caller has to make a second call, and a failure between the two
    # leaves a row that reads "Pending" but sits in no workflow — invisible to
    # approvers and duplicated on every retry.
    submit_for_approval: bool = True


class LeaveRequestSubmit(BaseModel):
    """Body for submit-for-approval — carries the requester's approver picks."""
    picked_approvers: Optional[dict[int, str]] = None  # {step_number: employee_id}


class LeaveRequestRead(BaseModel):
    id: str
    reference: str
    employee_id: str
    employee_name: Optional[str] = None
    employee_no: Optional[str] = None
    requester_id: Optional[str] = None
    requester_name: Optional[str] = None
    requester_job_title: Optional[str] = None
    leave_type_id: int
    leave_type_name: Optional[str] = None
    reliever_id: Optional[str] = None
    reliever_name: Optional[str] = None
    request_type: Optional[str] = None
    department: Optional[str] = None
    job_title: Optional[str] = None
    employee_department: Optional[str] = None
    document: Optional[DocumentInfo] = None
    start_date: date
    end_date: date
    days: int
    reason: Optional[str] = None
    status: str
    approval_request_id: Optional[str] = None
    next_actor_name: Optional[str] = None      # who currently holds the request (pending step assignee)
    current_step_name: Optional[str] = None    # name of the current pending step
    open_ended: bool = False                   # leave type has no fixed end date
    returned_at: Optional[datetime] = None     # set when the employee marked they are back
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class LeaveMarkReturned(BaseModel):
    """Body for marking an open-ended leave as returned (finalizes the End Date)."""
    end_date: date  # the last day of leave (employee resumes work the next day)


# ── Payslip Schemas ──────────────────────────────────────────────────────────

class PayslipGenerate(BaseModel):
    period: str                # e.g. "April 2026"
    year: int
    employee_ids: list[str]    # which employees to generate for (from the preview)


class PayslipRead(BaseModel):
    id: str
    payroll_ref: Optional[str] = None
    employee_id: str
    employee_name: Optional[str] = None
    emp_code: Optional[str] = None
    department: Optional[str] = None
    period: str
    year: int
    basic: float
    housing: float
    transport: float
    meal: float
    paye: float
    pension: float
    nhf: float
    loan: float
    loan_description: Optional[str] = None
    loan_total: Optional[float] = None
    loan_outstanding: Optional[float] = None
    net: float
    payroll_status: str
    prepared_by: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Employee Loan Schemas ─────────────────────────────────────────────────────

_LOAN_MODES = {"one_off", "installment", "standing"}
_LOAN_STATUSES = {"active", "completed", "cancelled"}


class LoanCreate(BaseModel):
    mode: str                                   # one_off | installment | standing
    monthly_amount: float = Field(..., gt=0)    # per-run deduction
    total_amount: Optional[float] = Field(None, gt=0)   # full debt; omit for standing
    start_period_yyyymm: Optional[int] = None   # e.g. 202607; omit ⇒ from first run
    description: Optional[str] = Field(None, max_length=255)

    @model_validator(mode="after")
    def _check_mode(self):
        if self.mode not in _LOAN_MODES:
            raise ValueError("mode must be one_off, installment or standing")
        if self.mode == "standing":
            if self.total_amount is not None:
                raise ValueError("standing loans must not set a total_amount")
        elif self.mode == "one_off":
            if self.total_amount is None:
                self.total_amount = self.monthly_amount   # deduct once
            elif abs(self.total_amount - self.monthly_amount) > 1e-6:
                raise ValueError("one_off total_amount must equal monthly_amount")
        else:  # installment
            if self.total_amount is None:
                raise ValueError("installment loans require a total_amount")
            if self.total_amount < self.monthly_amount:
                raise ValueError("total_amount must be greater than or equal to monthly_amount")
        return self


class LoanUpdate(BaseModel):
    monthly_amount: Optional[float] = Field(None, gt=0)
    total_amount: Optional[float] = Field(None, gt=0)
    start_period_yyyymm: Optional[int] = None
    description: Optional[str] = Field(None, max_length=255)
    status: Optional[str] = None                 # active | completed | cancelled

    @model_validator(mode="after")
    def _check_status(self):
        if self.status is not None and self.status not in _LOAN_STATUSES:
            raise ValueError("status must be active, completed or cancelled")
        return self


class LoanRead(BaseModel):
    id: str
    employee_id: str
    description: Optional[str] = None
    mode: str
    monthly_amount: float
    total_amount: Optional[float] = None
    start_period_yyyymm: Optional[int] = None
    status: str
    amount_repaid: float = 0            # sum of charges booked so far
    outstanding: Optional[float] = None  # total_amount − amount_repaid; None for standing
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class LoanChargeRead(BaseModel):
    """One repayment booked against a loan for a payroll period (history row)."""
    id: str
    loan_id: str
    period: str
    year: int
    amount: float
    payslip_id: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
