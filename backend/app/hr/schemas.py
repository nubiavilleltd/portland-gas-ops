from pydantic import BaseModel, Field
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


# ── Full update (all fields optional) ────────────────────────────────────────

class LeaveTypeUpdate(BaseModel):
    leave_type_name: Optional[str] = Field(None, min_length=1, max_length=100)
    entitlement_days: Optional[int] = Field(None, ge=0)
    description: Optional[str] = None
    is_active: Optional[bool] = None
    is_uncapped: Optional[bool] = None
    open_ended: Optional[bool] = None


# ── Response (returned to client) ────────────────────────────────────────────

class LeaveTypeRead(BaseModel):
    id: int
    leave_type_name: str
    entitlement_days: int
    description: Optional[str]
    is_active: bool
    is_uncapped: bool = False
    open_ended: bool = False
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
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


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
    net: float
    payroll_status: str
    prepared_by: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
