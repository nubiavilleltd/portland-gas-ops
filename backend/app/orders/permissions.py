from __future__ import annotations

from app.core.exceptions import AppException, ErrorCode
from app.orders.model import Order
from app.orders import policies
from app.shared.models.user import User


class OrderPermissions:

    @staticmethod
    def _deny(message: str) -> None:
        raise AppException(
            status_code=403,
            error_code=ErrorCode.FORBIDDEN,
            message=message,
        )

    def ensure_can_create_order(
        self,
        user: User,
    ) -> None:

        if policies.can_create_orders(user):
            return

        self._deny(
            "You do not have permission to create orders.",
        )

    def ensure_can_view_order(
        self,
        user: User,
        order: Order,
    ) -> None:

        if policies.can_manage_orders(user):
            return

        if policies.is_order_owner(user, order):
            return

        self._deny(
            "You do not have permission to view this order.",
        )

    def ensure_can_edit_order(
        self,
        user: User,
        order: Order,
    ) -> None:

        if policies.can_manage_orders(user):
            return

        if policies.is_order_owner(user, order):
            return

        self._deny(
            "You do not have permission to edit this order.",
        )

    def ensure_can_submit_order(
        self,
        user: User,
        order: Order,
    ) -> None:

        if policies.can_submit_orders(user):
            return

        if policies.is_order_owner(user, order):
            return

        self._deny(
            "You do not have permission to submit this order.",
        )

    def ensure_can_cancel_order(
        self,
        user: User,
        order: Order,
    ) -> None:

        if policies.can_cancel_orders(user):
            return
        if policies.is_order_owner(user, order):
            return

        self._deny(
            "You do not have permission to cancel this order.",
        )

    def ensure_can_assign_trip(
        self,
        user: User,
    ) -> None:

        if policies.can_assign_trip(user):
            return

        self._deny(
            "You do not have permission to assign trips.",
        )

    def ensure_can_confirm_delivery(
        self,
        user: User,
        order: Order,
    ) -> None:

        if policies.can_confirm_delivery(user):
            return
        if policies.is_order_owner(user, order):
            return

        self._deny(
            "You do not have permission to confirm the delivery of this order.",
        )

    def ensure_can_update_fulfillment(
        self,
        user: User,
        order: Order,
    ) -> None:

        if policies.can_update_fulfillment(user):
            return
        if policies.is_order_owner(user, order):
            return

        self._deny(
            "You do not have permission to update the fulfillment of this order.",
        )

    def ensure_can_set_invoice(
        self,
        user: User,
    ) -> None:

        if policies.can_assign_invoice(user):
            return

        self._deny(
            "You do not have permission to assign invoices.",
        )


permissions = OrderPermissions()