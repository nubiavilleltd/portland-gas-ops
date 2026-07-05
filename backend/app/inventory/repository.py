# from __future__ import annotations
# from sqlalchemy.orm import Session, joinedload
# from sqlalchemy import func, or_
# from typing import Optional, List, Tuple
# from decimal import Decimal
# from datetime import date
# from app.inventory.model import (
#     InventoryItem, ConsumableStock, StockMovement,
#     StockMovementItem, WarehouseLocation, OrderItemInventory,
# )
# from app.inventory.enums import InventoryItemStatus, MovementType


# class InventoryRepository:

#     # ── Locations ─────────────────────────────────────────────────────────────

#     def get_locations(self, db: Session) -> List[WarehouseLocation]:
#         return db.query(WarehouseLocation).order_by(WarehouseLocation.is_default.desc()).all()

#     def get_location_by_id(self, db: Session, location_id: int) -> Optional[WarehouseLocation]:
#         return db.query(WarehouseLocation).filter(WarehouseLocation.id == location_id).first()

#     def get_default_location(self, db: Session) -> Optional[WarehouseLocation]:
#         return db.query(WarehouseLocation).filter(WarehouseLocation.is_default == True).first()

#     def create_location(self, db: Session, name: str, address: Optional[str], is_default: bool) -> WarehouseLocation:
#         loc = WarehouseLocation(name=name, address=address, is_default=is_default)
#         db.add(loc)
#         db.flush()
#         return loc

#     # ── Inventory items ────────────────────────────────────────────────────────

#     def get_item_by_id(self, db: Session, item_id: int) -> Optional[InventoryItem]:
#         return db.query(InventoryItem).filter(InventoryItem.id == item_id).first()

#     def get_item_by_tag(self, db: Session, tag_number: str) -> Optional[InventoryItem]:
#         return db.query(InventoryItem).filter(InventoryItem.tag_number == tag_number).first()

#     def list_items(
#         self, db: Session,
#         product_id: Optional[str] = None,
#         status:     Optional[str] = None,
#     ) -> List[InventoryItem]:
#         q = db.query(InventoryItem)
#         if product_id:
#             q = q.filter(InventoryItem.product_id == product_id)
#         if status:
#             q = q.filter(InventoryItem.status == status)
#         return q.order_by(InventoryItem.tag_number).all()

#     def create_item(self, db: Session, **fields) -> InventoryItem:
#         item = InventoryItem(**fields)
#         db.add(item)
#         db.flush()
#         return item

#     def update_item(self, db: Session, item: InventoryItem, **fields) -> InventoryItem:
#         for k, v in fields.items():
#             setattr(item, k, v)
#         db.flush()
#         return item

#     def get_available_items_for_product(
#         self, db: Session, product_id: str, limit: int
#     ) -> List[InventoryItem]:
#         return (
#             db.query(InventoryItem)
#             .filter(
#                 InventoryItem.product_id == product_id,
#                 InventoryItem.status == InventoryItemStatus.available,
#             )
#             .limit(limit)
#             .all()
#         )

#     # ── KPIs ──────────────────────────────────────────────────────────────────

#     def get_kpis(self, db: Session) -> dict:
#         rows = (
#             db.query(InventoryItem.status, func.count(InventoryItem.id))
#             .group_by(InventoryItem.status)
#             .all()
#         )
#         counts = {status: count for status, count in rows}
#         total = sum(counts.values())
#         return {
#             "total_tracked_items":  total,
#             "available_items":      counts.get(InventoryItemStatus.available, 0),
#             "reserved_items":       counts.get(InventoryItemStatus.reserved, 0),
#             "checked_out_items":    counts.get(InventoryItemStatus.checked_out, 0),
#             "with_customer_items":  counts.get(InventoryItemStatus.with_customer, 0),
#             "maintenance_items":    counts.get(InventoryItemStatus.maintenance, 0),
#         }

#     # ── Consumable stock ───────────────────────────────────────────────────────

#     def get_stock(self, db: Session, product_id: str, location_id: int) -> Optional[ConsumableStock]:
#         return db.query(ConsumableStock).filter(
#             ConsumableStock.product_id  == product_id,
#             ConsumableStock.location_id == location_id,
#         ).first()

#     def list_stock(self, db: Session) -> List[ConsumableStock]:
#         return db.query(ConsumableStock).order_by(ConsumableStock.product_id).all()

#     def upsert_stock(self, db: Session, product_id: str, location_id: int, delta: Decimal) -> ConsumableStock:
#         stock = self.get_stock(db, product_id, location_id)
#         if stock:
#             stock.quantity = stock.quantity + delta
#         else:
#             stock = ConsumableStock(
#                 product_id  = product_id,
#                 location_id = location_id,
#                 quantity    = delta,
#             )
#             db.add(stock)
#         db.flush()
#         return stock

#     # ── Stock movements ────────────────────────────────────────────────────────

#     def create_movement(
#         self,
#         db:             Session,
#         product_id:     str,
#         movement_type:  MovementType,
#         quantity:       Decimal,
#         location_id:    int,
#         recorded_by:    str,
#         reference_id:   Optional[str]  = None,
#         reference_type: Optional[str]  = None,
#         notes:          Optional[str]  = None,
#     ) -> StockMovement:
#         movement = StockMovement(
#             product_id     = product_id,
#             movement_type  = movement_type,
#             quantity       = quantity,
#             location_id    = location_id,
#             recorded_by    = recorded_by,
#             reference_id   = reference_id,
#             reference_type = reference_type,
#             notes          = notes,
#         )
#         db.add(movement)
#         db.flush()
#         return movement

#     def add_movement_items(
#         self, db: Session, movement_id: int, item_ids: List[int]
#     ) -> None:
#         for item_id in item_ids:
#             db.add(StockMovementItem(
#                 movement_id       = movement_id,
#                 inventory_item_id = item_id,
#             ))
#         db.flush()

#     def list_movements(
#         self,
#         db:         Session,
#         product_id: Optional[str] = None,
#         item_id:    Optional[int] = None,
#     ) -> List[StockMovement]:
#         if item_id:
#             # Get movements that include this specific item
#             movement_ids = (
#                 db.query(StockMovementItem.movement_id)
#                 .filter(StockMovementItem.inventory_item_id == item_id)
#                 .all()
#             )
#             ids = [m.movement_id for m in movement_ids]
#             q = db.query(StockMovement).filter(StockMovement.id.in_(ids))
#         else:
#             q = db.query(StockMovement)
#             if product_id:
#                 q = q.filter(StockMovement.product_id == product_id)
#         return q.order_by(StockMovement.created_at.desc()).all()

#     # ── Tag number generator ───────────────────────────────────────────────────

#     def generate_tag_number(
#         self, db: Session, product_code: str
#     ) -> str:
#         from datetime import datetime, timezone
#         today = datetime.now(timezone.utc).strftime("%Y%m%d")
#         pattern = f"{product_code}-{today}-%"
#         last = (
#             db.query(InventoryItem.tag_number)
#             .filter(InventoryItem.tag_number.like(pattern))
#             .order_by(InventoryItem.tag_number.desc())
#             .first()
#         )
#         if last:
#             seq = int(last[0].split("-")[-1]) + 1
#         else:
#             seq = 1
#         return f"{product_code}-{today}-{seq:03d}"







from __future__ import annotations

from decimal import Decimal
from typing import List, Optional, Tuple

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.inventory.enums import InventoryItemStatus, MovementType
from app.inventory.model import (
    ConsumableStock,
    InventoryItem,
    OrderItemInventory,
    StockMovement,
    StockMovementItem,
    WarehouseLocation,
)


class InventoryRepository:

    # -------------------------------------------------------------------------
    # Warehouse Locations
    # -------------------------------------------------------------------------

    def list_locations(self, db: Session) -> List[WarehouseLocation]:
        return (
            db.query(WarehouseLocation)
            .order_by(
                WarehouseLocation.is_default.desc(),
                WarehouseLocation.name.asc(),
            )
            .all()
        )

    def get_location_by_id(
        self,
        db: Session,
        location_id: int,
    ) -> Optional[WarehouseLocation]:
        return (
            db.query(WarehouseLocation)
            .filter(WarehouseLocation.id == location_id)
            .first()
        )

    def get_default_location(
        self,
        db: Session,
    ) -> Optional[WarehouseLocation]:
        return (
            db.query(WarehouseLocation)
            .filter(WarehouseLocation.is_default.is_(True))
            .first()
        )

    def create_location(
        self,
        db: Session,
        **fields,
    ) -> WarehouseLocation:
        location = WarehouseLocation(**fields)
        db.add(location)
        db.flush()
        return location

    # -------------------------------------------------------------------------
    # Inventory Items
    # -------------------------------------------------------------------------

    def get_inventory_item_by_id(
        self,
        db: Session,
        item_id: int,
    ) -> Optional[InventoryItem]:
        return (
            db.query(InventoryItem)
            .options(
                joinedload(InventoryItem.product),
                joinedload(InventoryItem.location),
                joinedload(InventoryItem.customer),
                joinedload(InventoryItem.order),
                joinedload(InventoryItem.trip),
            )
            .filter(InventoryItem.id == item_id)
            .first()
        )

    def get_inventory_item_by_tag(
        self,
        db: Session,
        tag_number: str,
    ) -> Optional[InventoryItem]:
        return (
            db.query(InventoryItem)
            .options(
                joinedload(InventoryItem.product),
                joinedload(InventoryItem.location),
                joinedload(InventoryItem.customer),
                joinedload(InventoryItem.order),
                joinedload(InventoryItem.trip),
            )
            .filter(InventoryItem.tag_number == tag_number)
            .first()
        )

    def list_inventory_items(
        self,
        db: Session,
        product_id: Optional[str] = None,
        status: Optional[InventoryItemStatus] = None,
        location_id: Optional[int] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> Tuple[List[InventoryItem], int]:

        q = (
            db.query(InventoryItem)
            .options(
                joinedload(InventoryItem.product),
                joinedload(InventoryItem.location),
                joinedload(InventoryItem.customer),
            )
        )

        if product_id:
            q = q.filter(InventoryItem.product_id == product_id)

        if status:
            q = q.filter(InventoryItem.status == status)

        if location_id:
            q = q.filter(InventoryItem.location_id == location_id)

        total = q.with_entities(func.count(InventoryItem.id)).scalar() or 0

        items = (
            q.order_by(
                InventoryItem.received_into_inventory_at.asc(),
                InventoryItem.tag_number.asc(),
            )
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        return items, total

    def create_inventory_item(
        self,
        db: Session,
        **fields,
    ) -> InventoryItem:
        item = InventoryItem(**fields)
        db.add(item)
        db.flush()
        return item

    def update_inventory_item(
        self,
        db: Session,
        item: InventoryItem,
        **fields,
    ) -> InventoryItem:

        for key, value in fields.items():
            setattr(item, key, value)

        db.flush()
        return item

    def get_available_inventory_items(
        self,
        db: Session,
        product_id: str,
        limit: int,
    ) -> List[InventoryItem]:

        return (
            db.query(InventoryItem)
            .filter(
                InventoryItem.product_id == product_id,
                InventoryItem.status == InventoryItemStatus.available,
            )
            .order_by(
                InventoryItem.received_into_inventory_at.asc(),
                InventoryItem.tag_number.asc(),
            )
            .limit(limit)
            .all()
        )

    # -------------------------------------------------------------------------
    # Inventory Allocation
    # -------------------------------------------------------------------------

    def assign_inventory_to_order_item(
        self,
        db: Session,
        order_item_id: int,
        inventory_item_id: int,
    ) -> OrderItemInventory:

        allocation = OrderItemInventory(
            order_item_id=order_item_id,
            inventory_item_id=inventory_item_id,
        )

        db.add(allocation)
        db.flush()

        return allocation

    def get_allocated_inventory_for_order_item(
        self,
        db: Session,
        order_item_id: int,
    ) -> List[OrderItemInventory]:

        return (
            db.query(OrderItemInventory)
            .options(joinedload(OrderItemInventory.inventory_item))
            .filter(OrderItemInventory.order_item_id == order_item_id)
            .all()
        )

    # -------------------------------------------------------------------------
    # Inventory Status Updates
    # -------------------------------------------------------------------------

    def reserve_inventory_item(
        self,
        db: Session,
        item: InventoryItem,
    ) -> None:

        item.status = InventoryItemStatus.reserved
        db.flush()

    def release_inventory_item(
        self,
        db: Session,
        item: InventoryItem,
    ) -> None:

        item.status = InventoryItemStatus.available
        db.flush()

    def check_out_inventory_item(
        self,
        db: Session,
        item: InventoryItem,
    ) -> None:

        item.status = InventoryItemStatus.checked_out
        db.flush()

    # -------------------------------------------------------------------------
    # Consumable Stock
    # -------------------------------------------------------------------------

    def get_consumable_stock(
        self,
        db: Session,
        product_id: str,
        location_id: int,
    ) -> Optional[ConsumableStock]:

        return (
            db.query(ConsumableStock)
            .filter(
                ConsumableStock.product_id == product_id,
                ConsumableStock.location_id == location_id,
            )
            .first()
        )

    def list_consumable_stock(
        self,
        db: Session,
    ) -> List[ConsumableStock]:

        return (
            db.query(ConsumableStock)
            .options(
                joinedload(ConsumableStock.product),
                joinedload(ConsumableStock.location),
            )
            .all()
        )

    def increase_stock(
        self,
        db: Session,
        product_id: str,
        location_id: int,
        quantity: Decimal,
    ) -> ConsumableStock:

        stock = self.get_consumable_stock(db, product_id, location_id)

        if stock:
            stock.quantity += quantity
        else:
            stock = ConsumableStock(
                product_id=product_id,
                location_id=location_id,
                quantity=quantity,
            )
            db.add(stock)

        db.flush()
        return stock

    def decrease_stock(
        self,
        db: Session,
        stock: ConsumableStock,
        quantity: Decimal,
    ) -> ConsumableStock:

        stock.quantity -= quantity
        db.flush()

        return stock

    # -------------------------------------------------------------------------
    # Stock Movements
    # -------------------------------------------------------------------------

    def create_stock_movement(
        self,
        db: Session,
        **fields,
    ) -> StockMovement:

        movement = StockMovement(**fields)
        db.add(movement)
        db.flush()

        return movement

    def add_stock_movement_items(
        self,
        db: Session,
        movement_id: int,
        inventory_item_ids: List[int],
    ) -> None:

        db.add_all(
            [
                StockMovementItem(
                    movement_id=movement_id,
                    inventory_item_id=item_id,
                )
                for item_id in inventory_item_ids
            ]
        )

        db.flush()

    def list_stock_movements(
        self,
        db: Session,
        product_id: Optional[str] = None,
    ) -> List[StockMovement]:

        q = (
            db.query(StockMovement)
            .options(
                joinedload(StockMovement.product),
                joinedload(StockMovement.location),
                joinedload(StockMovement.items),
            )
        )

        if product_id:
            q = q.filter(StockMovement.product_id == product_id)

        return (
            q.order_by(StockMovement.created_at.desc())
            .all()
        )

    def list_stock_movements_for_item(
        self,
        db: Session,
        inventory_item_id: int,
    ) -> List[StockMovement]:

        return (
            db.query(StockMovement)
            .join(
                StockMovementItem,
                StockMovementItem.movement_id == StockMovement.id,
            )
            .options(
                joinedload(StockMovement.product),
                joinedload(StockMovement.location),
            )
            .filter(
                StockMovementItem.inventory_item_id == inventory_item_id,
            )
            .order_by(StockMovement.created_at.desc())
            .all()
        )

    # -------------------------------------------------------------------------
    # KPIs
    # -------------------------------------------------------------------------

    def get_kpis(
        self,
        db: Session,
    ) -> dict:

        rows = (
            db.query(
                InventoryItem.status,
                func.count(InventoryItem.id),
            )
            .group_by(InventoryItem.status)
            .all()
        )

        counts = {status: count for status, count in rows}

        total = sum(counts.values())

        return {
            "total_tracked_items": total,
            "available_items": counts.get(InventoryItemStatus.available, 0),
            "reserved_items": counts.get(InventoryItemStatus.reserved, 0),
            "checked_out_items": counts.get(InventoryItemStatus.checked_out, 0),
            "with_customer_items": counts.get(InventoryItemStatus.with_customer, 0),
            "maintenance_items": counts.get(InventoryItemStatus.maintenance, 0),
        }