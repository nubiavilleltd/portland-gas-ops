from pydantic import EmailStr

from app.customers.enums import CustomerType


def validate_name(value: str) -> str:
    cleaned = value.strip()

    if not cleaned:
        raise ValueError("Customer name cannot be empty")

    return cleaned


def validate_type(value: CustomerType) -> CustomerType:
    return value


def validate_phone(value: str) -> str:
    cleaned = value.strip()

    if not cleaned:
        raise ValueError("Phone number cannot be empty")

    if len(cleaned) < 7:
        raise ValueError("Phone number is too short")

    return cleaned


def validate_email(value: EmailStr) -> str:
    return str(value).strip().lower()


def validate_address(value: str) -> str:
    cleaned = value.strip()

    if not cleaned:
        raise ValueError("Address cannot be empty")

    return cleaned