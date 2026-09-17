from __future__ import annotations

from enum import Enum


class InventoryTracking(str, Enum):
    individual_items = "INDIVIDUAL_ITEMS"
    stock_quantity = "STOCK_QUANTITY"


class ProductStatus(str, Enum):
    active = "active"
    inactive = "inactive"