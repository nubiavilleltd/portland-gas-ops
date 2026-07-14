from __future__ import annotations

from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Optional

from sqlalchemy.orm import Session

from app.audit.schema import AuditActorType, AuditEntityType
from app.audit.service import AuditService
from app.core.exceptions import AppException
from app.inventory import guards
from app.inventory.enums import (
    InventoryItemCondition,
    InventoryItemStatus,
    MovementType,
)
from app.inventory.error_codes import InventoryErrorCode
from app.inventory.model import ConsumableStock, InventoryItem, StockMovement
from app.inventory.repository import InventoryRepository
from app.inventory.schema import (
    CheckInConsumableInput,
    CheckInTrackedInput,
    ReturnItemInput,
)


class InventoryService:

    def __init__(self):
        self.repo = InventoryRepository()

    def create_location(
        self,
        db: Session,
        *,
        name: str,
        address: str | None = None,
        is_default: bool = False,
    ):
        location_no = self.repo.generate_location_no(db)

        return self.repo.create_location(
            db=db,
            location_no=location_no,
            name=name,
            address=address,
            is_default=is_default,
        )

    # -------------------------------------------------------------------------
    # Retrieval
    # -------------------------------------------------------------------------

    def get_item_or_raise(self, db: Session, item_id: str) -> InventoryItem:
        item = self.repo.get_inventory_item_by_id(db, item_id)
        if not item:
            raise AppException(
                404,
                InventoryErrorCode.INVENTORY_ITEM_NOT_FOUND,
                f"Inventory item {item_id} not found",
            )
        return item

    def get_locations(self, db: Session):
        return self.repo.list_locations(db)

    def get_kpis(self, db: Session):
        return self.repo.get_kpis(db)

    # def list_items(
    #     self,
    #     db: Session,
    #     product_id: Optional[str] = None,
    #     status: Optional[InventoryItemStatus] = None,
    #     location_id: Optional[int] = None,
    #     page: int = 1,
    #     page_size: int = 50,
    # ):
    #     return self.repo.list_inventory_items(
    #         db,
    #         product_id=product_id,
    #         status=status,
    #         location_id=location_id,
    #         page=page,
    #         page_size=page_size,
    #     )

    def list_items(
        self,
        db: Session,
        product_id: Optional[str] = None,
        status: Optional[InventoryItemStatus] = None,
        location_id: Optional[int] = None,
        page: int = 1,
        page_size: int = 50,
    ):
        items, _ = self.repo.list_inventory_items(
            db,
            product_id=product_id,
            status=status,
            location_id=location_id,
            page=page,
            page_size=page_size,
        )

        return items

    def list_stock(self, db: Session):
        return self.repo.list_consumable_stock(db)

    def list_movements(
        self,
        db: Session,
        product_id: Optional[str] = None,
        item_id: Optional[int] = None,
    ):
        if item_id:
            return self.repo.list_stock_movements_for_item(db, item_id)

        return self.repo.list_stock_movements(
            db,
            product_id=product_id,
        )

    # -------------------------------------------------------------------------
    # Check In (Tracked)
    # -------------------------------------------------------------------------

    def check_in_tracked(
        self,
        db: Session,
        data: CheckInTrackedInput,
        recorded_by: str,
    ):
        from app.products.service import ProductService

        product = ProductService().get_or_raise(db, data.product_id)

        if product.product_type.value != "tracked":
            raise AppException(
                400,
                InventoryErrorCode.PRODUCT_NOT_TRACKED,
                "Only tracked products can be checked into inventory items",
            )

        location = self.repo.get_location_by_id(db, data.location_id)
        if not location:
            raise AppException(
                404,
                InventoryErrorCode.LOCATION_NOT_FOUND,
                "Location not found",
            )

        product_code = product.code or product.name[:3].upper()

        created_items = []

        for _ in range(data.quantity):
            tag_number = self.repo.generate_tag_number(db, product_code)

            item = self.repo.create_inventory_item(
                db,
                product_id=data.product_id,
                tag_number=tag_number,
                status=InventoryItemStatus.available,
                condition=data.condition,
                location_id=data.location_id,
                received_into_inventory_at=date.today(),
                notes=data.notes,
            )

            created_items.append(item)
        movement_no = self.repo.generate_movement_no(db)
        movement = self.repo.create_stock_movement(
            db,
            product_id=data.product_id,
            movement_no=movement_no,
            movement_type=MovementType.check_in,
            quantity=Decimal(data.quantity),
            location_id=data.location_id,
            recorded_by=recorded_by,
            notes=data.notes,
        )

        self.repo.add_stock_movement_items(
            db,
            movement.id,
            [item.id for item in created_items],
        )

        AuditService.record(
            db,
            entity_type=AuditEntityType.inventory_item,
            entity_id=str(created_items[0].id),
            action="check_in",
            description=f"{data.quantity} {product.name} unit(s) checked into inventory",
            actor_type=AuditActorType.employee,
            actor_employee_id=recorded_by,
        )

        return created_items

    # -------------------------------------------------------------------------
    # Check In (Consumables)
    # -------------------------------------------------------------------------

    def check_in_consumable(
        self,
        db: Session,
        data: CheckInConsumableInput,
        recorded_by: str,
    ) -> ConsumableStock:
        from app.products.service import ProductService

        product = ProductService().get_or_raise(db, data.product_id)

        if product.product_type.value != "consumable":
            raise AppException(
                400,
                InventoryErrorCode.PRODUCT_NOT_CONSUMABLE,
                "Only consumable products can be checked in this way",
            )

        location = self.repo.get_location_by_id(db, data.location_id)
        if not location:
            raise AppException(
                404,
                InventoryErrorCode.LOCATION_NOT_FOUND,
                "Location not found",
            )

        stock = self.repo.increase_stock(
            db,
            product_id=data.product_id,
            location_id=data.location_id,
            quantity=data.quantity,
        )
        movement_no = self.repo.generate_movement_no(db)

        self.repo.create_stock_movement(
            db,
            product_id=data.product_id,
            movement_type=MovementType.check_in,
            movement_no=movement_no,
            quantity=data.quantity,
            location_id=data.location_id,
            recorded_by=recorded_by,
            notes=data.notes,
        )

        AuditService.record(
            db,
            entity_type=AuditEntityType.product,
            entity_id=product.id,
            action="stock_added",
            description=(
                f"{data.quantity} {product.unit.value} of "
                f"{product.name} checked into inventory"
            ),
            actor_type=AuditActorType.employee,
            actor_employee_id=recorded_by,
        )

        return stock

    # -------------------------------------------------------------------------
    # Returns
    # -------------------------------------------------------------------------

    def return_item(
        self,
        db: Session,
        item_id: int,
        data: ReturnItemInput,
        recorded_by: str,
    ) -> InventoryItem:
        item = self.get_item_or_raise(db, item_id)

        if not guards.can_return(item):
            raise AppException(
                400,
                InventoryErrorCode.CANNOT_RETURN_ITEM,
                "Only loaned items with a customer can be returned",
            )

        new_status = (
            InventoryItemStatus.maintenance
            if data.condition == InventoryItemCondition.damaged
            else InventoryItemStatus.available
        )

        updated_item = self.repo.update_inventory_item(
            db,
            item,
            status=new_status,
            condition=data.condition,
            disposition=None,
            order_id=None,
            trip_id=None,
            customer_id=None,
            checked_out_at=None,
            expected_return_date=None,
            notes=data.notes or item.notes,
        )

        movement = self.repo.create_stock_movement(
            db,
            product_id=item.product_id,
            movement_type=MovementType.return_,
            quantity=Decimal("1"),
            location_id=item.location_id,
            recorded_by=recorded_by,
            notes=data.notes,
        )

        self.repo.add_stock_movement_items(
            db,
            movement.id,
            [item.id],
        )

        AuditService.record(
            db,
            entity_type=AuditEntityType.inventory_item,
            entity_id=str(item.id),
            action="returned",
            description=(
                f"Item {item.tag_number} returned "
                f"(condition: {data.condition.value})"
            ),
            actor_type=AuditActorType.employee,
            actor_employee_id=recorded_by,
        )

        return updated_item
# -------------------------------------------------------------------------
# Trip Check Out
# -------------------------------------------------------------------------

    def check_out_for_trip(
        self,
        db: Session,
        trip_id: str,
        actor_id: str,
    ):
        """
        Checks out every tracked inventory item required for a trip.

        - Trips may have no orders.
        - Orders may contain tracked products, consumables, or both.
        - Only tracked products require inventory checkout.
        """

        from app.fleet.trips.service import TripService
        from app.orders.service import OrderService
        from app.products.service import ProductService

        trip_service = TripService()
        order_service = OrderService()
        product_service = ProductService()

        order_ids = trip_service.get_order_ids(
            db=db,
            trip_id=trip_id,
        )

        for order_id in order_ids:

            order_items = order_service.get_order_items(
                db=db,
                order_id=order_id,
            )

            for order_item in order_items:

                product = product_service.get_or_raise(
                    db=db,
                    product_id=order_item.product_id,
                )

                # Consumables don't have inventory items to check out.
                if product.product_type.value != "tracked":
                    continue

                self._check_out_order_item(
                    db=db,
                    trip_id=trip_id,
                    order_item_id=order_item.id,
                    product_id=order_item.product_id,
                    quantity=int(order_item.quantity),
                    order_id=order_id,
                    disposition=order_item.disposition,
                    actor_id=actor_id,
                )




    def _check_out_order_item(
    self,
    db: Session,
    trip_id: int,
    order_item_id: int,
    product_id: str,
    quantity: int,
    order_id: str,
    disposition,
    actor_id: str,
):
        """
        Checks out tracked inventory items for a trip.

        NOTE:
        This implementation is intentionally simple.
        We can later move the OrderItem lookup out of InventoryService
        when we refactor the Orders module.
        """

        available_items = self.repo.get_available_inventory_items(
            db=db,
            product_id=product_id,
            limit=quantity,
        )

        if len(available_items) < quantity:
            raise AppException(
                status_code=400,
                error_code=InventoryErrorCode.INSUFFICIENT_STOCK,
                message=(
                    f"Not enough inventory available "
                    f"(required {quantity}, found {len(available_items)})."
                ),
            )
        movement_no = self.repo.generate_movement_no(db)

        movement = self.repo.create_stock_movement(
            db=db,
            movement_no=movement_no,
            product_id=product_id,
            movement_type=MovementType.check_out,
            quantity=Decimal(quantity),
            location_id=available_items[0].location_id,
            recorded_by=actor_id,
            reference_type="trip",
            reference_id=str(trip_id),
            notes=f"Checked out for trip {trip_id}",
        )

        checked_out_ids = []

        for item in available_items:

            self.repo.update_inventory_item(
                db=db,
                item=item,
                status=InventoryItemStatus.checked_out,
                disposition=disposition,
                order_id=order_id,
                trip_id=trip_id, 
                checked_out_at=datetime.now(timezone.utc),
            )

            self.repo.assign_inventory_to_order_item(
                db=db,
                order_item_id=order_item_id,
                inventory_item_id=item.id,
            )

            checked_out_ids.append(item.id)

        self.repo.add_stock_movement_items(
            db=db,
            movement_id=movement.id,
            inventory_item_ids=checked_out_ids,
        )

        AuditService.record(
            db=db,
            entity_type=AuditEntityType.inventory_item,
            entity_id=str(checked_out_ids[0]),
            action="checked_out",
            description=f"{quantity} inventory item(s) checked out for trip {trip_id}",
            actor_type=AuditActorType.employee,
            actor_employee_id=actor_id,
        )

        return checked_out_ids
    


    def release_trip_inventory(
        self,
        db: Session,
        trip_id: int,
    ) -> None:
        """
        Releases every inventory item that was checked out for a trip
        back into available inventory.

        Used when a dispatched/in-transit trip is cancelled.
        """

        movements = self.repo.get_trip_checkout_movements(
            db=db,
            trip_id=trip_id,
        )

        for movement in movements:

            item_ids = self.repo.get_inventory_item_ids_for_movement(
                db=db,
                movement_id=movement.id,
            )

            for item_id in item_ids:

                item = self.get_item_or_raise(
                    db=db,
                    item_id=item_id,
                )

                if item.status != InventoryItemStatus.checked_out:
                    continue

                self.repo.update_inventory_item(
                    db=db,
                    item=item,
                    status=InventoryItemStatus.available,
                    disposition=None,
                    order_id=None,
                    trip_id=None,
                    customer_id=None,
                    checked_out_at=None,
                    expected_return_date=None,
                )