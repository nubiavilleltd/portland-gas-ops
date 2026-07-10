# from __future__ import annotations
# from decimal import Decimal

# def validate_order_items(items: list) -> list:
#     if not items:
#         raise ValueError("Order must have at least one item")
#     for item in items:
#         if item.get("quantity", 0) <= 0:
#             raise ValueError("Item quantity must be greater than zero")
#         if item.get("unit_price", 0) <= 0:
#             raise ValueError("Item unit price must be greater than zero")
#     return items

# def validate_delivery_address(value: str) -> str:
#     cleaned = value.strip()
#     if not cleaned:
#         raise ValueError("Delivery address cannot be empty")
#     return cleaned






from __future__ import annotations

from decimal import Decimal
from typing import Optional


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