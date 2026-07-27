from sqlalchemy import Column, DateTime, Integer, String, UniqueConstraint
from sqlalchemy.sql import func

from app.core.database import Base


class ReferenceCounter(Base):
    __tablename__ = "reference_counters"
    __table_args__ = (
        UniqueConstraint("entity_type", "year", name="uq_reference_counters_entity_year"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    entity_type = Column(String(100), nullable=False, index=True)
    year = Column(Integer, nullable=False, index=True)
    next_number = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
