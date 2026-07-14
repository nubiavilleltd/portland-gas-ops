"""
Setups models — Departments, Groups, and GroupMembers.
"""

import uuid
from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Department(Base):
    __tablename__ = "departments"

    id             = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name           = Column(String(150), nullable=False, unique=True)   # display name, e.g. "HSE"
    code           = Column(String(50),  nullable=False, unique=True)   # stable key, e.g. "safety"
    is_active      = Column(Boolean, default=True, nullable=False)
    hod_id         = Column(CHAR(36), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    parent_dept_id = Column(CHAR(36), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())
    updated_at     = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    hod      = relationship("Employee", foreign_keys=[hod_id])
    parent   = relationship("Department", remote_side="Department.id", foreign_keys=[parent_dept_id])
    children = relationship("Department", foreign_keys=[parent_dept_id], back_populates="parent")


class Group(Base):
    __tablename__ = "org_groups"

    id          = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name        = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    group_type  = Column(String(50), nullable=False, default="general")
    is_active   = Column(Boolean, nullable=False, default=True)
    created_by  = Column(CHAR(36), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), onupdate=func.now())

    members = relationship("GroupMember", back_populates="group", cascade="all, delete-orphan")


class GroupMember(Base):
    __tablename__ = "group_members"

    id          = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    group_id    = Column(CHAR(36), ForeignKey("org_groups.id", ondelete="CASCADE"), nullable=False)
    employee_id = Column(CHAR(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    added_at    = Column(DateTime(timezone=True), server_default=func.now())

    group    = relationship("Group", back_populates="members")
    employee = relationship("Employee", foreign_keys=[employee_id])
