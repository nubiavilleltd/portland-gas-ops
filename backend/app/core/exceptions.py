from enum import Enum
from fastapi import HTTPException
from typing import Any, Optional


class ErrorCode(str, Enum):
    VALIDATION_ERROR = "VALIDATION_ERROR"
    DUPLICATE_ENTRY = "DUPLICATE_ENTRY"
    INVALID_STATUS_TRANSITION = "INVALID_STATUS_TRANSITION"
    NOT_FOUND = "NOT_FOUND"
    INTERNAL_ERROR = "INTERNAL_ERROR"
    TRANSACTION_FAILED = "TRANSACTION_FAILED"


class AppException(HTTPException):
    """
    Structured application exception.

    Carries an error_code the frontend can map to messages/behaviour.
    Accepts ErrorCode or any domain-specific Enum.
    """

    def __init__(
        self,
        status_code: int,
        error_code: str | Enum,
        message: str,
        details: Optional[Any] = None,
    ):
        normalized_error_code = (
            error_code.value
            if isinstance(error_code, Enum)
            else error_code
        )

        super().__init__(
            status_code=status_code,
            detail={
                "error_code": normalized_error_code,
                "message": message,
                "details": details,
            },
        )

        self.error_code = normalized_error_code