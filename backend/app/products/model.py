from __future__ import annotations

from sqlalchemy import Column, String, Text, Numeric, Integer, DateTime, Enum as SAEnum, ForeignKey
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from app.core.database import Base          # ← your project uses app.database, not app.core.database
from app.products.enums import ProductType, ProductUnit, ProductStatus


class Product(Base):
    __tablename__ = "products"

    id                  = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_no = Column(String(50), unique=True, nullable=True, index=True)
    name                = Column(String(255), nullable=False, index=True)
    code                = Column(String(50), nullable=True, unique=True, index=True)
    description         = Column(Text, nullable=True)
    product_type        = Column(SAEnum(ProductType), nullable=False, default=ProductType.consumable)
    unit                = Column(SAEnum(ProductUnit), nullable=False, default=ProductUnit.kg)
    default_unit_price  = Column(Numeric(15, 2), nullable=False)
    minimum_stock       = Column(Numeric(15, 2), nullable=True)
    primary_document_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    status              = Column(SAEnum(ProductStatus), nullable=False, default=ProductStatus.active, index=True)
    created_at          = Column(DateTime(timezone=True), server_default=func.now())
    updated_at          = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    primary_image = relationship("Document", foreign_keys=[primary_document_id])