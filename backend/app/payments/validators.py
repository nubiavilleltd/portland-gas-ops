from __future__ import annotations

from decimal import Decimal
from datetime import date

from app.core.exceptions import AppException, ErrorCode


def validate_payment_amount(amount: Decimal) -> Decimal:
    if amount <= 0:
        raise AppException(
            400,
            ErrorCode.VALIDATION_ERROR,
            "Payment amount must be greater than zero.",
        )
    return amount


def validate_payment_date(payment_date: date) -> date:
    # Reserved for future business rules.
    # Example:
    # - prevent dates too far in the future
    # - prevent dates before system go-live
    return payment_date