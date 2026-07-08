from __future__ import annotations
import uuid

from sqlalchemy import (
    Column,
    Date,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mysql import CHAR

from app.core.database import Base
from app.fleet.drivers.enums import DriverStatus
import uuid


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    driver_no = Column(String(50), unique=True, nullable=False)

    employee_id = Column(
        CHAR(36),
        ForeignKey("employees.id", ondelete="RESTRICT"),
        nullable=False,
        unique=True,
    )

    license_number = Column(String(100), unique=True, nullable=False)
    license_expiry_date = Column(Date, nullable=False)

    experience_years = Column(Integer, nullable=False, default=0)

    profile_image_document_id = Column(
        Integer,
        ForeignKey("documents.id", ondelete="SET NULL"),
        nullable=True,
    )

    status = Column(
        SAEnum(DriverStatus),
        nullable=False,
        default=DriverStatus.available,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    employee = relationship(
        "Employee",
        foreign_keys=[employee_id],
    )

    profile_image = relationship(
        "Document",
        foreign_keys=[profile_image_document_id],
    )

    trips = relationship(
        "Trip",
        back_populates="driver",
    )