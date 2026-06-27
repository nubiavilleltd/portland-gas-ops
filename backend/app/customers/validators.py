from pydantic import EmailStr

from app.customers.enums import CustomerType


def validate_name(value: str | None, *, required: bool = True) -> str | None:
    if value is None:
        if required:
            raise ValueError("Customer name cannot be empty")
        return None

    cleaned = value.strip()

    if not cleaned:
        if required:
            raise ValueError("Customer name cannot be empty")
        return None

    return cleaned


def validate_phone(value: str | None, *, required: bool = True) -> str | None:
    if value is None:
        if required:
            raise ValueError("Phone number cannot be empty")
        return None

    cleaned = value.strip()

    if not cleaned:
        if required:
            raise ValueError("Phone number cannot be empty")
        return None

    if len(cleaned) < 7:
        raise ValueError("Phone number is too short")

    return cleaned


def validate_email(value: EmailStr | None, *, required: bool = True) -> str | None:
    if value is None:
        if required:
            raise ValueError("Email cannot be empty")
        return None

    cleaned = str(value).strip().lower()

    if not cleaned:
        if required:
            raise ValueError("Email cannot be empty")
        return None

    return cleaned


def validate_address(value: str | None, *, required: bool = True) -> str | None:
    if value is None:
        if required:
            raise ValueError("Address cannot be empty")
        return None

    cleaned = value.strip()

    if not cleaned:
        if required:
            raise ValueError("Address cannot be empty")
        return None

    return cleaned