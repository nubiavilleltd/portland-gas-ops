from __future__ import annotations

import uuid

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base
from app.products.enums import InventoryTracking, ProductStatus


class ProductCategory(Base):
    __tablename__ = "product_categories"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), unique=True, nullable=False)
    parent_id = Column(
        CHAR(36),
        ForeignKey("product_categories.id", ondelete="SET NULL"),
        nullable=True,
    )
    is_active = Column(Boolean, nullable=False, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    parent = relationship(
        "ProductCategory",
        remote_side=[id],
        foreign_keys=[parent_id],
    )
    children = relationship(
        "ProductCategory",
        back_populates="parent",
        foreign_keys=[parent_id],
    )
    products = relationship("Product", back_populates="category")


class ProductUnit(Base):
    __tablename__ = "product_units"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(
        String(20, collation="utf8mb4_bin"),
        unique=True,
        nullable=False,
    )
    label = Column(String(100), nullable=False)
    category = Column(String(50), nullable=True)
    is_system = Column(Boolean, nullable=False, default=False)
    is_active = Column(Boolean, nullable=False, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    products = relationship("Product", back_populates="unit")


class Product(Base):
    __tablename__ = "products"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_no = Column(String(50), unique=True, nullable=False, index=True)

    name = Column(String(255), nullable=False, index=True)

    # SKU — optional, unique when present
    code = Column(String(50), unique=True, nullable=True, index=True)

    # Tag prefix — required for INDIVIDUAL_ITEMS products, unique, immutable
    # once inventory exists. Nullable at the DB level because STOCK_QUANTITY
    # products don't use it.
    tag_prefix = Column(String(50), unique=True, nullable=True, index=True)

    description = Column(Text, nullable=True)

    inventory_tracking = Column(
        SAEnum(
            InventoryTracking,
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
        ),
        nullable=False,
    )

    category_id = Column(
        CHAR(36),
        ForeignKey("product_categories.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    unit_id = Column(
        CHAR(36),
        ForeignKey("product_units.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    default_unit_price = Column(Numeric(15, 2), nullable=False)
    minimum_stock = Column(Numeric(15, 2), nullable=True)

    primary_document_id = Column(
        Integer,
        ForeignKey("documents.id", ondelete="SET NULL"),
        nullable=True,
    )

    status = Column(
        SAEnum(ProductStatus),
        nullable=False,
        default=ProductStatus.active,
        index=True,
    )

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationships
    category = relationship("ProductCategory", back_populates="products")
    unit = relationship("ProductUnit", back_populates="products")

    primary_image = relationship(
        "Document",
        foreign_keys=[primary_document_id],
    )