from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator, model_validator

from app.products.enums import ProductStatus, ProductType, ProductUnit
from app.products.validators import (
    validate_default_unit_price,
    validate_minimum_stock,
    validate_name,
    validate_optional_code,
    validate_optional_description,
)


# ── Response helpers ───────────────────────────────────────────────────────────

class ProductImageResponse(BaseModel):
    id: str
    url: str
    name: str

    class Config:
        from_attributes = True


# ── Request schemas ────────────────────────────────────────────────────────────

class ProductCreate(BaseModel):
    name: str
    product_type: ProductType = ProductType.consumable
    unit: ProductUnit = ProductUnit.kg
    default_unit_price: Decimal
    code: str | None = None
    description: str | None = None
    minimum_stock: Decimal | None = None

    @field_validator("name")
    @classmethod
    def name_validator(cls, v: str) -> str:
        return validate_name(v)

    @field_validator("default_unit_price")
    @classmethod
    def price_validator(cls, v: Decimal) -> Decimal:
        return validate_default_unit_price(v)

    @field_validator("minimum_stock")
    @classmethod
    def minimum_stock_validator(cls, v: Decimal | None) -> Decimal | None:
        return validate_minimum_stock(v)

    @field_validator("code")
    @classmethod
    def code_validator(cls, v: str | None) -> str | None:
        return validate_optional_code(v)

    @field_validator("description")
    @classmethod
    def description_validator(cls, v: str | None) -> str | None:
        return validate_optional_description(v)

    @model_validator(mode="after")
    def tracked_requires_code(self) -> ProductCreate:
        if self.product_type == ProductType.tracked and not self.code:
            raise ValueError("Product code is required for tracked assets")

        # Tracked products are always measured in units.
        if self.product_type == ProductType.tracked:
            self.unit = ProductUnit.unit

        return self


class ProductUpdate(BaseModel):
    name: str | None = None
    product_type: ProductType | None = None
    unit: ProductUnit | None = None
    default_unit_price: Decimal | None = None
    code: str | None = None
    description: str | None = None
    minimum_stock: Decimal | None = None
    status: ProductStatus | None = None
    primary_document_id: str | None = None

    @field_validator("name")
    @classmethod
    def name_validator(cls, v: str | None) -> str | None:
        return validate_name(v, required=False)

    @field_validator("default_unit_price")
    @classmethod
    def price_validator(cls, v: Decimal | None) -> Decimal | None:
        return validate_default_unit_price(v, required=False)

    @field_validator("minimum_stock")
    @classmethod
    def minimum_stock_validator(cls, v: Decimal | None) -> Decimal | None:
        return validate_minimum_stock(v)

    @field_validator("code")
    @classmethod
    def code_validator(cls, v: str | None) -> str | None:
        return validate_optional_code(v)

    @field_validator("description")
    @classmethod
    def description_validator(cls, v: str | None) -> str | None:
        return validate_optional_description(v)


class ProductFilters(BaseModel):
    search: str | None = None
    product_type: ProductType | None = None
    status: ProductStatus | None = None
    page: int = 1
    page_size: int = 50

    @field_validator("page")
    @classmethod
    def page_positive(cls, v: int) -> int:
        if v < 1:
            raise ValueError("Page must be >= 1")
        return v

    @field_validator("page_size")
    @classmethod
    def page_size_limit(cls, v: int) -> int:
        if v < 1 or v > 200:
            raise ValueError("page_size must be between 1 and 200")
        return v


# ── Response schemas ───────────────────────────────────────────────────────────

class ProductResponse(BaseModel):
    id: str
    product_no: str
    name: str
    code: str | None
    description: str | None
    product_type: ProductType
    unit: ProductUnit
    default_unit_price: Decimal
    minimum_stock: Decimal | None
    status: ProductStatus
    primary_document_id: int | None = None
    images: list[ProductImageResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ProductPickerResponse(ProductResponse):
    physical_quantity: Decimal
    committed_quantity: Decimal
    available_quantity: Decimal
    is_orderable: bool

class ProductPickerListResponse(BaseModel):
    items: list[ProductPickerResponse]
    total: int
    page: int
    page_size: int
    has_next: bool


class ProductListResponse(BaseModel):
    items: list[ProductResponse]
    total: int
    page: int
    page_size: int
    has_next: bool


# # ─────────────────────────────────────────────────────────────────────────────
# # Product Picker
# # ─────────────────────────────────────────────────────────────────────────────

# class ProductPickerResponse(BaseModel):
#     id: str
#     product_no: str
#     name: str
#     code: str | None
#     product_type: ProductType
#     unit: ProductUnit
#     default_unit_price: Decimal

#     available_quantity: Decimal

#     class Config:
#         from_attributes = True


# class ProductPickerListResponse(BaseModel):
#     items: list[ProductPickerResponse]