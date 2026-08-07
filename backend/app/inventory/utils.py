from app.orders.enums import (
    OrderStatus,
    FulfillmentStatus,
)
from app.payments.enums import PaymentStatus
from app.orders.model import Order


def committed_order_filters(query):
    """
    Applies the business rule for orders that contribute to
    committed inventory.

    Keeping this in one place makes future business rule
    changes straightforward.
    """

    return query.filter(
        Order.payment_status.in_(
            [
                PaymentStatus.partially_paid,
                PaymentStatus.paid,
            ]
        ),
        Order.order_status != OrderStatus.cancelled,
        Order.fulfillment_status != FulfillmentStatus.delivered,
    )