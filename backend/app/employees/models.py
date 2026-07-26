from sqlalchemy import (
    Column, String, Date, Numeric, DateTime, Enum as SAEnum,
    ForeignKey,
)
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum
from app.core.database import Base


class EmploymentType(str, enum.Enum):
    full_time = "Full-time"
    part_time = "Part-time"
    contract  = "Contract"
    intern    = "Intern"


class Employee(Base):
    __tablename__ = "employees"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(CHAR(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    employee_no = Column(String(20), unique=True, nullable=False, index=True)  # e.g. PG-EMP-0001

    # Job info
    job_title        = Column(String(150), nullable=True)
    department_id    = Column(CHAR(36), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    phone            = Column(String(20), nullable=True)
    birthday         = Column(Date, nullable=True)
    employment_type  = Column(SAEnum(EmploymentType), nullable=True)
    hire_date        = Column(Date, nullable=True)
    operating_manager_id  = Column(CHAR(36), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)

    # Payroll (stored in NGN, 2 decimal places)
    basic_salary         = Column(Numeric(15, 2), nullable=True)
    housing_allowance    = Column(Numeric(15, 2), nullable=True)
    transport_allowance  = Column(Numeric(15, 2), nullable=True)
    meal_allowance       = Column(Numeric(15, 2), nullable=True)
    paye                 = Column(Numeric(15, 2), nullable=True)
    pension              = Column(Numeric(15, 2), nullable=True)
    nhf                  = Column(Numeric(15, 2), nullable=True)
    loan_repayment       = Column(Numeric(15, 2), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user             = relationship("User", back_populates="employee")
    department_rel   = relationship("Department", foreign_keys=[department_id])
    operating_manager = relationship("Employee", remote_side="Employee.id", foreign_keys=[operating_manager_id])
    direct_reports = relationship("Employee", foreign_keys=[operating_manager_id], back_populates="operating_manager")
    documents    = relationship("Document", back_populates="uploaded_by_employee", foreign_keys="Document.uploaded_by")
    driver = relationship("Driver", back_populates="employee", uselist=False)

    @property
    def department(self) -> str | None:
        """Convenience accessor — returns the department display name (for serializers)."""
        return self.department_rel.name if self.department_rel else None
