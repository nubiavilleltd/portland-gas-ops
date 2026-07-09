"""
Procurement domain error codes.

These codes are returned in the API response as:
    {"detail": {"error_code": "PROCUREMENT_NOT_FOUND", "message": "..."}}

The frontend maps each code to a user-facing message in
lib/modules/procurement/errors.ts — update both files together.
"""

from app.shared.exceptions import not_found, bad_request, forbidden


def procurement_not_found() -> None:
    not_found("PROCUREMENT_NOT_FOUND")


def po_not_found() -> None:
    not_found("PO_NOT_FOUND")


def procurement_access_denied() -> None:
    forbidden("PROCUREMENT_ACCESS_DENIED")


def procurement_not_editable() -> None:
    bad_request("PROCUREMENT_NOT_EDITABLE", "Only draft requests can be edited")


def procurement_no_items() -> None:
    bad_request("PROCUREMENT_NO_ITEMS", "Add at least one line item before submitting")


def procurement_vendor_required() -> None:
    bad_request("PROCUREMENT_VENDOR_REQUIRED", "A vendor must be assigned before issuing a PO")


def po_already_cancelled() -> None:
    bad_request("PO_ALREADY_CANCELLED", "A cancelled PO cannot be updated")


def invalid_status_transition(from_status: str, action: str) -> None:
    bad_request(
        "INVALID_STATUS_TRANSITION",
        f"Cannot {action} a request with status '{from_status}'",
    )
