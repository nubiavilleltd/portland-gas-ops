from __future__ import annotations

from decimal import Decimal


def validate_positive_integer(value: int) -> int:
    if value <= 0:
        raise ValueError("Quantity must be at least 1")
    return value


def validate_positive_decimal(value: Decimal) -> Decimal:
    if value <= 0:
        raise ValueError("Quantity must be greater than zero")
    return value