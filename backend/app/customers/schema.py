from datetime import datetime

from pydantic import BaseModel, EmailStr, field_validator

from app.customers.enums import CustomerStatus, CustomerType
from app.customers.validators import (
    validate_address,
    validate_email,
    validate_name,
    validate_phone,
)


# ── Request schemas ────────────────────────────────────────────────────────────

class CustomerCreate(BaseModel):
    name: str
    type: CustomerType = CustomerType.corporate
    email: EmailStr
    phone: str
    address: str

    @field_validator("name")
    @classmethod
    def name_validator(cls, v: str) -> str:
        return validate_name(v)

    @field_validator("phone")
    @classmethod
    def phone_validator(cls, v: str) -> str:
        return validate_phone(v)

    @field_validator("email")
    @classmethod
    def email_validator(cls, v: EmailStr) -> str:
        return validate_email(v)

    @field_validator("address")
    @classmethod
    def address_validator(cls, v: str) -> str:
        return validate_address(v)


class CustomerUpdate(BaseModel):
    name: str | None = None
    type: CustomerType | None = None
    email: EmailStr | None = None
    phone: str | None = None
    address: str | None = None
    status: CustomerStatus | None = None

    @field_validator("name")
    @classmethod
    def name_validator(cls, v: str | None) -> str | None:
        return validate_name(v, required=False)

    @field_validator("type")
    @classmethod
    def type_validator(cls, v: CustomerType | None) -> CustomerType | None:
        return validate_type(v, required=False)

    @field_validator("phone")
    @classmethod
    def phone_validator(cls, v: str | None) -> str | None:
        return validate_phone(v, required=False)

    @field_validator("email")
    @classmethod
    def email_validator(cls, v: EmailStr | None) -> str | None:
        return validate_email(v, required=False)

    @field_validator("address")
    @classmethod
    def address_validator(cls, v: str | None) -> str | None:
        return validate_address(v, required=False)


class CustomerFilters(BaseModel):
    search: str | None = None
    type: CustomerType | None = None
    status: CustomerStatus | None = None
    page: int = 1
    page_size: int = 20

    @field_validator("page")
    @classmethod
    def page_positive(cls, v: int) -> int:
        if v < 1:
            raise ValueError("Page must be >= 1")
        return v

    @field_validator("page_size")
    @classmethod
    def page_size_limit(cls, v: int) -> int:
        if v < 1 or v > 100:
            raise ValueError("page_size must be between 1 and 100")
        return v


# ── Response schemas ───────────────────────────────────────────────────────────

class CustomerResponse(BaseModel):
    id: str
    customer_no: str
    name: str
    type: CustomerType
    email: str | None
    phone: str | None
    address: str | None
    status: CustomerStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CustomerListResponse(BaseModel):
    items: list[CustomerResponse]
    total: int
    page: int
    page_size: int
    has_next: bool