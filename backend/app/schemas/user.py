from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.user import UserRole


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.staff
    phone: Optional[str] = None


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None


class UserResponse(BaseModel):
    id: str
    name: Optional[str]
    first_name: Optional[str]
    last_name: Optional[str]
    email: str
    role: UserRole
    phone: Optional[str]
    profile_picture_url: Optional[str]
    account_status: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChangePassword(BaseModel):
    current_password: str
    new_password: str
