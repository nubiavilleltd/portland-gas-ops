from __future__ import annotations

from decimal import Decimal
from typing import List, Optional, Tuple

from sqlalchemy import func, exists
from sqlalchemy.orm import Session, joinedload
from app.shared.utils.number_generator import generate_entity_no

from app.inventory.enums import InventoryItemStatus, MovementType, DispositionStatus
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

    def generate_location_no(
        self,
        db: Session,
    ) -> str:
        return generate_entity_no(
            db=db,
            model=WarehouseLocation,
            field_name="location_no",
            prefix="LOC",
        )
    
    def generate_movement_no(
        self,
        db: Session,
    ) -> str:
        return generate_entity_no(
            db=db,
            model=StockMovement,
            field_name="movement_no",
            prefix="MOV",
        )
    
    def generate_tag_number(
        self,
        db: Session,
        product_code: str,
    ) -> str:
        return generate_entity_no(
            db=db,
            model=InventoryItem,
            field_name="tag_number",
            prefix=product_code,
        )

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
        location_id: str,
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
        item_id: str,
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
    
    def get_inventory_items(
        self,
        db: Session,
        item_ids: list[str],
    ) -> list[InventoryItem]:

        return (
            db.query(InventoryItem)
            .filter(
                InventoryItem.id.in_(item_ids),
            )
            .all()
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
        location_id: Optional[str] = None,
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
        inventory_item_id: str,
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
    
    def get_allocated_inventory_for_trip(
        self,
        db: Session,
        trip_id: str,
    ) -> List[InventoryItem]:

        return (
            db.query(InventoryItem)
            .filter(InventoryItem.trip_id == trip_id)
            .all()
        )
    # -------------------------------------------------------------------------
    # Inventory Status Updates
    # -------------------------------------------------------------------------

    def reserve_inventory_item(
        self,
        db: Session,
        item: InventoryItem,
        *,
        order_id: str,
        trip_id: str,
        disposition: DispositionStatus,
    ) -> None:

        item.status = InventoryItemStatus.reserved
        item.order_id = order_id
        item.trip_id = trip_id
        item.disposition = disposition

        db.flush()
    
    def deduct_consumable_stock(
        self,
        db: Session,
        *,
        product_id: str,
        location_id: str,
        quantity: Decimal,
    ) -> ConsumableStock:

        stock = self.get_consumable_stock(
            db=db,
            product_id=product_id,
            location_id=location_id,
        )

        if stock is None:
            raise ValueError(
                "Consumable stock not found."
            )

        if stock.quantity < quantity:
            raise ValueError(
                f"Insufficient stock. Available {stock.quantity}, required {quantity}."
            )

        stock.quantity -= quantity

        db.flush()

        return stock
    
    
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
        location_id: str,
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
        location_id: str,
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
        movement_id: str,
        inventory_item_ids: List[str],
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
        inventory_item_id: str,
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
    
    def get_trip_checkout_movements(
        self,
        db: Session,
        trip_id: str,
    ) -> List[StockMovement]:

        return (
            db.query(StockMovement)
            .filter(
                StockMovement.reference_type == "trip",
                StockMovement.reference_id == str(trip_id),
                StockMovement.movement_type == MovementType.check_out,
            )
            .all()
        )
    
    def get_inventory_item_ids_for_movement(
        self,
        db: Session,
        movement_id: str,
    ) -> List[int]:

        rows = (
            db.query(StockMovementItem.inventory_item_id)
            .filter(
                StockMovementItem.movement_id == movement_id,
            )
            .all()
        )

        return [row.inventory_item_id for row in rows]
    


    def is_inventory_item_assigned(
        self,
        db: Session,
        inventory_item_id: str,
    ) -> bool:
        return db.query(
            exists().where(
                OrderItemInventory.inventory_item_id == inventory_item_id
            )
        ).scalar()