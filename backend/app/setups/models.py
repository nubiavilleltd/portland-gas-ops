"""
Setups models — Groups and GroupMembers.

Groups are named lists of employees that can be used:
  - In workflow steps (requester_pick assignee type)
  - Outside workflows (e.g. SODA committees, review panels)

All groups created here are available as approvers in the workflow step builder.
"""

import uuid
from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Group(Base):
    __tablename__ = "groups"

    id          = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name        = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    group_type  = Column(String(50), nullable=False, default="general")  # general | committee | etc.
    is_active   = Column(Boolean, nullable=False, default=True)
    created_by  = Column(CHAR(36), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), onupdate=func.now())

    members = relationship("GroupMember", back_populates="group", cascade="all, delete-orphan")


class GroupMember(Base):
    __tablename__ = "group_members"

    id          = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    group_id    = Column(CHAR(36), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    employee_id = Column(CHAR(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    added_at    = Column(DateTime(timezone=True), server_default=func.now())

    group    = relationship("Group", back_populates="members")
    employee = relationship("Employee", foreign_keys=[employee_id])
