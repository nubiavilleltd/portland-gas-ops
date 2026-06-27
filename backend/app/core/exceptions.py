# app/core/exceptions.py

from enum import Enum
from fastapi import HTTPException
from typing import Any, Optional


class ErrorCode(str, Enum):
    # Generic — any domain can raise these
    VALIDATION_ERROR          = "VALIDATION_ERROR"
    DUPLICATE_ENTRY           = "DUPLICATE_ENTRY"
    INVALID_STATUS_TRANSITION = "INVALID_STATUS_TRANSITION"
    NOT_FOUND                 = "NOT_FOUND"
    INTERNAL_ERROR            = "INTERNAL_ERROR"
    TRANSACTION_FAILED        = "TRANSACTION_FAILED"


class AppException(HTTPException):
    """
    Structured application exception.
    Carries an error_code the frontend can map to messages/behaviour.
    Accepts ErrorCode (core) or any domain-specific str enum.
    """
    def __init__(
        self,
        status_code: int,
        error_code:  str,        # accepts ErrorCode, AuthErrorCode, ProductErrorCode, etc.
        message:     str,
        details:     Optional[Any] = None,
    ):
        super().__init__(status_code=status_code, detail={
            "error_code": str(error_code),
            "message":    message,
            "details":    details,
        })
        self.error_code = error_code