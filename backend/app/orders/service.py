from __future__ import annotations
from app.customers.error_codes import CustomerErrorCode
from app.customers.repository import CustomerRepository
from app.orders import policies
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional, Union
from datetime import datetime, timezone
from decimal import Decimal

from app.orders.repository import OrderRepository
from app.orders.model import Order
from app.orders.schema import OrderCreate, OrderDraftCreate, OrderUpdate, OrderFilters, CancelOrderRequest
from app.orders.enums import OrderStatus, FulfillmentStatus
from app.orders.error_codes import OrderErrorCode
from app.orders import guards
from app.payments.enums import PaymentStatus
from app.core.exceptions import AppException, ErrorCode
from app.products.service import ProductService
from app.orders.enums import DiscountType
from app.orders.model import OrderItem


class OrderService:

    def __init__(self):
        self.repo = OrderRepository()
        self.customer_repo = CustomerRepository()
        self.product_service = ProductService()
    def _filter_real_items(self, order_items: list) -> list:
        """Drop placeholder rows with no product selected — treated as
        'not yet provided', mirroring the frontend's draft filtering."""
        return [item for item in order_items if item.product_id]
    
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
    
    def get_order_items(
        self,
        db: Session,
        order_id: str,
    ):
        order = self.get_or_raise(
            db=db,
            order_id=order_id,
        )

        return order.order_items
    
    def update_order_item(
        self,
        db: Session,
        order_item:OrderItem,
        **fields,
    ):
        return self.repo.update_order_item(
            db=db,
            order_item=order_item,
            **fields,
        )

    def list(self, db: Session, filters: OrderFilters, current_user) -> tuple[list[Order], int]:
        if policies.can_manage_orders(current_user):
            return self.repo.list(
                db,
                search=filters.search,
                order_status=filters.order_status,
                fulfillment_status=filters.fulfillment_status,
                payment_status=filters.payment_status,
                customer_id=filters.customer_id,
                page=filters.page,
                page_size=filters.page_size,
            )

        return self.repo.list(
            db,
            created_by=current_user.id,
            search=filters.search,
            order_status=filters.order_status,
            fulfillment_status=filters.fulfillment_status,
            payment_status=filters.payment_status,
            customer_id=filters.customer_id,
            page=filters.page,
            page_size=filters.page_size,
        )

    def create_draft(self, db: Session, data: Union[OrderCreate, OrderDraftCreate], created_by: str) -> Order:
        """Create an order in draft status."""
        customer = self.customer_repo.get_by_id(db, data.customer_id)
        if not customer:
            raise AppException(
                404,
                CustomerErrorCode.CUSTOMER_NOT_FOUND,
                "Customer not found",
            )
        real_items = self._filter_real_items(data.order_items)
        items, subtotal = self._build_order_items(db, real_items) if real_items else ([], Decimal("0"))
        discount_amount, total_amount = self._calculate_order_total(
            subtotal=subtotal,
            discount_type=data.discount_type,
            discount_value=data.discount_value,
        )
        order_no = self.repo.generate_order_no(db)

        order = self.repo.create(
            db,
            order_no           = order_no,
            customer_id        = data.customer_id,
            customer_name       = customer.name,
            order_status       = OrderStatus.draft,
            fulfillment_status = FulfillmentStatus.pending,
            payment_status     = PaymentStatus.unpaid,
            delivery_address = data.delivery_address.strip() if data.delivery_address else None,
            delivery_date      = data.delivery_date,
            notes              = data.notes,
            discount_type=data.discount_type,
            discount_value=data.discount_value,
            discount_amount=discount_amount,
            total_amount=total_amount,
            created_by         = created_by,
        )
        if items:
            self.repo.create_items(
                db,
                order.id,
                items,
            )
        return order

    def create_and_submit(self, db: Session, data: OrderCreate, created_by: str) -> Order:
        order = self.create_draft(db, data, created_by)
        guards.ensure_can_submit(order)
        return self.repo.update(db, order, order_status=OrderStatus.submitted)

    def update_draft(self, db: Session, order: Order, data: OrderUpdate) -> Order:
        """Update a draft order - handles partial updates gracefully."""
        guards.ensure_can_edit(order)

        updates = {}
        
        # Handle customer update
        if data.customer_id is not None:
            customer = self.customer_repo.get_by_id(db, data.customer_id)
            if not customer:
                raise AppException(
                    404,
                    CustomerErrorCode.CUSTOMER_NOT_FOUND,
                    "Customer not found",
                )
            updates["customer_id"] = data.customer_id
            updates["customer_name"] = customer.name

        # Handle delivery fields
        if data.delivery_address is not None:
            # If empty string, set to None (clear the field)
            updates["delivery_address"] = data.delivery_address.strip() if data.delivery_address else None
            
        if data.delivery_date is not None:
            updates["delivery_date"] = data.delivery_date
            
        if data.notes is not None:
            updates["notes"] = data.notes

        # Handle order items
        if data.order_items is not None:
            # Filter out placeholder items (no product_id)
            real_items = self._filter_real_items(data.order_items)
            
            if real_items:
                # Build items and calculate totals
                items, subtotal = self._build_order_items(db, real_items)
                self.repo.replace_items(db, order.id, items)
            else:
                # User wants to clear all items
                self.repo.clear_items(db, order.id) 
                subtotal = Decimal("0")
        else:
            # No change to items, use existing subtotal
            subtotal = sum(Decimal(str(item.total)) for item in order.order_items)

        # Handle discount fields
        if (
            data.order_items is not None
            or data.discount_type is not None
            or data.discount_value is not None
        ):
            discount_type = (
                data.discount_type
                if data.discount_type is not None
                else order.discount_type
            )

            discount_value = (
                data.discount_value
                if data.discount_value is not None
                else order.discount_value
            )

            discount_amount, total_amount = self._calculate_order_total(
                subtotal=subtotal,
                discount_type=discount_type,
                discount_value=discount_value,
            )

            updates.update({
                "discount_type": discount_type,
                "discount_value": discount_value,
                "discount_amount": discount_amount,
                "total_amount": total_amount,
            })

        return self.repo.update(db, order, **updates)

    def submit(self, db: Session, order: Order) -> Order:
        # order = self.get_or_raise(db, order_id)
        guards.ensure_can_submit(order)
        return self.repo.update(db, order, order_status=OrderStatus.submitted)

    def confirm(self, db: Session, order_id: str, confirmed_by: str) -> Order:
        """Manual confirmation — submitted → confirmed."""
        order = self.get_or_raise(db, order_id)
        guards.ensure_can_confirm(order)
        return self.repo.update(
            db, order,
            order_status = OrderStatus.confirmed,
            confirmed_by = confirmed_by,
            confirmed_at = datetime.now(timezone.utc),
        )

    def cancel(self, db: Session, order: Order, reason: Optional[str]) -> Order:
        """
        Cancel order. Backend handles the cascade:
        - Sets order cancelled
        - Voids any linked invoice (handled in invoice service, called from router)
        """        
        guards.ensure_can_cancel(order)

        return self.repo.update(
            db, order,
            order_status        = OrderStatus.cancelled,
            cancellation_reason = reason,
            cancelled_at        = datetime.now(timezone.utc),
        )

    def confirm_delivery(self, db: Session, order: Order) -> Order:
        """
        Confirm delivery.
        Sets fulfillment=delivered, delivered_at=now.
        If payment_status==paid: auto-close (set order_status=completed).
        This is what the frontend confirmDeliveryWorkflow does — both steps in one.
        """

        guards.ensure_can_confirm_delivery(order)

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

    def update_fulfillment_status(self, db: Session, order: Order, status: FulfillmentStatus) -> Order:
        """Called by trips module when trip status changes."""
        
        guards.ensure_can_update_fulfillment(
            order,
            status,
        )
        return self.repo.update(db, order, fulfillment_status=status)

    def set_trip(self, db: Session, order_id: str, trip_id: Optional[str]) -> Order:
        order = self.get_or_raise(db, order_id)
        guards.ensure_can_assign_trip(order)
        return self.repo.update(db, order, trip_id=trip_id)

    def set_invoice(self, db: Session, order: Order, invoice_id: str) -> Order:
        guards.ensure_can_generate_invoice(order)
        return self.repo.update(db, order, invoice_id=invoice_id)
    
    
    def list_for_customer(
        self,
        db: Session,
        customer_id: str,
    ):
        return self.repo.list_by_customer(db, customer_id)
    
    def _build_order_items(
        self,
        db: Session,
        order_items,
    ):
        items = []
        subtotal = Decimal("0")

        for line in order_items:
            product = self.product_service.get_or_raise(
                db,
                line.product_id,
            )

            unit_price = Decimal(str(product.default_unit_price))
            line_total = unit_price * line.quantity

            items.append(
                {
                    "product_id": product.id,
                    "product_name": product.name,
                    "quantity": line.quantity,
                    "unit_price": unit_price,
                    "total": line_total,
                }
            )

            subtotal += line_total

        return items, subtotal
    def _calculate_discount(
        self,
        subtotal: Decimal,
        discount_type: DiscountType,
        discount_value: Decimal,
    ) -> Decimal:
        if discount_type == DiscountType.none:
            return Decimal("0")

        if discount_type == DiscountType.fixed:
            return min(discount_value, subtotal)

        if discount_type == DiscountType.percentage:
            return (subtotal * discount_value) / Decimal("100")

        return Decimal("0")
    def _calculate_order_total(
        self,
        subtotal: Decimal,
        discount_type: DiscountType,
        discount_value: Decimal,
    ) -> tuple[Decimal, Decimal]:
        discount_amount = self._calculate_discount(
            subtotal,
            discount_type,
            discount_value,
        )

        total_amount = subtotal - discount_amount

        return discount_amount, total_amount