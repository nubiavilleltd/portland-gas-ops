# from __future__ import annotations
# from app.inventory.model import InventoryItem
# from app.inventory.enums import InventoryItemStatus, DispositionStatus

# def can_return(item: InventoryItem) -> bool:
#     """Only loaned items with_customer can be returned."""
#     return (
#         item.status == InventoryItemStatus.with_customer and
#         item.disposition == DispositionStatus.loaned
#     )

# def is_available(item: InventoryItem) -> bool:
#     return item.status == InventoryItemStatus.available



from __future__ import annotations

from app.inventory.model import InventoryItem
from app.inventory.enums import (
    InventoryItemStatus,
    DispositionStatus,
)


def is_available(item: InventoryItem) -> bool:
    return item.status == InventoryItemStatus.available


def is_reserved(item: InventoryItem) -> bool:
    return item.status == InventoryItemStatus.reserved


def can_return(item: InventoryItem) -> bool:
    """Only loaned items currently with the customer can be returned."""
    return (
        item.status == InventoryItemStatus.with_customer
        and item.disposition == DispositionStatus.loaned
    )