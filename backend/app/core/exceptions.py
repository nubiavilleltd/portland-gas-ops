# app/core/exceptions.py

from enum import Enum
from fastapi import HTTPException
from typing import Any, Optional


class ErrorCode(str, Enum):
    # Auth
    INVALID_CREDENTIALS      = "INVALID_CREDENTIALS"
    TOKEN_EXPIRED            = "TOKEN_EXPIRED"
    INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS"
    ACCOUNT_INACTIVE         = "ACCOUNT_INACTIVE"

    # Validation
    VALIDATION_ERROR         = "VALIDATION_ERROR"
    DUPLICATE_ENTRY          = "DUPLICATE_ENTRY"
    INVALID_STATUS_TRANSITION = "INVALID_STATUS_TRANSITION"

    # Not found
    NOT_FOUND                = "NOT_FOUND"
    CUSTOMER_NOT_FOUND       = "CUSTOMER_NOT_FOUND"
    ORDER_NOT_FOUND          = "ORDER_NOT_FOUND"
    TRIP_NOT_FOUND           = "TRIP_NOT_FOUND"
    INVOICE_NOT_FOUND        = "INVOICE_NOT_FOUND"
    PAYMENT_NOT_FOUND        = "PAYMENT_NOT_FOUND"
    PRODUCT_NOT_FOUND        = "PRODUCT_NOT_FOUND"
    INVENTORY_ITEM_NOT_FOUND = "INVENTORY_ITEM_NOT_FOUND"
    DRIVER_NOT_FOUND         = "DRIVER_NOT_FOUND"
    VEHICLE_NOT_FOUND        = "VEHICLE_NOT_FOUND"

    # Business rule violations
    ORDER_CANNOT_BE_CANCELLED     = "ORDER_CANNOT_BE_CANCELLED"
    ORDER_CANNOT_BE_CONFIRMED     = "ORDER_CANNOT_BE_CONFIRMED"
    TRIP_CANNOT_BE_DISPATCHED     = "TRIP_CANNOT_BE_DISPATCHED"
    TRIP_CANNOT_BE_CANCELLED      = "TRIP_CANNOT_BE_CANCELLED"
    DRIVER_NOT_AVAILABLE          = "DRIVER_NOT_AVAILABLE"
    VEHICLE_NOT_AVAILABLE         = "VEHICLE_NOT_AVAILABLE"
    INSUFFICIENT_STOCK            = "INSUFFICIENT_STOCK"
    INVENTORY_ITEM_NOT_AVAILABLE  = "INVENTORY_ITEM_NOT_AVAILABLE"
    PAYMENT_EXCEEDS_BALANCE       = "PAYMENT_EXCEEDS_BALANCE"
    INVOICE_ALREADY_PAID          = "INVOICE_ALREADY_PAID"

    # Server
    INTERNAL_ERROR               = "INTERNAL_ERROR"
    TRANSACTION_FAILED           = "TRANSACTION_FAILED"


class AppException(HTTPException):
    """
    Structured application exception.
    Carries an error_code the frontend can map to messages/behaviour.
    """
    def __init__(
        self,
        status_code: int,
        error_code: ErrorCode,
        message: str,
        details: Optional[Any] = None,
    ):
        super().__init__(status_code=status_code, detail={
            "error_code": error_code.value,
            "message": message,
            "details": details,
        })
        self.error_code = error_code