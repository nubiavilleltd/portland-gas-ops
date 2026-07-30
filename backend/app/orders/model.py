from __future__ import annotations
import uuid
from sqlalchemy import Column, String, Text, Numeric, DateTime, Date, Enum as SAEnum, ForeignKey, Integer
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy import UniqueConstraint
from app.core.database import Base
from app.orders.enums import OrderStatus, FulfillmentStatus
from app.payments.enums import PaymentStatus
from app.inventory.enums import DispositionStatus
from app.orders.enums import DiscountType


class Order(Base):
    __tablename__ = "orders"

    id                  = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_no            = Column(String(50), unique=True, nullable=True, index=True)
    customer_id         = Column(CHAR(36), ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False)
    customer_name = Column(String(255), nullable=False)  # historical snapshot
    order_status        = Column(SAEnum(OrderStatus), nullable=False, default=OrderStatus.draft)
    fulfillment_status  = Column(SAEnum(FulfillmentStatus), nullable=False, default=FulfillmentStatus.pending)
    payment_status      = Column(SAEnum(PaymentStatus), nullable=False, default=PaymentStatus.unpaid)
    delivery_address    = Column(Text, nullable=True)
    delivery_date       = Column(Date, nullable=True)
    notes               = Column(Text, nullable=True)
    total_amount        = Column(Numeric(15, 2), nullable=False, default=0)
    discount_type = Column(
        SAEnum(DiscountType),
        nullable=False,
        default=DiscountType.none,
    )
    discount_value = Column(
        Numeric(15, 2),
        nullable=False,
        default=0,
    )

    discount_amount = Column(
        Numeric(15, 2),
        nullable=False,
        default=0,
    )
    cancellation_reason = Column(Text, nullable=True)
    cancelled_at        = Column(DateTime(timezone=True), nullable=True)
    # trip_id — no FK yet, trips table doesn't exist. Added as plain string ref
    trip_id             = Column(CHAR(36), nullable=True)
    # invoice_id — set when invoice is generated, FK added when invoices table exists
    invoice_id          = Column(CHAR(36), nullable=True)
    confirmed_by        = Column(CHAR(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    confirmed_at        = Column(DateTime(timezone=True), nullable=True)
    delivered_at        = Column(DateTime(timezone=True), nullable=True)

    received_by = Column(String(255), nullable=True)
    delivery_notes = Column(Text, nullable=True)

    created_by          = Column(CHAR(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    created_at          = Column(DateTime(timezone=True), server_default=func.now())
    updated_at          = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    customer   = relationship("Customer", foreign_keys=[customer_id])
    order_items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id           = Column(Integer, primary_key=True, autoincrement=True)
    order_id     = Column(CHAR(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id   = Column(CHAR(36), ForeignKey("products.id", ondelete="RESTRICT"), nullable=False)
    product_name = Column(String(255), nullable=False)   # historial snapshot
    quantity     = Column(Numeric(10, 3), nullable=False)
    unit_price   = Column(Numeric(15, 2), nullable=False)  # historical snapshot
    total        = Column(Numeric(15, 2), nullable=False)
    disposition  = Column(SAEnum(DispositionStatus), nullable=True)
    location_id = Column(
                        CHAR(36),
                        ForeignKey("warehouse_locations.id", ondelete="SET NULL"),
                        nullable=True,
                    )

    # Relationships
    order   = relationship("Order", back_populates="order_items")
    product = relationship("Product", foreign_keys=[product_id])

    location = relationship(
        "WarehouseLocation",
        foreign_keys=[location_id],
    )
    inventory_assignments = relationship(
        "OrderItemInventory",
        back_populates="order_item",
        cascade="all, delete-orphan",
    )