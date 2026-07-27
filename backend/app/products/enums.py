from enum import Enum

class ProductType(str, Enum):
    consumable = "consumable"
    tracked    = "tracked"

class ProductUnit(str, Enum):
    kg     = "kg"
    litre  = "litre"
    m3     = "m3"
    tonne  = "tonne"
    unit   = "unit"

class ProductStatus(str, Enum):
    active   = "active"
    inactive = "inactive"