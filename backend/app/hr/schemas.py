from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date


# ── Leave Type Schemas ───────────────────────────────────────────────────────

# ── Create (HR admin submits this) ───────────────────────────────────────────

class LeaveTypeCreate(BaseModel):
    leave_type_name: str = Field(..., min_length=1, max_length=100)
    entitlement_days: int = Field(..., gt=0)
    description: Optional[str] = None
    is_active: bool = True


# ── Full update (all fields optional) ────────────────────────────────────────

class LeaveTypeUpdate(BaseModel):
    leave_type_name: Optional[str] = Field(None, min_length=1, max_length=100)
    entitlement_days: Optional[int] = Field(None, gt=0)
    description: Optional[str] = None
    is_active: Optional[bool] = None


# ── Response (returned to client) ────────────────────────────────────────────

class LeaveTypeRead(BaseModel):
    id: int
    leave_type_name: str
    entitlement_days: int
    description: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Leave Request Schemas ────────────────────────────────────────────────────

class LeaveRequestCreate(BaseModel):
    employee_id: str
    leave_type_id: int
    reliever_id: str
    start_date: date
    end_date: date
    request_type: str = "self"  # "self" or "others"
    reason: Optional[str] = None
    document_id: Optional[int] = None


class LeaveRequestRead(BaseModel):
    id: str
    reference: str
    employee_id: str
    employee_name: Optional[str] = None
    employee_no: Optional[str] = None
    requester_id: Optional[str] = None
    requester_name: Optional[str] = None
    leave_type_id: int
    leave_type_name: Optional[str] = None
    reliever_id: Optional[str] = None
    reliever_name: Optional[str] = None
    request_type: Optional[str] = None
    department: Optional[str] = None
    employee_department: Optional[str] = None
    start_date: date
    end_date: date
    days: int
    reason: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
