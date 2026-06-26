"""
Structured HTTP exceptions.

Every raise in the system should go through `raise_error()` so the frontend
always receives the same envelope:

    {"detail": {"error_code": "VENDOR_NOT_FOUND", "message": "Vendor not found"}}

The message is backend-facing (logged, used in tests). The frontend maps
error_code → its own user-friendly copy via lib/modules/{domain}/errors.ts.
"""

from fastapi import HTTPException


def raise_error(status_code: int, error_code: str, message: str) -> None:
    """Raise an HTTPException with a structured detail payload."""
    raise HTTPException(
        status_code=status_code,
        detail={"error_code": error_code, "message": message},
    )


# ── 404 helpers ────────────────────────────────────────────────────────────────

def not_found(error_code: str, message: str = "Not found") -> None:
    raise_error(404, error_code, message)


# ── 403 helpers ────────────────────────────────────────────────────────────────

def forbidden(error_code: str = "INSUFFICIENT_PERMISSIONS", message: str = "You don't have permission to do this") -> None:
    raise_error(403, error_code, message)


# ── 400 helpers ────────────────────────────────────────────────────────────────

def bad_request(error_code: str, message: str) -> None:
    raise_error(400, error_code, message)


# ── 409 helpers ────────────────────────────────────────────────────────────────

def conflict(error_code: str, message: str) -> None:
    raise_error(409, error_code, message)
