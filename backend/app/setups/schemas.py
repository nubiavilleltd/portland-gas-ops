from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# ── Department ─────────────────────────────────────────────────────────────────

class DepartmentCreate(BaseModel):
    name: str
    code: str
    hod_id: Optional[str] = None
    parent_dept_id: Optional[str] = None

class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    hod_id: Optional[str] = None
    parent_dept_id: Optional[str] = None
    is_active: Optional[bool] = None

class DepartmentListItem(BaseModel):
    id: str
    name: str
    code: str
    is_active: bool
    hod_id: Optional[str]
    parent_dept_id: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class DepartmentDetail(DepartmentListItem):
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# ── Group ──────────────────────────────────────────────────────────────────────

class GroupCreate(BaseModel):
    name: str
    description: Optional[str] = None
    group_type: str = "general"

class GroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class GroupListItem(BaseModel):
    id: str
    name: str
    description: Optional[str]
    group_type: str
    is_active: bool
    member_count: int
    created_at: datetime

    class Config:
        from_attributes = True

class MemberOut(BaseModel):
    id: str
    employee_id: str
    employee_name: str
    employee_no: str
    job_title: Optional[str]
    department: Optional[str]

    class Config:
        from_attributes = True

class GroupDetail(BaseModel):
    id: str
    name: str
    description: Optional[str]
    group_type: str
    is_active: bool
    created_at: datetime
    members: list[MemberOut]

    class Config:
        from_attributes = True

class AddMember(BaseModel):
    employee_id: str
