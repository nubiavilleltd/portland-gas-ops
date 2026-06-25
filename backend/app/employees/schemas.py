from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, datetime
from decimal import Decimal
from app.employees.models import Department, EmploymentType


# ── Document returned from employee's document list ───────────────────────────

class DocumentResponse(BaseModel):
    id:        int
    name:      str               # original filename
    category:  Optional[str]     # document type label (e.g. "Employment Contract")
    file_path: Optional[str]     # Cloudinary URL — None for folders
    file_size: Optional[int]     # bytes
    mime_type: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Nested user info returned inside employee responses ───────────────────────

class UserInEmployee(BaseModel):
    id:                   str
    first_name:           Optional[str]
    last_name:            Optional[str]
    email:                str
    role:                 str
    profile_picture_id:   Optional[int]
    profile_picture_url:  Optional[str]   # resolved Cloudinary URL
    account_status:       str
    last_login:           Optional[datetime]

    class Config:
        from_attributes = True


# ── Create (IT admin submits this) ────────────────────────────────────────────

class EmployeeCreate(BaseModel):
    # User fields — creates the login account
    first_name: str
    last_name:  str
    email:      EmailStr
    role:       str = "admin"   # system role: super_admin | admin

    # Employee fields
    job_title:        Optional[str]           = None
    department:       Optional[Department]    = None
    phone:            Optional[str]           = None
    birthday:         Optional[date]          = None
    employment_type:  Optional[EmploymentType] = None
    hire_date:        Optional[date]          = None
    operating_manager_id:  Optional[str]           = None

    # Payroll
    basic_salary:        Optional[Decimal] = None
    housing_allowance:   Optional[Decimal] = None
    transport_allowance: Optional[Decimal] = None
    meal_allowance:      Optional[Decimal] = None
    paye:                Optional[Decimal] = None
    pension:             Optional[Decimal] = None
    nhf:                 Optional[Decimal] = None
    loan_repayment:      Optional[Decimal] = None


# ── Full update (admin) ───────────────────────────────────────────────────────

class EmployeeUpdate(BaseModel):
    first_name:       Optional[str]           = None
    last_name:        Optional[str]           = None
    job_title:        Optional[str]           = None
    department:       Optional[Department]    = None
    phone:            Optional[str]           = None
    birthday:         Optional[date]          = None
    employment_type:  Optional[EmploymentType] = None
    hire_date:        Optional[date]          = None
    operating_manager_id:  Optional[str]           = None

    basic_salary:        Optional[Decimal] = None
    housing_allowance:   Optional[Decimal] = None
    transport_allowance: Optional[Decimal] = None
    meal_allowance:      Optional[Decimal] = None
    paye:                Optional[Decimal] = None
    pension:             Optional[Decimal] = None
    nhf:                 Optional[Decimal] = None
    loan_repayment:      Optional[Decimal] = None


# ── Self-update (employee updates own profile) ────────────────────────────────

class EmployeeProfileUpdate(BaseModel):
    phone:              Optional[str] = None
    profile_picture_id: Optional[int] = None   # document ID from the users folder in doc library


# ── Nested manager info returned in employee responses ────────────────────────

class OperatingManagerInfo(BaseModel):
    id:          str
    employee_no: str
    job_title:   Optional[str]
    department:  Optional[Department]
    user:        Optional[UserInEmployee]

    class Config:
        from_attributes = True


# ── Response ──────────────────────────────────────────────────────────────────

class EmployeeResponse(BaseModel):
    id:              str
    user_id:         str
    employee_no:     str
    job_title:       Optional[str]
    department:      Optional[Department]
    phone:           Optional[str]
    birthday:        Optional[date]
    employment_type: Optional[EmploymentType]
    hire_date:       Optional[date]
    operating_manager_id: Optional[str]
    operating_manager:    Optional[OperatingManagerInfo]

    # Payroll — only returned for admin / self
    basic_salary:        Optional[Decimal]
    housing_allowance:   Optional[Decimal]
    transport_allowance: Optional[Decimal]
    meal_allowance:      Optional[Decimal]
    paye:                Optional[Decimal]
    pension:             Optional[Decimal]
    nhf:                 Optional[Decimal]
    loan_repayment:      Optional[Decimal]

    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    user: Optional[UserInEmployee]

    class Config:
        from_attributes = True


# ── List item ─────────────────────────────────────────────────────────────────

class EmployeeListItem(BaseModel):
    id:              str
    employee_no:     str
    job_title:       Optional[str]
    department:      Optional[Department]
    phone:           Optional[str]
    birthday:        Optional[date]
    employment_type: Optional[EmploymentType]
    hire_date:       Optional[date]
    operating_manager_id: Optional[str]
    operating_manager:    Optional[OperatingManagerInfo]

    # Payroll
    basic_salary:        Optional[Decimal]
    housing_allowance:   Optional[Decimal]
    transport_allowance: Optional[Decimal]
    meal_allowance:      Optional[Decimal]
    paye:                Optional[Decimal]
    pension:             Optional[Decimal]
    nhf:                 Optional[Decimal]
    loan_repayment:      Optional[Decimal]

    user: Optional[UserInEmployee]

    class Config:
        from_attributes = True
