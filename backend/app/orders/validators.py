
from __future__ import annotations

from decimal import Decimal
from typing import Optional
from app.orders.enums import DiscountType



def validate_quantity(value: Decimal) -> Decimal:
    if value <= 0:
        raise ValueError("Quantity must be greater than zero")
    return value


def validate_unit_price(value: Decimal) -> Decimal:
    if value <= 0:
        raise ValueError("Unit price must be greater than zero")
    return value


def validate_order_items(
    items: Optional[list],
    *,
    required: bool = True,
) -> Optional[list]:
    if items is None:
        if required:
            raise ValueError("Order must have at least one item")
        return None

    if not items:
        raise ValueError("Order must have at least one item")

    return items


def validate_delivery_address(
    value: Optional[str],
    *,
    required: bool = True,
) -> Optional[str]:
    if value is None:
        if required:
            raise ValueError("Delivery address is required")
        return None

    cleaned = value.strip()

    if not cleaned:
        raise ValueError("Delivery address cannot be empty")

    return cleaned


def validate_discount_value(
    value: Optional[Decimal],
    required: bool = True,
) -> Optional[Decimal]:
    if value is None:
        if required:
            raise ValueError("Discount value is required.")
        return None

    if value < 0:
        raise ValueError("Discount cannot be negative.")

    return value


def validate_discount(
    discount_type: DiscountType,
    discount_value: Decimal,
) -> Decimal:
    if discount_type == DiscountType.none:
        return Decimal("0")

    if (
        discount_type == DiscountType.percentage
        and discount_value > Decimal("100")
    ):
        raise ValueError("Percentage discount cannot exceed 100.")

    return discount_value