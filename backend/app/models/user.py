from sqlalchemy import Column, String, Boolean, DateTime, Enum as SAEnum
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.sql import func
import uuid
import enum
from app.database import Base


class UserRole(str, enum.Enum):
    super_admin = "super_admin"
    admin = "admin"
    approver_l1 = "approver_l1"
    approver_l2 = "approver_l2"
    approver_l3 = "approver_l3"
    staff = "staff"
    viewer = "viewer"


class Department(str, enum.Enum):
    operations = "operations"
    finance = "finance"
    safety = "safety"
    hr = "hr"
    it = "it"
    logistics = "logistics"
    executive = "executive"
    engineering = "engineering"


class User(Base):
    __tablename__ = "users"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), nullable=False, default=UserRole.staff)
    department = Column(SAEnum(Department), nullable=True)
    phone = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
