from __future__ import annotations
from sqlalchemy import Column, String, Text, DateTime, Enum as SAEnum, Integer, JSON, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_log"

    id               = Column(Integer, primary_key=True, autoincrement=True)
    entity_type      = Column(SAEnum("order", "trip", "invoice", "inventory_item", name="auditentitytype"), nullable=False)
    entity_id        = Column(String(36), nullable=False)       # UUID or entity_no — polymorphic
    action           = Column(String(100), nullable=False)
    description      = Column(Text, nullable=False)
    actor_type       = Column(SAEnum("employee", "system", "customer", name="auditactortype"), nullable=False)
    actor_employee_id = Column(String(36), nullable=True)       # nullable FK — no hard constraint (employee may be deleted)
    actor_name       = Column(String(255), nullable=True)       # snapshot — never changes
    metadata_        = Column("metadata", JSON, nullable=True)
    created_at       = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)