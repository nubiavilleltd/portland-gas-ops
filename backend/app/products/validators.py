from decimal import Decimal

from app.products.enums import ProductType, ProductUnit


def validate_name(value: str) -> str:
    cleaned = value.strip()

    if not cleaned:
        raise ValueError("Product name cannot be empty")

    if len(cleaned) < 2:
        raise ValueError("Product name must be at least 2 characters")

    return cleaned


def validate_product_type(value: ProductType) -> ProductType:
    return value


def validate_unit(value: ProductUnit) -> ProductUnit:
    return value


def validate_default_unit_price(value: Decimal) -> Decimal:
    if value <= 0:
        raise ValueError("Price must be greater than zero")

    return value


def validate_minimum_stock(value: Decimal | None) -> Decimal | None:
    if value is None:
        return None

    if value < 0:
        raise ValueError("Minimum stock cannot be negative")

    return value


def validate_optional_code(value: str | None) -> str | None:
    if value is None:
        return None

    cleaned = value.strip()

    if cleaned == "":
        return None

    return cleaned.upper()


def validate_optional_description(value: str | None) -> str | None:
    if value is None:
        return None

    cleaned = value.strip()

    return cleaned or None