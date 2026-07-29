
## Dedicated endpoints for testing errors

@router.get("/test-error/{kind}")
def test_error(kind: str):
    if kind == "404":
        raise AppException(
            status_code=404,
            error_code=ProductErrorCode.PRODUCT_NOT_FOUND,
            message="Product not found",
        )

    if kind == "duplicate":
        raise AppException(
            status_code=400,
            error_code=ProductErrorCode.PRODUCT_NAME_ALREADY_EXISTS,
            message="Duplicate name.",
        )

    if kind == "permission":
        raise AppException(
            status_code=403,
            error_code="INSUFFICIENT_PERMISSIONS",
            message="Only administrators can perform this action.",
        )

    if kind == "session":
        raise AppException(
            status_code=401,
            error_code="SESSION_EXPIRED",
            message="Your session has expired.",
        )

    if kind == "validation":
        raise AppException(
            status_code=422,
            error_code="VALIDATION_ERROR",
            message="Validation failed.",
        )

    if kind == "unknown":
        raise AppException(
            status_code=400,
            error_code="BRAND_NEW_ERROR_CODE",
            message="This message should never reach the UI.",
        )

    if kind == "500":
        raise Exception("Database exploded.")

    return {"ok": True}

