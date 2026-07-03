from sqlalchemy import Column, String, DateTime, Enum as SAEnum
from sqlalchemy.sql import func
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.orm import relationship
import uuid

from app.core.database import Base
from app.customers.enums import CustomerType, CustomerStatus


class Customer(Base):
    __tablename__ = "customers"

    id          = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_no = Column(String(50), unique=True, nullable=False, index=True)
    name        = Column(String(255), nullable=False, index=True)
    type        = Column(SAEnum(CustomerType), nullable=False, default=CustomerType.corporate)
    email       = Column(String(255), unique=True, nullable=True, index=True)
    phone       = Column(String(50), nullable=True)
    address     = Column(String(500), nullable=True)
    status      = Column(SAEnum(CustomerStatus), nullable=False, default=CustomerStatus.active, index=True)

    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships (added as domain tables are created)
    orders = relationship("Order", back_populates="customer")