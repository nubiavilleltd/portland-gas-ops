from __future__ import annotations
from app.orders.model import Order
from app.orders.enums import OrderStatus, FulfillmentStatus
from app.core.exceptions import AppException
from app.orders.error_codes import OrderErrorCode


def ensure_can_submit(
    order: Order,
) -> None:
    if order.order_status != OrderStatus.draft:
        raise AppException(
            status_code=400,
            error_code=OrderErrorCode.ORDER_CANNOT_BE_SUBMITTED,
            message="Only draft orders can be submitted.",
        )


def ensure_can_cancel(
    order: Order,
) -> None:

    if order.order_status in (
        OrderStatus.completed,
        OrderStatus.cancelled,
        OrderStatus.draft,
    ):
        raise AppException(
            status_code=400,
            error_code=OrderErrorCode.ORDER_CANNOT_BE_CANCELLED,
            message="This order cannot be cancelled.",
        )

    if order.fulfillment_status in (
        FulfillmentStatus.dispatched,
        FulfillmentStatus.in_transit,
        FulfillmentStatus.delivered,
    ):
        raise AppException(
            status_code=400,
            error_code=OrderErrorCode.ORDER_CANNOT_BE_CANCELLED,
            message="Dispatched orders cannot be cancelled.",
        )
    
def ensure_can_confirm(order: Order) -> None:
    if order.order_status != OrderStatus.submitted:
        raise AppException(
            status_code=400,
            error_code=OrderErrorCode.ORDER_CANNOT_BE_CONFIRMED,
            message="Only submitted orders can be confirmed.",
        )


def ensure_can_confirm_delivery(
    order: Order,
) -> None:

    if (
        order.order_status != OrderStatus.confirmed
        or order.fulfillment_status != FulfillmentStatus.in_transit
    ):
        raise AppException(
            status_code=400,
            error_code=OrderErrorCode.ORDER_CANNOT_CONFIRM_DELIVERY,
            message="Only orders in transit can be confirmed as delivered.",
        )

def ensure_can_assign_trip(
    order: Order,
) -> None:

    if order.order_status != OrderStatus.confirmed:
        raise AppException(
            status_code=400,
            error_code=OrderErrorCode.ORDER_CANNOT_ASSIGN_TRIP,
            message="Only confirmed orders can be assigned to a trip.",
        )

    if order.trip_id is not None:
        raise AppException(
            status_code=400,
            error_code=OrderErrorCode.ORDER_ALREADY_ASSIGNED_TO_TRIP,
            message="This order is already assigned to a trip.",
        )


def ensure_can_edit(
    order: Order,
) -> None:

    if order.order_status != OrderStatus.draft:
        raise AppException(
            status_code=400,
            error_code=OrderErrorCode.ORDER_NOT_EDITABLE,
            message="Only draft orders can be edited.",
        )


def ensure_can_generate_invoice(
    order: Order,
) -> None:

    if order.order_status != OrderStatus.submitted:
        raise AppException(
            status_code=400,
            error_code=OrderErrorCode.ORDER_CANNOT_GENERATE_INVOICE,
            message="Only submitted orders can generate an invoice.",
        )

    if order.invoice_id is not None:
        raise AppException(
            status_code=400,
            error_code=OrderErrorCode.ORDER_ALREADY_HAS_INVOICE,
            message="This order already has an invoice.",
        )



def ensure_can_update_fulfillment(
    order: Order,
    new_status: FulfillmentStatus,
) -> None:
    """
    Ensures the requested fulfillment status transition is valid.
    """

    allowed_transitions = {
        FulfillmentStatus.pending: {
            FulfillmentStatus.assigned,
        },
        FulfillmentStatus.assigned: {
            FulfillmentStatus.dispatched,
        },
        FulfillmentStatus.dispatched: {
            FulfillmentStatus.in_transit,
            FulfillmentStatus.failed,
        },
        FulfillmentStatus.in_transit: {
            FulfillmentStatus.delivered,
            FulfillmentStatus.failed,
        },
        FulfillmentStatus.delivered: set(),
        FulfillmentStatus.failed: set(),
    }

    current = order.fulfillment_status

    # No-op updates are allowed.
    if current == new_status:
        return

    if new_status not in allowed_transitions.get(current, set()):
        raise AppException(
            status_code=400,
            error_code=OrderErrorCode.INVALID_FULFILLMENT_TRANSITION,
            message=(
                f"Cannot change fulfillment status "
                f"from '{current.value}' to '{new_status.value}'."
            ),
        )