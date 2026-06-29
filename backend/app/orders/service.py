from __future__ import annotations
from app.customers.error_codes import CustomerErrorCode
from app.customers.repository import CustomerRepository
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional, List
from datetime import datetime, timezone
from decimal import Decimal

from app.orders.repository import OrderRepository
from app.orders.model import Order
from app.orders.schema import OrderCreate, OrderUpdate, OrderFilters, CancelOrderRequest
from app.orders.enums import OrderStatus, FulfillmentStatus
from app.orders.error_codes import OrderErrorCode
from app.orders import guards
from app.payments.enums import PaymentStatus
from app.core.exceptions import AppException, ErrorCode


class OrderService:

    def __init__(self):
        self.repo = OrderRepository()
        self.customer_repo = CustomerRepository()

    def get_or_raise(self, db: Session, order_id: str) -> Order:
        order = self.repo.get_by_id(db, order_id)
        if not order:
            raise AppException(404, OrderErrorCode.ORDER_NOT_FOUND, f"Order {order_id} not found")
        return order

    def get_by_no_or_raise(self, db: Session, order_no: str) -> Order:
        order = self.repo.get_by_no(db, order_no)
        if not order:
            raise AppException(404, OrderErrorCode.ORDER_NOT_FOUND, f"Order {order_no} not found")
        return order
    def get_by_id_or_raise(self, db: Session, order_id: str) -> Order:
        order = self.repo.get_by_id(db, order_id)
        if not order:
            raise AppException(404, OrderErrorCode.ORDER_NOT_FOUND, f"Order {order_id} not found")
        return order

    def list(self, db: Session, filters: OrderFilters):
        return self.repo.list(
            db,
            search             = filters.search,
            order_status       = filters.order_status.value if filters.order_status else None,
            fulfillment_status = filters.fulfillment_status.value if filters.fulfillment_status else None,
            payment_status     = filters.payment_status.value if filters.payment_status else None,
            customer_id        = filters.customer_id,
            page               = filters.page,
            page_size          = filters.page_size,
        )

    def create_draft(self, db: Session, data: OrderCreate, created_by: str) -> Order:
        """Create an order in draft status."""
        customer = self.customer_repo.get_by_id(db, data.customer_id)
        if not customer:
            raise AppException(
                404,
                CustomerErrorCode.CUSTOMER_NOT_FOUND,
                "Customer not found",
            )
        total = sum(Decimal(str(i.total)) for i in data.order_items)
        order_no = self.repo.generate_order_no(db)

        order = self.repo.create(
            db,
            order_no           = order_no,
            customer_id        = data.customer_id,
            order_status       = OrderStatus.draft,
            fulfillment_status = FulfillmentStatus.pending,
            payment_status     = PaymentStatus.unpaid,
            delivery_address   = data.delivery_address.strip(),
            delivery_date      = data.delivery_date,
            notes              = data.notes,
            total_amount       = total,
            created_by         = created_by,
        )
        self.repo.create_items(db, order.id, [
            {
                "product_id":   i.product_id,
                "product_name": i.product_name,
                "quantity":     i.quantity,
                "unit_price":   i.unit_price,
                "total":        i.total,
            }
            for i in data.order_items
        ])
        return order

    def create_and_submit(self, db: Session, data: OrderCreate, created_by: str) -> Order:
        """Create an order and immediately submit it — no draft step."""
        order = self.create_draft(db, data, created_by)
        return self.repo.update(db, order, order_status=OrderStatus.submitted)

    def update_draft(self, db: Session, order_no: str, data: OrderUpdate) -> Order:
        order = self.get_by_no_or_raise(db, order_no)
        if not guards.can_edit(order):
            raise AppException(400, OrderErrorCode.ORDER_NOT_EDITABLE, "Only draft orders can be edited")

        updates = {}
        if data.customer_id is not None:
            customer = self.customer_repo.get_by_id(db, data.customer_id)
            if not customer:
                raise AppException(
                    404,
                    CustomerErrorCode.CUSTOMER_NOT_FOUND,
                    "Customer not found",
                )
            updates["customer_id"] = data.customer_id
        if data.delivery_address is not None:
            updates["delivery_address"] = data.delivery_address.strip()
        if data.delivery_date is not None:
            updates["delivery_date"] = data.delivery_date
        if data.notes is not None:
            updates["notes"] = data.notes

        if data.order_items is not None:
            total = sum(Decimal(str(i.total)) for i in data.order_items)
            updates["total_amount"] = total
            self.repo.replace_items(db, order.id, [
                {
                    "product_id":   i.product_id,
                    "product_name": i.product_name,
                    "quantity":     i.quantity,
                    "unit_price":   i.unit_price,
                    "total":        i.total,
                }
                for i in data.order_items
            ])

        return self.repo.update(db, order, **updates)

    def submit(self, db: Session, order_no: str) -> Order:
        order = self.get_by_no_or_raise(db, order_no)
        if not guards.can_submit(order):
            raise AppException(400, OrderErrorCode.ORDER_CANNOT_BE_SUBMITTED,
                               "Only draft orders can be submitted")
        return self.repo.update(db, order, order_status=OrderStatus.submitted)

    def confirm(self, db: Session, order_no: str, confirmed_by: str) -> Order:
        """Manual confirmation — submitted → confirmed."""
        order = self.get_by_no_or_raise(db, order_no)
        if not guards.can_confirm(order):
            raise AppException(400, OrderErrorCode.ORDER_CANNOT_BE_CONFIRMED,
                               "Only submitted orders can be confirmed")
        return self.repo.update(
            db, order,
            order_status = OrderStatus.confirmed,
            confirmed_by = confirmed_by,
            confirmed_at = datetime.now(timezone.utc),
        )

    def cancel(self, db: Session, order_no: str, reason: Optional[str]) -> Order:
        """
        Cancel order. Backend handles the cascade:
        - Sets order cancelled
        - Voids any linked invoice (handled in invoice service, called from router)
        """
        order = self.get_by_no_or_raise(db, order_no)
        if not guards.can_cancel(order):
            raise AppException(400, OrderErrorCode.ORDER_CANNOT_BE_CANCELLED,
                               "This order cannot be cancelled in its current state")
        return self.repo.update(
            db, order,
            order_status        = OrderStatus.cancelled,
            cancellation_reason = reason,
            cancelled_at        = datetime.now(timezone.utc),
        )

    def confirm_delivery(self, db: Session, order_no: str) -> Order:
        """
        Confirm delivery.
        Sets fulfillment=delivered, delivered_at=now.
        If payment_status==paid: auto-close (set order_status=completed).
        This is what the frontend confirmDeliveryWorkflow does — both steps in one.
        """
        order = self.get_by_no_or_raise(db, order_no)
        if not guards.can_confirm_delivery(order):
            raise AppException(400, OrderErrorCode.ORDER_NOT_EDITABLE,
                               "Delivery cannot be confirmed for this order")

        self.repo.update(
            db, order,
            fulfillment_status = FulfillmentStatus.delivered,
            delivered_at       = datetime.now(timezone.utc),
        )

        # Auto-close if already paid — mirrors frontend confirmDeliveryWorkflow exactly
        if order.payment_status == PaymentStatus.paid:
            return self.repo.update(db, order, order_status=OrderStatus.completed)

        return order

    def update_payment_status(self, db: Session, order: Order, payment_status: PaymentStatus) -> Order:
        """
        Called by payments service after recording a payment.
        If payment_status==paid: auto-confirm the order (submitted → confirmed).
        This is what the frontend updatePaymentStatus does.
        """
        updates: dict = {"payment_status": payment_status}

        if payment_status == PaymentStatus.paid:
            # Payment confirms the order — mirrors frontend exactly
            updates["order_status"]  = OrderStatus.confirmed
            updates["confirmed_at"]  = datetime.now(timezone.utc)

        return self.repo.update(db, order, **updates)

    def update_fulfillment_status(self, db: Session, order_no: str, status: FulfillmentStatus) -> Order:
        """Called by trips module when trip status changes."""
        order = self.get_by_no_or_raise(db, order_no)
        return self.repo.update(db, order, fulfillment_status=status)

    def set_trip(self, db: Session, order_no: str, trip_id: Optional[str]) -> Order:
        order = self.get_by_no_or_raise(db, order_no)
        return self.repo.update(db, order, trip_id=trip_id)

    def set_invoice(self, db: Session, order: Order, invoice_id: str) -> Order:
        return self.repo.update(db, order, invoice_id=invoice_id)