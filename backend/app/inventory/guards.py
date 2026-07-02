from __future__ import annotations
from app.inventory.model import InventoryItem
from app.inventory.enums import InventoryItemStatus, DispositionStatus

def can_return(item: InventoryItem) -> bool:
    """Only loaned items with_customer can be returned."""
    return (
        item.status == InventoryItemStatus.with_customer and
        item.disposition == DispositionStatus.loaned
    )

def is_available(item: InventoryItem) -> bool:
    return item.status == InventoryItemStatus.available