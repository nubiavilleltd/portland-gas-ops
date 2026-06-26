from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime

from app.customers.enums import CustomerType, CustomerStatus


# ── Request schemas ────────────────────────────────────────────────────────────

class CustomerCreate(BaseModel):
    name:    str
    type:    CustomerType = CustomerType.corporate
    email:   Optional[EmailStr] = None
    phone:   Optional[str] = None
    address: Optional[str] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()

    @field_validator("phone")
    @classmethod
    def phone_format(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        cleaned = v.strip()
        if cleaned and len(cleaned) < 7:
            raise ValueError("Phone number too short")
        return cleaned


class CustomerUpdate(BaseModel):
    name:    Optional[str] = None
    type:    Optional[CustomerType] = None
    email:   Optional[EmailStr] = None
    phone:   Optional[str] = None
    address: Optional[str] = None
    status:  Optional[CustomerStatus] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip() if v else v


class CustomerFilters(BaseModel):
    search:  Optional[str] = None
    type:    Optional[CustomerType] = None
    status:  Optional[CustomerStatus] = None
    page:    int = 1
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
    id:          str
    customer_no: str
    name:        str
    type:        CustomerType
    email:       Optional[str]
    phone:       Optional[str]
    address:     Optional[str]
    status:      CustomerStatus
    created_at:  datetime
    updated_at:  datetime

    class Config:
        from_attributes = True


class CustomerListResponse(BaseModel):
    items:     list[CustomerResponse]
    total:     int
    page:      int
    page_size: int
    has_next:  bool