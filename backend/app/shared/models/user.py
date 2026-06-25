from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum
from app.core.database import Base


class UserRole(str, enum.Enum):
    super_admin  = "super_admin"
    admin        = "admin"
    # Legacy roles kept for existing approval workflow — do not use for new features
    approver_l1  = "approver_l1"
    approver_l2  = "approver_l2"
    approver_l3  = "approver_l3"
    staff        = "staff"
    viewer       = "viewer"


class AccountStatus(str, enum.Enum):
    pending     = "pending"      # Created by IT, employee hasn't set password yet
    active      = "active"       # Employee has set password and is active
    deactivated = "deactivated"  # Manually disabled by admin


class User(Base):
    __tablename__ = "users"

    id              = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    first_name      = Column(String(100), nullable=True)   # nullable during migration of existing rows
    last_name       = Column(String(100), nullable=True)
    name            = Column(String(255), nullable=True)   # legacy — kept for backward compat, use first_name+last_name going forward
    email           = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role            = Column(SAEnum(UserRole), nullable=False, default=UserRole.staff)
    account_status  = Column(SAEnum(AccountStatus), nullable=False, default=AccountStatus.active)
    profile_picture_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    last_login         = Column(DateTime(timezone=True), nullable=True)

    # Account setup token (replaces OTP for IT-created employee onboarding)
    setup_token            = Column(String(64), nullable=True, index=True)
    setup_token_expires_at = Column(DateTime(timezone=True), nullable=True)

    # Legacy field — kept for backward compat with existing routers
    phone       = Column(String(20), nullable=True)

    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    employee        = relationship("Employee", back_populates="user", uselist=False)
    profile_picture = relationship("Document", foreign_keys=[profile_picture_id])

    @property
    def full_name(self) -> str:
        """Returns first + last name. Falls back to legacy name field."""
        if self.first_name or self.last_name:
            return f"{self.first_name or ''} {self.last_name or ''}".strip()
        return self.name or ""

    @property
    def profile_picture_url(self) -> str | None:
        """Returns the Cloudinary URL of the profile picture, or None."""
        if self.profile_picture and self.profile_picture.file_path:
            return self.profile_picture.file_path
        return None
