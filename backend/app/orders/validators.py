from __future__ import annotations
from decimal import Decimal

def validate_order_items(items: list) -> list:
    if not items:
        raise ValueError("Order must have at least one item")
    for item in items:
        if item.get("quantity", 0) <= 0:
            raise ValueError("Item quantity must be greater than zero")
        if item.get("unit_price", 0) <= 0:
            raise ValueError("Item unit price must be greater than zero")
    return items

def validate_delivery_address(value: str) -> str:
    cleaned = value.strip()
    if not cleaned:
        raise ValueError("Delivery address cannot be empty")
    return cleaned