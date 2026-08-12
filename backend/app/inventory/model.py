from __future__ import annotations
import uuid

from sqlalchemy import (
    Column,
    String,
    Text,
    Numeric,
    DateTime,
    Date,
    Boolean,
    Integer,
    Enum as SAEnum,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base
from app.inventory.enums import (
    InventoryItemStatus,
    InventoryItemCondition,
    DispositionStatus,
    MovementType,
    ReferenceType,
)


class WarehouseLocation(Base):
    __tablename__ = "warehouse_locations"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    location_no = Column(String(50), unique=True, nullable=False)

    name = Column(String(255), unique=True, nullable=False)
    address = Column(Text, nullable=True)

    is_default = Column(Boolean, nullable=False, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    inventory_items = relationship(
        "InventoryItem",
        back_populates="location",
    )

    consumable_stock = relationship(
        "ConsumableStock",
        back_populates="location",
    )

    stock_movements = relationship(
        "StockMovement",
        back_populates="location",
    )


class InventoryItem(Base):
    """
    Represents ONE physical tracked asset.

    Consumables are NOT stored here.
    """

    __tablename__ = "inventory_items"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    product_id = Column(
        CHAR(36),
        ForeignKey("products.id", ondelete="RESTRICT"),
        nullable=False,
    )

    tag_number = Column(
        String(100),
        unique=True,
        nullable=False,
    )

    serial_number = Column(
        String(100),
        nullable=True,
    )

    status = Column(
        SAEnum(InventoryItemStatus),
        nullable=False,
        default=InventoryItemStatus.available,
    )

    condition = Column(
        SAEnum(InventoryItemCondition),
        nullable=False,
        default=InventoryItemCondition.new,
    )

    disposition = Column(
        SAEnum(DispositionStatus),
        nullable=True,
    )

    location_id = Column(
        CHAR(36),
        ForeignKey("warehouse_locations.id", ondelete="RESTRICT"),
        nullable=False,
    )

    # Current allocation
    order_id = Column(
        CHAR(36),
        ForeignKey("orders.id", ondelete="SET NULL"),
        nullable=True,
    )

    trip_id = Column(
        CHAR(36),
        ForeignKey("trips.id", ondelete="SET NULL"),
        nullable=True,
    )

    customer_id = Column(
        CHAR(36),
        ForeignKey("customers.id", ondelete="SET NULL"),
        nullable=True,
    )

    checked_out_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    expected_return_date = Column(
        Date,
        nullable=True,
    )

    received_into_inventory_at = Column(
        Date,
        nullable=False,
    )

    returned_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    notes = Column(
        Text,
        nullable=True,
    )

    product = relationship("Product", foreign_keys=[product_id])

    location = relationship(
        "WarehouseLocation",
        back_populates="inventory_items",
    )

    order = relationship(
        "Order",
        foreign_keys=[order_id],
    )

    trip = relationship(
        "Trip",
        foreign_keys=[trip_id],
    )

    customer = relationship(
        "Customers",
        foreign_keys=[customer_id],
    )


class ConsumableStock(Base):
    """
    Quantity of consumable inventory at a warehouse location.
    """

    __tablename__ = "consumable_stock"

    __table_args__ = (
        UniqueConstraint(
            "product_id",
            "location_id",
            name="uq_consumable_stock_product_location",
        ),
    )

    id = Column(
        CHAR(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    product_id = Column(
        CHAR(36),
        ForeignKey("products.id", ondelete="RESTRICT"),
        nullable=False,
    )

    location_id = Column(
        CHAR(36),
        ForeignKey("warehouse_locations.id", ondelete="RESTRICT"),
        nullable=False,
    )

    quantity = Column(
        Numeric(15, 3),
        nullable=False,
        default=0,
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    product = relationship("Product", foreign_keys=[product_id])

    location = relationship(
        "WarehouseLocation",
        back_populates="consumable_stock",
    )


class StockMovement(Base):
    """
    Inventory audit trail.
    """

    __tablename__ = "stock_movements"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    movement_no = Column(String(50), unique=True, nullable=False)

    product_id = Column(
        CHAR(36),
        ForeignKey("products.id", ondelete="RESTRICT"),
        nullable=False,
    )

    movement_type = Column(
        SAEnum(MovementType),
        nullable=False,
    )

    quantity = Column(
        Numeric(15, 3),
        nullable=False,
    )

    reference_id = Column(
        String(36),
        nullable=True,
    )

    reference_type = Column(
        SAEnum(ReferenceType),
        nullable=True,
    )

    location_id = Column(
        CHAR(36),
        ForeignKey("warehouse_locations.id", ondelete="RESTRICT"),
        nullable=False,
    )

    notes = Column(
        Text,
        nullable=True,
    )

    recorded_by = Column(
        CHAR(36),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    recorded_by_name = Column(
        String(255),
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    product = relationship("Product", foreign_keys=[product_id])

    location = relationship(
        "WarehouseLocation",
        back_populates="stock_movements",
    )

    items = relationship(
        "StockMovementItem",
        back_populates="movement",
        cascade="all, delete-orphan",
    )


class StockMovementItem(Base):
    __tablename__ = "stock_movement_items"

    id = Column(Integer, primary_key=True, autoincrement=True)

    movement_id = Column(
        CHAR(36),
        ForeignKey("stock_movements.id", ondelete="CASCADE"),
        nullable=False,
    )

    inventory_item_id = Column(
        CHAR(36),
        ForeignKey("inventory_items.id", ondelete="RESTRICT"),
        nullable=False,
    )

    movement = relationship(
        "StockMovement",
        back_populates="items",
    )

    inventory_item = relationship("InventoryItem")


class OrderItemInventory(Base):
    __tablename__ = "order_item_inventory"

    __table_args__ = (
        UniqueConstraint(
            "order_item_id",
            "inventory_item_id",
            name="uq_order_item_inventory",
        ),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)

    order_item_id = Column(
        Integer,
        ForeignKey("order_items.id", ondelete="CASCADE"),
        nullable=False,
    )

    inventory_item_id = Column(
        CHAR(36),
        ForeignKey("inventory_items.id", ondelete="RESTRICT"),
        nullable=False,
    )

    order_item = relationship(
        "OrderItem",
        back_populates="inventory_assignments",
    )
    inventory_item = relationship("InventoryItem")

