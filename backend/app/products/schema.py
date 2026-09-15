from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator, model_validator

from app.products.enums import InventoryTracking, ProductStatus
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

class ProductCategoryResponse(BaseModel):
    id: str
    name: str
    parent_id: str | None
    is_active: bool

    class Config:
        from_attributes = True


class ProductUnitResponse(BaseModel):
    id: str
    code: str
    label: str
    category: str | None
    is_system: bool
    is_active: bool

    class Config:
        from_attributes = True


# ── Request schemas ────────────────────────────────────────────────────────────

class ProductCreate(BaseModel):
    name: str
    category_id: str
    unit_id: str
    inventory_tracking: InventoryTracking

    default_unit_price: Decimal
    minimum_stock: Decimal | None = None

    # SKU: optional, unique when present
    code: str | None = None

    # Tag prefix: required for individual_items, must be null for stock_quantity
    tag_prefix: str | None = None

    description: str | None = None

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

    @field_validator("tag_prefix")
    @classmethod
    def tag_prefix_validator(cls, v: str | None) -> str | None:
        if v is None:
            return None
        v = v.strip().upper()
        if not v:
            return None
        if len(v) > 50:
            raise ValueError("Tag prefix must be at most 50 characters")
        if not v.replace("-", "").replace("_", "").isalnum():
            raise ValueError(
                "Tag prefix may only contain letters, numbers, hyphens, and underscores"
            )
        return v

    @model_validator(mode="after")
    def validate_tracking_rules(self) -> ProductCreate:
        if self.inventory_tracking == InventoryTracking.individual_items:
            if not self.tag_prefix:
                raise ValueError(
                    "Tag prefix is required for products with individual-item tracking"
                )
        else:
            if self.tag_prefix is not None:
                raise ValueError(
                    "Tag prefix must not be supplied for stock-quantity products"
                )
        return self


class ProductUpdate(BaseModel):
    name: str | None = None
    category_id: str | None = None
    unit_id: str | None = None
    inventory_tracking: InventoryTracking | None = None

    default_unit_price: Decimal | None = None
    minimum_stock: Decimal | None = None

    code: str | None = None
    tag_prefix: str | None = None

    description: str | None = None
    status: ProductStatus | None = None
    primary_document_id: int | None = None

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

    @field_validator("tag_prefix")
    @classmethod
    def tag_prefix_validator(cls, v: str | None) -> str | None:
        if v is None:
            return None
        v = v.strip().upper()
        if not v:
            return None
        if len(v) > 50:
            raise ValueError("Tag prefix must be at most 50 characters")
        if not v.replace("-", "").replace("_", "").isalnum():
            raise ValueError(
                "Tag prefix may only contain letters, numbers, hyphens, and underscores"
            )
        return v


class ProductFilters(BaseModel):
    search: str | None = None
    inventory_tracking: InventoryTracking | None = None
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
    tag_prefix: str | None

    description: str | None
    inventory_tracking: InventoryTracking

    category_id: str
    unit_id: str

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
    total: Decimal
    available: Decimal
    reserved: Decimal
    sold: Decimal
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