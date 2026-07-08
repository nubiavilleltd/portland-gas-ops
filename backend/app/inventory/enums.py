# from __future__ import annotations
# from enum import Enum

# class InventoryItemStatus(str, Enum):
#     available     = "available"
#     reserved      = "reserved"
#     checked_out   = "checked_out"
#     with_customer = "with_customer"
#     maintenance   = "maintenance"
#     retired       = "retired"
#     returned      = "returned"

# class InventoryItemCondition(str, Enum):
#     new         = "new"
#     used        = "used"
#     refurbished = "refurbished"
#     damaged     = "damaged"

# class MovementType(str, Enum):
#     check_in    = "check_in"
#     check_out   = "check_out"
#     reservation = "reservation"
#     return_     = "return"
#     adjustment  = "adjustment"

# class ReferenceType(str, Enum):
#     order          = "order"
#     trip           = "trip"
#     purchase_order = "purchase_order"
#     manual         = "manual"

# class DispositionStatus(str, Enum):
#     sold   = "sold"
#     loaned = "loaned"






from __future__ import annotations

from enum import Enum


class InventoryItemStatus(str, Enum):
    available = "available"
    reserved = "reserved"
    in_transit = "in_transit"
    checked_out   = "checked_out"
    with_customer = "with_customer"
    maintenance = "maintenance"
    retired = "retired"


class InventoryItemCondition(str, Enum):
    new = "new"
    used = "used"
    refurbished = "refurbished"
    damaged = "damaged"


class MovementType(str, Enum):
    check_in = "check_in"
    check_out = "check_out"

    reservation = "reservation"
    reservation_release = "reservation_release"

    return_ = "return"

    adjustment = "adjustment"


class ReferenceType(str, Enum):
    order = "order"
    trip = "trip"
    purchase_order = "purchase_order"
    manual = "manual"


class DispositionStatus(str, Enum):
    sold = "sold"
    loaned = "loaned"