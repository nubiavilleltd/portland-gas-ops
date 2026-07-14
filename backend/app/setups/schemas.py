from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class GroupCreate(BaseModel):
    name:        str            = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    group_type:  str            = Field("general", max_length=50)


class GroupUpdate(BaseModel):
    name:        Optional[str]  = Field(None, min_length=1, max_length=100)
    description: Optional[str]  = None
    group_type:  Optional[str]  = Field(None, max_length=50)
    is_active:   Optional[bool] = None


class AddMember(BaseModel):
    employee_id: str


class MemberOut(BaseModel):
    id:            str
    employee_id:   str
    employee_name: str
    employee_no:   str
    job_title:     Optional[str]
    department:    Optional[str]

    class Config:
        from_attributes = True


class GroupListItem(BaseModel):
    id:           str
    name:         str
    description:  Optional[str]
    group_type:   str
    is_active:    bool
    member_count: int
    created_at:   datetime

    class Config:
        from_attributes = True


class GroupDetail(BaseModel):
    id:          str
    name:        str
    description: Optional[str]
    group_type:  str
    is_active:   bool
    created_at:  datetime
    members:     List[MemberOut] = []

    class Config:
        from_attributes = True
