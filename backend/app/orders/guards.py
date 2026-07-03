from __future__ import annotations
from app.orders.model import Order
from app.orders.enums import OrderStatus, FulfillmentStatus
from app.payments.enums import PaymentStatus

def can_submit(order: Order) -> bool:
    return order.order_status == OrderStatus.draft

# def can_confirm(order: Order) -> bool:
#     return order.order_status == OrderStatus.submitted

def can_cancel(order: Order) -> bool:
    if order.order_status in (OrderStatus.completed, OrderStatus.cancelled, OrderStatus.draft):
        return False
    if order.fulfillment_status in (
        FulfillmentStatus.dispatched,
        FulfillmentStatus.in_transit,
        FulfillmentStatus.delivered,
    ):
        return False
    return True

def can_confirm_delivery(order: Order) -> bool:
    return (
        order.order_status == OrderStatus.confirmed and
        order.fulfillment_status == FulfillmentStatus.in_transit
    )

def can_assign_trip(order: Order) -> bool:
    return (
        order.order_status == OrderStatus.confirmed
        and order.trip_id is None
    )

# def can_close(order: Order) -> bool:
#     return (
#         order.fulfillment_status == FulfillmentStatus.delivered and
#         order.payment_status == PaymentStatus.paid
#     )

def can_edit(order: Order) -> bool:
    return order.order_status == OrderStatus.draft

def can_generate_invoice(order: Order) -> bool:
    return order.order_status == OrderStatus.submitted and order.invoice_id is None