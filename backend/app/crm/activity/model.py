from __future__ import annotations

import enum
import uuid

from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    ForeignKey,
    JSON,
    String,
    Text,
    func,
)

from app.core.database import Base


class CRMActivityEntityType(str, enum.Enum):
    customer = "customer"
    contact = "contact"
    complaint = "complaint"
    visit = "visit"
    task = "task"
    communication = "communication"
    service_request = "service_request"


class CRMActivityActorType(str, enum.Enum):
    employee = "employee"
    system = "system"
    customer = "customer"


class CRMActivityLog(Base):
    __tablename__ = "crm_activity_log"

    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    customer_id = Column(
        String(36),
        ForeignKey("customers_temp.id"),
        nullable=False,
        index=True,
    )

    entity_type = Column(
        Enum(CRMActivityEntityType),
        nullable=False,
        index=True,
    )

    entity_id = Column(
        String(36),
        nullable=False,
        index=True,
    )

    action = Column(
        String(100),
        nullable=False,
    )

    description = Column(
        Text,
        nullable=False,
    )

    actor_type = Column(
        Enum(CRMActivityActorType),
        nullable=False,
        default=CRMActivityActorType.employee,
    )

    actor_employee_id = Column(
        String(36),
        ForeignKey("employees.id"),
        nullable=True,
        index=True,
    )

    actor_name = Column(
        String(255),
        nullable=True,
    )

    metadata_ = Column(
        "metadata",
        JSON,
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )