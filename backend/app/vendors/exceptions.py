"""
Vendors domain error codes.

Frontend counterpart: lib/modules/vendors/errors.ts
"""

from app.shared.exceptions import not_found, bad_request, conflict


def vendor_not_found() -> None:
    not_found("VENDOR_NOT_FOUND")


def vendor_code_exists() -> None:
    conflict("VENDOR_CODE_EXISTS", "A vendor with this code already exists")


def vendor_inactive() -> None:
    bad_request("VENDOR_INACTIVE", "This vendor is currently inactive")
