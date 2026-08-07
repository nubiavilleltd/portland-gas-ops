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
    ReferenceType,
)
from app.inventory.error_codes import InventoryErrorCode
from app.inventory.model import ConsumableStock, InventoryItem, StockMovement
from app.inventory.repository import InventoryRepository
from app.inventory.schema import (
    CheckInConsumableInput,
    CheckInTrackedInput,
    ReturnItemInput,
    AvailableConsumableLocationResponse,
    ProductAvailabilityResponse
)
from app.orders.model import OrderItem
from app.fleet.trips.model import Trip
# from app.products.service import ProductService
from app.products.model import Product
from app.products.enums import ProductType


class InventoryService:

    def __init__(self):
        self.repo = InventoryRepository()
        # self.product_service = ProductService()
    def list_available_consumable_locations(
        self,
        db: Session,
        product_id: str,
    ):
        rows = self.repo.get_available_consumable_locations(
            db=db,
            product_id=product_id,
        )

        return [
            AvailableConsumableLocationResponse(
                location_id=row.location.id,
                location_name=row.location.name,
                available_quantity=row.quantity,
            )
            for row in rows
        ]

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

    def get_available_consumable_locations(
        self,
        db: Session,
        product_id: str,
    ):
        """
        Returns only warehouse locations that currently have
        available stock for the given consumable product.
        """

        return self.repo.get_available_consumable_locations(
            db=db,
            product_id=product_id,
        )
    
    def get_consumable_stock_detail(
        self,
        db: Session,
        stock_id: str,
    ):
        stock = self.repo.get_consumable_stock_by_id(db=db, stock_id=stock_id)

        if not stock:
            raise AppException(
                status_code=404,
                error_code=InventoryErrorCode.CONSUMABLE_STOCK_NOT_FOUND,
                message="Consumable stock record not found.",
            )
        movements = self.repo.list_stock_movements(
                        db=db,
                        product_id=stock.product_id,
                        location_id=stock.location_id,
                    )
        return stock, movements

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
        actor_employee_id: str,
        recorded_by_name: str,
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
            recorded_by_name=recorded_by_name,
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
            actor_employee_id=actor_employee_id,
            actor_name=recorded_by_name,
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
        actor_employee_id:str,
        recorded_by_name: str,
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
            recorded_by_name=recorded_by_name,
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
            actor_employee_id=actor_employee_id,
            actor_name=recorded_by_name,
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
        recorded_by_name: str,
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
            recorded_by_name=recorded_by_name,
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
            actor_name=recorded_by_name,
        )

        return updated_item

# -------------------------------------------------------------------------
# Trip Check Out
# -------------------------------------------------------------------------

    def check_out_for_trip(
        self,
        db: Session,
        trip: Trip,
        actor_user_id: str,
        actor_employee_id: str,
        actor_name: str,
    ):
        """
        Checks out every tracked inventory item already reserved for a trip.

        Reservation happens during Mark Ready.
        Dispatch only converts reserved inventory into checked-out inventory.
        """

        from app.fleet.trips.service import TripService
        from app.orders.service import OrderService
        from app.products.service import ProductService

        trip_service = TripService()
        order_service = OrderService()
        product_service = ProductService()

        order_ids = trip_service.get_order_ids(
            db=db,
            trip_id=trip.id,
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

                if product.product_type.value == "tracked":
                    self._check_out_order_item(
                        db=db,
                        trip=trip,
                        order_item_id=order_item.id,
                        actor_user_id=actor_user_id,
                        actor_employee_id=actor_employee_id,
                        actor_name=actor_name,
                    )
                else:
                    self._check_out_consumable(
                        db=db,
                        trip=trip,
                        order_item=order_item,
                        actor_user_id=actor_user_id,
                        actor_employee_id=actor_employee_id,
                        actor_name=actor_name,
                    )


    def _check_out_order_item(
        self,
        db: Session,
        trip: Trip,
        order_item_id: int,
        actor_user_id: str,
        actor_employee_id: str,
        actor_name: str,
    ):
        """
        Checks out inventory already allocated to an order item.

        Inventory allocation must already exist from Mark Ready.
        """

        allocations = self.repo.get_allocated_inventory_for_order_item(
            db=db,
            order_item_id=order_item_id,
        )

        if not allocations:
            raise AppException(
                status_code=400,
                error_code=InventoryErrorCode.NO_INVENTORY_ASSIGNED,
                message="No inventory has been assigned to this order item.",
            )
        
        checked_out_at = datetime.now(timezone.utc)
        checked_out_ids = []

        #
        # Validate every allocated item is still reserved.
        #
        for allocation in allocations:

            item = allocation.inventory_item

            if item.status is not InventoryItemStatus.reserved:
                raise AppException(
                    status_code=400,
                    error_code=InventoryErrorCode.INVALID_INVENTORY_STATUS,
                    message=(
                        f"Inventory item {item.tag_number} "
                        f"is {item.status.value}, not reserved."
                    ),
                )

        first_item = allocations[0].inventory_item

        movement_no = self.repo.generate_movement_no(db)

        movement = self.repo.create_stock_movement(
            db=db,
            movement_no=movement_no,
            product_id=first_item.product_id,
            movement_type=MovementType.check_out,
            quantity=Decimal(len(allocations)),
            location_id=first_item.location_id,
            recorded_by=actor_user_id,
            recorded_by_name=actor_name,
            reference_type=ReferenceType.trip,
            reference_id=str(trip.id),
            notes=(
                f"Checked out {len(allocations)} reserved inventory item(s) "
                f"for trip {trip.trip_no}"
            ),
        )

        #
        # Check out every reserved item.
        #
        for allocation in allocations:

            item = allocation.inventory_item

            self.repo.update_inventory_item(
                db=db,
                item=item,
                status=InventoryItemStatus.checked_out,
                checked_out_at=datetime.now(timezone.utc),
                trip_id=trip.id,
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
            entity_id=str(first_item.id),
            action="checked_out",
            description=(
                f"{len(checked_out_ids)} inventory item(s) "
                f"checked out for trip {trip.trip_no}"
            ),
            actor_type=AuditActorType.employee,
            actor_employee_id=actor_employee_id,
            actor_name=actor_name,
        )

        return checked_out_ids

    def _check_out_consumable(
        self,
        db: Session,
        trip: Trip,
        order_item: OrderItem,
        actor_user_id: str,
        actor_employee_id: str,
        actor_name: str,
    ):
        """
        Records checkout of consumable stock.

        Stock was already deducted during Mark Ready.
        Dispatch only records the physical movement out of the warehouse.
        """

        if order_item.location_id is None:
            raise AppException(
                status_code=400,
                error_code=InventoryErrorCode.LOCATION_NOT_FOUND,
                message="Consumable order item has no assigned warehouse.",
            )

        stock = self.repo.get_consumable_stock(
            db=db,
            product_id=order_item.product_id,
            location_id=order_item.location_id,
        )

        if stock is None:
            raise AppException(
                status_code=400,
                error_code=InventoryErrorCode.INSUFFICIENT_STOCK,
                message=(
                    "Consumable stock record not found. "
                    "Mark Ready may not have completed successfully."
                ),
            )

        quantity = Decimal(str(order_item.quantity))

        self.repo.create_stock_movement(
            db=db,
            movement_no=self.repo.generate_movement_no(db),
            product_id=order_item.product_id,
            movement_type=MovementType.check_out,
            quantity=quantity,
            location_id=order_item.location_id,
            recorded_by=actor_user_id,
            recorded_by_name=actor_name,
            reference_type=ReferenceType.trip,
            reference_id=str(trip.id),
            notes=(
                f"Checked out {quantity:.2f} of {order_item.product_name} "
                f"for trip {trip.trip_no}"
            ),
        )

        AuditService.record(
            db=db,
            entity_type=AuditEntityType.order,
            entity_id=str(order_item.order_id),
            action="consumable_checked_out",
            description=(
                f"Checked out {quantity:.2f} of {order_item.product_name} "
                f"for trip {trip.trip_no}"
            ),
            actor_type=AuditActorType.employee,
            actor_employee_id=actor_employee_id,
            actor_name=actor_name,
        )


    # def release_trip_inventory(
    #     self,
    #     db: Session,
    #     trip_id: str,
    # ) -> None:
    #     """
    #     Releases every inventory item allocated to a trip.

    #     If the trip was cancelled before dispatch,
    #     reserved items become available.

    #     If the trip was cancelled after dispatch,
    #     checked-out items become available.

    #     Other statuses are ignored.
    #     """

    #     items = self.repo.get_allocated_inventory_for_trip(
    #         db=db,
    #         trip_id=trip_id,
    #     )

    #     for item in items:

    #         if item.status not in (
    #             InventoryItemStatus.reserved,
    #             InventoryItemStatus.checked_out,
    #         ):
    #             continue

    #         self.repo.update_inventory_item(
    #             db=db,
    #             item=item,
    #             status=InventoryItemStatus.available,
    #             disposition=None,
    #             order_id=None,
    #             trip_id=None,
    #             customer_id=None,
    #             checked_out_at=None,
    #             expected_return_date=None,
    #         )



    def release_trip_inventory(
        self,
        db: Session,
        trip_id: str,
    ) -> None:
        """
        Releases inventory associated with a trip.

        Tracked inventory:
            reserved/checked_out → available

        Consumable inventory:
            restores the quantity deducted during Mark Ready.

        This is used when a trip is cancelled.
        """

        from app.fleet.trips.service import TripService
        from app.orders.service import OrderService
        from app.products.service import ProductService

        trip_service = TripService()
        order_service = OrderService()
        product_service = ProductService()

        # ------------------------------------------------------------------
        # Tracked inventory
        # ------------------------------------------------------------------

        items = self.repo.get_allocated_inventory_for_trip(
            db=db,
            trip_id=trip_id,
        )

        for item in items:

            if item.status not in (
                InventoryItemStatus.reserved,
                InventoryItemStatus.checked_out,
            ):
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

        # ------------------------------------------------------------------
        # Consumable inventory
        # ------------------------------------------------------------------

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

                if product.product_type != ProductType.consumable:
                    continue

                if order_item.location_id is None:
                    raise AppException(
                        status_code=400,
                        error_code=InventoryErrorCode.LOCATION_NOT_FOUND,
                        message=(
                            f"Consumable order item {order_item.id} "
                            "has no assigned warehouse."
                        ),
                    )

                quantity = Decimal(str(order_item.quantity))

                self.repo.restore_consumable_stock(
                    db=db,
                    product_id=order_item.product_id,
                    location_id=order_item.location_id,
                    quantity=quantity,
                )


    def validate_order_items_availability(
        self,
        db: Session,
        order_items: list,
    ):
        from app.products.service import ProductService

        product_service = ProductService()
        insufficient_items = []

        for order_item in order_items:

            product = product_service.get_or_raise(
                db=db,
                product_id=order_item.product_id,
            )

            if product.product_type.value == "tracked":

                available = self.repo.count_available_inventory_items(
                    db=db,
                    product_id=product.id,
                )

            else:

                available = self.repo.get_total_available_consumable_stock(
                    db=db,
                    product_id=product.id,
                )

            if order_item.quantity > available:
                insufficient_items.append(
                    {
                        "product_name": product.name,
                        "requested": str(order_item.quantity),
                        "available": str(available),
                        "unit": product.unit.value,
                    }
                )

        if insufficient_items:
            raise AppException(
                status_code=400,
                error_code=InventoryErrorCode.INSUFFICIENT_STOCK,
                message="One or more items have insufficient stock.",
                details={
                    "items": insufficient_items,
                },
            )

    def get_committed_quantity(
        self,
        db: Session,
        product_id: str,
    ) -> Decimal:
        """
        Returns the quantity of a product already committed by
        partially-paid and paid orders.
        """
        return self.repo.get_committed_quantity(
            db=db,
            product_id=product_id,
        )


    def get_product_availability(
        self,
        db: Session,
        product:Product,
    ) -> ProductAvailabilityResponse:
        committed = self.get_committed_quantity(
            db=db,
            product_id=product.id,
        )

        # if product.product_type.value == "tracked":
        if product.product_type == ProductType.tracked:
            physical = Decimal(
                self.repo.count_available_inventory_items(
                    db=db,
                    product_id=product.id,
                )
            )
        else:
            physical = self.repo.get_total_available_consumable_stock(
                db=db,
                product_id=product.id,
            )

        available = max(
            physical - committed,
            Decimal("0"),
        )

        return ProductAvailabilityResponse(
            product_id=product.id,
            physical_quantity=physical,
            committed_quantity=committed,
            available_quantity=available,
        )

    