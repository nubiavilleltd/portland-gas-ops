from __future__ import annotations
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from typing import Optional, List, Tuple
from decimal import Decimal
from datetime import date
from app.inventory.model import (
    InventoryItem, ConsumableStock, StockMovement,
    StockMovementItem, WarehouseLocation, OrderItemInventory,
)
from app.inventory.enums import InventoryItemStatus, MovementType


class InventoryRepository:

    # ── Locations ─────────────────────────────────────────────────────────────

    def get_locations(self, db: Session) -> List[WarehouseLocation]:
        return db.query(WarehouseLocation).order_by(WarehouseLocation.is_default.desc()).all()

    def get_location_by_id(self, db: Session, location_id: int) -> Optional[WarehouseLocation]:
        return db.query(WarehouseLocation).filter(WarehouseLocation.id == location_id).first()

    def get_default_location(self, db: Session) -> Optional[WarehouseLocation]:
        return db.query(WarehouseLocation).filter(WarehouseLocation.is_default == True).first()

    def create_location(self, db: Session, name: str, address: Optional[str], is_default: bool) -> WarehouseLocation:
        loc = WarehouseLocation(name=name, address=address, is_default=is_default)
        db.add(loc)
        db.flush()
        return loc

    # ── Inventory items ────────────────────────────────────────────────────────

    def get_item_by_id(self, db: Session, item_id: int) -> Optional[InventoryItem]:
        return db.query(InventoryItem).filter(InventoryItem.id == item_id).first()

    def get_item_by_tag(self, db: Session, tag_number: str) -> Optional[InventoryItem]:
        return db.query(InventoryItem).filter(InventoryItem.tag_number == tag_number).first()

    def list_items(
        self, db: Session,
        product_id: Optional[str] = None,
        status:     Optional[str] = None,
    ) -> List[InventoryItem]:
        q = db.query(InventoryItem)
        if product_id:
            q = q.filter(InventoryItem.product_id == product_id)
        if status:
            q = q.filter(InventoryItem.status == status)
        return q.order_by(InventoryItem.tag_number).all()

    def create_item(self, db: Session, **fields) -> InventoryItem:
        item = InventoryItem(**fields)
        db.add(item)
        db.flush()
        return item

    def update_item(self, db: Session, item: InventoryItem, **fields) -> InventoryItem:
        for k, v in fields.items():
            setattr(item, k, v)
        db.flush()
        return item

    def get_available_items_for_product(
        self, db: Session, product_id: str, limit: int
    ) -> List[InventoryItem]:
        return (
            db.query(InventoryItem)
            .filter(
                InventoryItem.product_id == product_id,
                InventoryItem.status == InventoryItemStatus.available,
            )
            .limit(limit)
            .all()
        )

    # ── KPIs ──────────────────────────────────────────────────────────────────

    def get_kpis(self, db: Session) -> dict:
        rows = (
            db.query(InventoryItem.status, func.count(InventoryItem.id))
            .group_by(InventoryItem.status)
            .all()
        )
        counts = {status: count for status, count in rows}
        total = sum(counts.values())
        return {
            "total_tracked_items":  total,
            "available_items":      counts.get(InventoryItemStatus.available, 0),
            "reserved_items":       counts.get(InventoryItemStatus.reserved, 0),
            "checked_out_items":    counts.get(InventoryItemStatus.checked_out, 0),
            "with_customer_items":  counts.get(InventoryItemStatus.with_customer, 0),
            "maintenance_items":    counts.get(InventoryItemStatus.maintenance, 0),
        }

    # ── Consumable stock ───────────────────────────────────────────────────────

    def get_stock(self, db: Session, product_id: str, location_id: int) -> Optional[ConsumableStock]:
        return db.query(ConsumableStock).filter(
            ConsumableStock.product_id  == product_id,
            ConsumableStock.location_id == location_id,
        ).first()

    def list_stock(self, db: Session) -> List[ConsumableStock]:
        return db.query(ConsumableStock).order_by(ConsumableStock.product_id).all()

    def upsert_stock(self, db: Session, product_id: str, location_id: int, delta: Decimal) -> ConsumableStock:
        stock = self.get_stock(db, product_id, location_id)
        if stock:
            stock.quantity = stock.quantity + delta
        else:
            stock = ConsumableStock(
                product_id  = product_id,
                location_id = location_id,
                quantity    = delta,
            )
            db.add(stock)
        db.flush()
        return stock

    # ── Stock movements ────────────────────────────────────────────────────────

    def create_movement(
        self,
        db:             Session,
        product_id:     str,
        movement_type:  MovementType,
        quantity:       Decimal,
        location_id:    int,
        recorded_by:    str,
        reference_id:   Optional[str]  = None,
        reference_type: Optional[str]  = None,
        notes:          Optional[str]  = None,
    ) -> StockMovement:
        movement = StockMovement(
            product_id     = product_id,
            movement_type  = movement_type,
            quantity       = quantity,
            location_id    = location_id,
            recorded_by    = recorded_by,
            reference_id   = reference_id,
            reference_type = reference_type,
            notes          = notes,
        )
        db.add(movement)
        db.flush()
        return movement

    def add_movement_items(
        self, db: Session, movement_id: int, item_ids: List[int]
    ) -> None:
        for item_id in item_ids:
            db.add(StockMovementItem(
                movement_id       = movement_id,
                inventory_item_id = item_id,
            ))
        db.flush()

    def list_movements(
        self,
        db:         Session,
        product_id: Optional[str] = None,
        item_id:    Optional[int] = None,
    ) -> List[StockMovement]:
        if item_id:
            # Get movements that include this specific item
            movement_ids = (
                db.query(StockMovementItem.movement_id)
                .filter(StockMovementItem.inventory_item_id == item_id)
                .all()
            )
            ids = [m.movement_id for m in movement_ids]
            q = db.query(StockMovement).filter(StockMovement.id.in_(ids))
        else:
            q = db.query(StockMovement)
            if product_id:
                q = q.filter(StockMovement.product_id == product_id)
        return q.order_by(StockMovement.created_at.desc()).all()

    # ── Tag number generator ───────────────────────────────────────────────────

    def generate_tag_number(
        self, db: Session, product_code: str
    ) -> str:
        from datetime import datetime, timezone
        today = datetime.now(timezone.utc).strftime("%Y%m%d")
        pattern = f"{product_code}-{today}-%"
        last = (
            db.query(InventoryItem.tag_number)
            .filter(InventoryItem.tag_number.like(pattern))
            .order_by(InventoryItem.tag_number.desc())
            .first()
        )
        if last:
            seq = int(last[0].split("-")[-1]) + 1
        else:
            seq = 1
        return f"{product_code}-{today}-{seq:03d}"