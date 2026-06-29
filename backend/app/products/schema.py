from __future__ import annotations

from pydantic import BaseModel, field_validator, model_validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

from app.products.enums import ProductType, ProductUnit, ProductStatus


class ProductImageResponse(BaseModel):
    id:   str
    url:  str
    name: str

    class Config:
        from_attributes = True


class ProductCreate(BaseModel):
    name:               str
    product_type:       ProductType = ProductType.consumable
    unit:               ProductUnit = ProductUnit.kg
    default_unit_price: Decimal
    code:               Optional[str]     = None
    description:        Optional[str]     = None
    minimum_stock:      Optional[Decimal] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Product name cannot be empty")
        return v.strip()

    @field_validator("default_unit_price")
    @classmethod
    def price_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Price must be greater than zero")
        return v

    @field_validator("minimum_stock")
    @classmethod
    def stock_positive(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and v < 0:
            raise ValueError("Minimum stock cannot be negative")
        return v

    @model_validator(mode="after")
    def tracked_requires_code(self) -> ProductCreate:
        if self.product_type == ProductType.tracked and not self.code:
            raise ValueError("Product code is required for tracked assets")
        if self.product_type == ProductType.tracked:
            self.unit = ProductUnit.unit
        return self

    @field_validator("code")
    @classmethod
    def code_uppercase(cls, v: Optional[str]) -> Optional[str]:
        if v:
            return v.strip().upper()
        return v


class ProductUpdate(BaseModel):
    name:               Optional[str]         = None
    product_type:       Optional[ProductType] = None
    unit:               Optional[ProductUnit] = None
    default_unit_price: Optional[Decimal]     = None
    code:               Optional[str]         = None
    description:        Optional[str]         = None
    minimum_stock:      Optional[Decimal]     = None
    status:             Optional[ProductStatus] = None

    @field_validator("default_unit_price")
    @classmethod
    def price_positive(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and v <= 0:
            raise ValueError("Price must be greater than zero")
        return v


class ProductFilters(BaseModel):
    search:       Optional[str]           = None
    product_type: Optional[ProductType]   = None
    status:       Optional[ProductStatus] = None
    page:         int = 1
    page_size:    int = 50

    @field_validator("page_size")
    @classmethod
    def page_size_limit(cls, v: int) -> int:
        if v > 200:
            raise ValueError("page_size cannot exceed 200")
        return v


class ProductResponse(BaseModel):
    id:                 str
    product_no:         Optional[str]
    name:               str
    code:               Optional[str]
    description:        Optional[str]
    product_type:       ProductType
    unit:               ProductUnit
    default_unit_price: Decimal
    minimum_stock:      Optional[Decimal]
    status:             ProductStatus
    images:             List[ProductImageResponse] = []
    created_at:         datetime
    updated_at:         datetime

    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    items:     List[ProductResponse]
    total:     int
    page:      int
    page_size: int
    has_next:  bool
