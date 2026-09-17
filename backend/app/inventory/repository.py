from __future__ import annotations

from decimal import Decimal
from typing import List, Optional, Tuple

from sqlalchemy import func, exists, or_
from sqlalchemy.orm import Session, joinedload

from app.shared.utils.number_generator import generate_entity_no

from app.inventory.enums import InventoryItemStatus, DispositionStatus
from app.inventory.model import (
    ConsumableStock,
    InventoryItem,
    OrderItemInventory,
    StockMovement,
    StockMovementItem,
    WarehouseLocation,
)

from app.orders.model import Order, OrderItem
from app.inventory import utils
from app.products.model import Product


class InventoryRepository:

    # -------------------------------------------------------------------------
    # Warehouse Locations
    # -------------------------------------------------------------------------

    def generate_location_no(self, db: Session) -> str:
        return generate_entity_no(
            db=db,
            model=WarehouseLocation,
            field_name="location_no",
            prefix="LOC",
        )

    def generate_movement_no(self, db: Session) -> str:
        return generate_entity_no(
            db=db,
            model=StockMovement,
            field_name="movement_no",
            prefix="MOV",
        )

    def generate_tag_number(
        self,
        db: Session,
        tag_prefix: str,
    ) -> str:
        return generate_entity_no(
            db=db,
            model=InventoryItem,
            field_name="tag_number",
            prefix=tag_prefix,
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
            .filter(InventoryItem.id.in_(item_ids))
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
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> Tuple[List[InventoryItem], int]:

        q = (
            db.query(InventoryItem)
            .options(
                joinedload(InventoryItem.product),
                joinedload(InventoryItem.location),
                joinedload(InventoryItem.customer),
                joinedload(InventoryItem.order),
                joinedload(InventoryItem.trip),
            )
        )

        if product_id:
            q = q.filter(InventoryItem.product_id == product_id)

        if status:
            q = q.filter(InventoryItem.status == status)

        if location_id:
            q = q.filter(InventoryItem.location_id == location_id)

        if search:
            term = f"%{search.strip()}%"
            q = q.filter(
                or_(
                    InventoryItem.tag_number.ilike(term),
                    InventoryItem.serial_number.ilike(term),
                )
            )

        total = q.with_entities(func.count(InventoryItem.id)).scalar() or 0

        items = (
            q.order_by(InventoryItem.received_into_inventory_at.desc())
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

        existing = (
            db.query(OrderItemInventory)
            .filter(
                OrderItemInventory.order_item_id == order_item_id,
                OrderItemInventory.inventory_item_id == inventory_item_id,
            )
            .first()
        )

        if existing is not None:
            existing.released_at = None
            db.flush()
            return existing

        allocation = OrderItemInventory(
            order_item_id=order_item_id,
            inventory_item_id=inventory_item_id,
        )

        db.add(allocation)
        db.flush()

        return allocation

    def release_order_item_inventory_for_item(
        self,
        db: Session,
        inventory_item_id: str,
    ) -> None:
        (
            db.query(OrderItemInventory)
            .filter(
                OrderItemInventory.inventory_item_id == inventory_item_id,
                OrderItemInventory.released_at.is_(None),
            )
            .update(
                {OrderItemInventory.released_at: func.now()},
                synchronize_session=False,
            )
        )

        db.flush()

    def get_allocated_inventory_for_order_item(
        self,
        db: Session,
        order_item_id: int,
    ) -> List[OrderItemInventory]:
        return (
            db.query(OrderItemInventory)
            .options(joinedload(OrderItemInventory.inventory_item))
            .filter(
                OrderItemInventory.order_item_id == order_item_id,
                OrderItemInventory.released_at.is_(None),
            )
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
        disposition: Optional[DispositionStatus] = None,
    ) -> None:

        item.status = InventoryItemStatus.reserved
        item.order_id = order_id
        item.trip_id = trip_id
        item.disposition = disposition or DispositionStatus.sold

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
    # Stock Quantity
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

    def get_consumable_stock_by_id(
        self,
        db: Session,
        stock_id: str,
    ) -> Optional[ConsumableStock]:
        return (
            db.query(ConsumableStock)
            .options(
                joinedload(ConsumableStock.product).joinedload(Product.unit),
                joinedload(ConsumableStock.location),
            )
            .filter(ConsumableStock.id == stock_id)
            .first()
        )

    def get_available_consumable_locations(
        self,
        db: Session,
        product_id: str,
    ):
        return (
            db.query(ConsumableStock)
            .options(joinedload(ConsumableStock.location))
            .filter(
                ConsumableStock.product_id == product_id,
                (ConsumableStock.quantity - ConsumableStock.reserved_quantity) > 0,
            )
            .all()
        )

    def list_consumable_stock(
        self,
        db: Session,
        product_id: Optional[str] = None,
    ) -> List[ConsumableStock]:

        q = (
            db.query(ConsumableStock)
            .options(
                joinedload(ConsumableStock.product).joinedload(Product.unit),
                joinedload(ConsumableStock.location),
            )
        )

        if product_id:
            q = q.filter(ConsumableStock.product_id == product_id)

        return q.all()

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

    def restore_consumable_stock(
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
                "Consumable stock not found while restoring stock."
            )

        stock.quantity += quantity
        db.flush()
        return stock

    def reserve_consumable_stock(
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
            raise ValueError("Consumable stock not found.")

        available = stock.quantity - stock.reserved_quantity
        if available < quantity:
            raise ValueError(
                f"Insufficient available stock. Available {available}, "
                f"required {quantity}."
            )

        stock.reserved_quantity += quantity
        db.flush()
        return stock

    def release_consumable_reservation(
        self,
        db: Session,
        *,
        product_id: str,
        location_id: str,
        quantity: Decimal,
    ) -> Optional[ConsumableStock]:

        stock = self.get_consumable_stock(
            db=db,
            product_id=product_id,
            location_id=location_id,
        )

        if stock is None:
            # Nothing to release — no stock record for this product/location.
            return None

        if stock.reserved_quantity <= 0:
            # No reservation exists to release. Cancellation is idempotent.
            return stock

        # Cap the release at what's actually reserved rather than raising.
        to_release = min(quantity, stock.reserved_quantity)
        stock.reserved_quantity -= to_release
        db.flush()
        return stock

    def dispatch_consumable_stock(
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
            raise ValueError("Consumable stock not found.")

        if stock.quantity < quantity:
            raise ValueError(
                f"Cannot dispatch more than on-hand. "
                f"Quantity {stock.quantity}, requested dispatch {quantity}."
            )
        if stock.reserved_quantity < quantity:
            raise ValueError(
                f"Cannot dispatch more than reserved. "
                f"Reserved {stock.reserved_quantity}, requested dispatch {quantity}."
            )

        stock.quantity -= quantity
        stock.reserved_quantity -= quantity
        stock.sold_quantity += quantity
        db.flush()
        return stock

    def restore_dispatched_consumable_stock(
        self,
        db: Session,
        *,
        product_id: str,
        location_id: str,
        quantity: Decimal,
    ) -> ConsumableStock:
        """
        Reverses a dispatch. Used when a trip is cancelled after stock
        was dispatched.
        """

        stock = self.get_consumable_stock(
            db=db,
            product_id=product_id,
            location_id=location_id,
        )
        if stock is None:
            raise ValueError("Consumable stock not found.")

        if stock.sold_quantity < quantity:
            raise ValueError(
                f"Cannot restore more than sold. "
                f"Sold {stock.sold_quantity}, requested restore {quantity}."
            )

        stock.quantity += quantity
        stock.sold_quantity -= quantity
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
        location_id: Optional[str] = None,
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
        if location_id:
            q = q.filter(StockMovement.location_id == location_id)

        return q.order_by(StockMovement.created_at.desc()).all()

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
            .filter(StockMovementItem.inventory_item_id == inventory_item_id)
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

    # -------------------------------------------------------------------------
    # Availability helpers
    # -------------------------------------------------------------------------

    def is_inventory_item_assigned(
        self,
        db: Session,
        inventory_item_id: str,
    ) -> bool:
        return db.query(
            exists().where(
                OrderItemInventory.inventory_item_id == inventory_item_id,
                OrderItemInventory.released_at.is_(None),
            )
        ).scalar()

    def get_overview_aggregates(
        self,
        db: Session,
        product_ids: list[str],
    ) -> dict:
        """
        Return aggregate availability data for a set of products.

        Two queries, one per tracking mode, regardless of how many
        products are requested. No N+1.

        Returns:
            {
              "individual_item_counts": {product_id: {status: count}},
              "stock_quantity_totals":  {product_id: {quantity, reserved, sold}},
            }
        """

        individual_item_counts: dict[str, dict] = {}
        stock_quantity_totals: dict[str, dict] = {}

        if not product_ids:
            return {
                "individual_item_counts": individual_item_counts,
                "stock_quantity_totals": stock_quantity_totals,
            }

        # Query A — individual item status counts
        item_rows = (
            db.query(
                InventoryItem.product_id,
                InventoryItem.status,
                func.count(InventoryItem.id),
            )
            .filter(InventoryItem.product_id.in_(product_ids))
            .group_by(InventoryItem.product_id, InventoryItem.status)
            .all()
        )

        for product_id, status, count in item_rows:
            individual_item_counts.setdefault(product_id, {})[status] = count

        # Query B — stock quantity totals
        stock_rows = (
            db.query(
                ConsumableStock.product_id,
                func.coalesce(func.sum(ConsumableStock.quantity), 0),
                func.coalesce(func.sum(ConsumableStock.reserved_quantity), 0),
                func.coalesce(func.sum(ConsumableStock.sold_quantity), 0),
            )
            .filter(ConsumableStock.product_id.in_(product_ids))
            .group_by(ConsumableStock.product_id)
            .all()
        )

        for product_id, qty, res, sold in stock_rows:
            stock_quantity_totals[product_id] = {
                "quantity": Decimal(qty or 0),
                "reserved": Decimal(res or 0),
                "sold": Decimal(sold or 0),
            }

        return {
            "individual_item_counts": individual_item_counts,
            "stock_quantity_totals": stock_quantity_totals,
        }

    def get_individual_item_counts(
        self,
        db: Session,
        product_id: str,
    ) -> dict[str, int]:
        """
        Returns counts by status for all individual items of a product.

        Example:
            {"available": 15, "reserved": 3, "sold": 5}
        """
        rows = (
            db.query(
                InventoryItem.status,
                func.count(InventoryItem.id),
            )
            .filter(InventoryItem.product_id == product_id)
            .group_by(InventoryItem.status)
            .all()
        )
        return {status: count for status, count in rows}

    def get_stock_quantity_totals(
        self,
        db: Session,
        product_id: str,
    ) -> dict[str, Decimal]:
        """
        Returns aggregated stock quantity totals for a product across
        all locations.

        Keys:
            quantity   - physical on-hand (includes reserved)
            reserved   - subset of quantity allocated to orders
            sold       - cumulative quantity that has been dispatched
        """
        row = (
            db.query(
                func.coalesce(func.sum(ConsumableStock.quantity), 0),
                func.coalesce(func.sum(ConsumableStock.reserved_quantity), 0),
                func.coalesce(func.sum(ConsumableStock.sold_quantity), 0),
            )
            .filter(ConsumableStock.product_id == product_id)
            .one()
        )

        return {
            "quantity": Decimal(row[0] or 0),
            "reserved": Decimal(row[1] or 0),
            "sold": Decimal(row[2] or 0),
        }

    # NOTE: the following methods are retained for now but are either
    # superseded by the above or no longer used. They will be removed in
    # a later step once the service layer stops calling them.
    #
    # - deduct_consumable_stock     (superseded by reserve/dispatch methods)
    # - count_available_inventory_items (superseded by get_individual_item_counts)
    # - get_total_available_consumable_stock (superseded by get_stock_quantity_totals)
    # - get_committed_quantity      (superseded by the reservation model)

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
            raise ValueError("Consumable stock not found.")

        if stock.quantity < quantity:
            raise ValueError(
                f"Insufficient stock. Available {stock.quantity}, required {quantity}."
            )

        stock.quantity -= quantity
        db.flush()
        return stock

    def count_available_inventory_items(
        self,
        db: Session,
        product_id: str,
    ) -> int:
        return (
            db.query(InventoryItem)
            .filter(
                InventoryItem.product_id == product_id,
                InventoryItem.status == InventoryItemStatus.available,
            )
            .count()
        )

    def get_total_available_consumable_stock(
        self,
        db: Session,
        product_id: str,
    ) -> Decimal:
        quantity = (
            db.query(func.sum(ConsumableStock.quantity))
            .filter(ConsumableStock.product_id == product_id)
            .scalar()
        )
        return quantity or Decimal("0")

    def get_committed_quantity(
        self,
        db: Session,
        product_id: str,
    ) -> Decimal:
        """
        DEPRECATED — retained temporarily; will be removed once the
        service layer stops calling it.

        Returns the total quantity of a product that has already been
        committed by orders with any payment received.
        """
        query = (
            db.query(func.sum(OrderItem.quantity))
            .join(Order, Order.id == OrderItem.order_id)
            .filter(OrderItem.product_id == product_id)
        )
        query = utils.committed_order_filters(query)
        quantity = query.scalar()
        return quantity or Decimal("0")