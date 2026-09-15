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
from app.inventory.model import ConsumableStock, InventoryItem
from app.inventory.repository import InventoryRepository
from app.inventory.schema import (
    CheckInIndividualItemsInput,
    CheckInStockQuantityInput,
    ReturnItemInput,
    AvailableStockQuantityLocationResponse,
    ProductAvailabilityResponse,
)
from app.orders.model import OrderItem
from app.fleet.trips.model import Trip
from app.products.model import Product
from app.products.enums import InventoryTracking


class InventoryService:

    def __init__(self):
        self.repo = InventoryRepository()

    # -------------------------------------------------------------------------
    # Locations
    # -------------------------------------------------------------------------

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

    def get_locations(self, db: Session):
        return self.repo.list_locations(db)

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
            AvailableStockQuantityLocationResponse(
                location_id=row.location.id,
                location_name=row.location.name,
                available_quantity=row.quantity - row.reserved_quantity,
            )
            for row in rows
        ]

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

    def get_kpis(self, db: Session):
        return self.repo.get_kpis(db)

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
                message="Stock quantity record not found.",
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

        return self.repo.list_stock_movements(db, product_id=product_id)

    # -------------------------------------------------------------------------
    # Check In (Individual Items)
    # -------------------------------------------------------------------------

    def check_in_individual_items(
        self,
        db: Session,
        data: CheckInIndividualItemsInput,
        recorded_by: str,
        actor_employee_id: str,
        recorded_by_name: str,
    ):
        from app.products.service import ProductService

        product = ProductService().get_or_raise(db, data.product_id)

        if product.inventory_tracking != InventoryTracking.individual_items:
            raise AppException(
                400,
                InventoryErrorCode.PRODUCT_NOT_TRACKED,
                "Only individually-tracked products can be checked in this way",
            )

        if not product.tag_prefix:
            raise AppException(
                400,
                InventoryErrorCode.PRODUCT_NOT_TRACKED,
                f"Product '{product.name}' has no tag prefix configured.",
            )

        location = self.repo.get_location_by_id(db, data.location_id)
        if not location:
            raise AppException(
                404,
                InventoryErrorCode.LOCATION_NOT_FOUND,
                "Location not found",
            )

        created_items = []

        for _ in range(data.quantity):
            tag_number = self.repo.generate_tag_number(db, product.tag_prefix)

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
    # Check In (Stock Quantity)
    # -------------------------------------------------------------------------

    def check_in_stock_quantity(
        self,
        db: Session,
        data: CheckInStockQuantityInput,
        recorded_by: str,
        actor_employee_id: str,
        recorded_by_name: str,
    ) -> ConsumableStock:
        from app.products.service import ProductService

        product = ProductService().get_or_raise(db, data.product_id)

        if product.inventory_tracking != InventoryTracking.stock_quantity:
            raise AppException(
                400,
                InventoryErrorCode.PRODUCT_NOT_CONSUMABLE,
                "Only stock-quantity products can be checked in this way",
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
                f"{data.quantity} {product.unit.label} of "
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
            returned_at=datetime.now(timezone.utc),
            notes=data.notes or item.notes,
        )

        movement = self.repo.create_stock_movement(
            db,
            movement_no=self.repo.generate_movement_no(db),
            product_id=item.product_id,
            movement_type=MovementType.return_,
            quantity=Decimal("1"),
            location_id=item.location_id,
            recorded_by=recorded_by,
            recorded_by_name=recorded_by_name,
            notes=data.notes,
        )

        self.repo.add_stock_movement_items(db, movement.id, [item.id])

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
    # Trip Check Out (Dispatch)
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
        Dispatches every item already reserved for a trip.

        Reservation happens during Mark Ready.
        Dispatch converts reserved items into checked-out items, and
        dispatches reserved stock quantity.
        """
        from app.fleet.trips.service import TripService
        from app.orders.service import OrderService
        from app.products.service import ProductService

        trip_service = TripService()
        order_service = OrderService()
        product_service = ProductService()

        order_ids = trip_service.get_order_ids(db=db, trip_id=trip.id)

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

                if product.inventory_tracking == InventoryTracking.individual_items:
                    self._check_out_order_item(
                        db=db,
                        trip=trip,
                        order_item_id=order_item.id,
                        actor_user_id=actor_user_id,
                        actor_employee_id=actor_employee_id,
                        actor_name=actor_name,
                    )
                else:
                    self._check_out_stock_quantity(
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

        checked_out_at = datetime.now(timezone.utc)
        checked_out_ids = []

        for allocation in allocations:
            item = allocation.inventory_item
            self.repo.update_inventory_item(
                db=db,
                item=item,
                status=InventoryItemStatus.checked_out,
                checked_out_at=checked_out_at,
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

    def _check_out_stock_quantity(
        self,
        db: Session,
        trip: Trip,
        order_item: OrderItem,
        actor_user_id: str,
        actor_employee_id: str,
        actor_name: str,
    ):
        """
        Dispatches stock quantity reserved for a trip.

        Reservation (increment reserved_quantity) happened during Mark Ready.
        Dispatch decrements quantity and reserved_quantity, and increments
        sold_quantity.
        """

        if order_item.location_id is None:
            raise AppException(
                status_code=400,
                error_code=InventoryErrorCode.LOCATION_NOT_FOUND,
                message="Stock-quantity order item has no assigned warehouse.",
            )

        quantity = Decimal(str(order_item.quantity))

        try:
            self.repo.dispatch_consumable_stock(
                db=db,
                product_id=order_item.product_id,
                location_id=order_item.location_id,
                quantity=quantity,
            )
        except ValueError as exc:
            raise AppException(
                status_code=400,
                error_code=InventoryErrorCode.INSUFFICIENT_STOCK,
                message=str(exc),
            )

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
                f"Dispatched {quantity:.2f} of {order_item.product_name} "
                f"for trip {trip.trip_no}"
            ),
        )

        AuditService.record(
            db=db,
            entity_type=AuditEntityType.order,
            entity_id=str(order_item.order_id),
            action="stock_quantity_dispatched",
            description=(
                f"Dispatched {quantity:.2f} of {order_item.product_name} "
                f"for trip {trip.trip_no}"
            ),
            actor_type=AuditActorType.employee,
            actor_employee_id=actor_employee_id,
            actor_name=actor_name,
        )

    # -------------------------------------------------------------------------
    # Trip Release (Cancel)
    # -------------------------------------------------------------------------

    def release_trip_inventory(
        self,
        db: Session,
        trip_id: str,
    ) -> None:
        """
        Releases inventory associated with a trip.

        Individual items:
            reserved / checked_out → available

        Stock quantity:
            if the trip has not been dispatched, release the reservation
            if the trip has been dispatched, restore the dispatched stock

        Used when a trip is cancelled.
        """
        from app.fleet.trips.service import TripService
        from app.orders.service import OrderService
        from app.products.service import ProductService
        from app.fleet.trips.enums import TripStatus

        trip_service = TripService()
        order_service = OrderService()
        product_service = ProductService()

        trip = trip_service.get_or_raise(db=db, trip_id=trip_id)
        already_dispatched = trip.status in (
            TripStatus.dispatched,
            TripStatus.in_transit,
            TripStatus.completed,
        )

        # ------------------------------------------------------------------
        # Individual items
        # ------------------------------------------------------------------

        items = self.repo.get_allocated_inventory_for_trip(db=db, trip_id=trip_id)

        for item in items:

            if item.status not in (
                InventoryItemStatus.reserved,
                InventoryItemStatus.checked_out,
            ):
                continue

            self.repo.release_order_item_inventory_for_item(
                db=db,
                inventory_item_id=item.id,
            )

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
        # Stock quantity
        # ------------------------------------------------------------------

        order_ids = trip_service.get_order_ids(db=db, trip_id=trip_id)

        for order_id in order_ids:

            order_items = order_service.get_order_items(db=db, order_id=order_id)

            for order_item in order_items:

                product = product_service.get_or_raise(
                    db=db,
                    product_id=order_item.product_id,
                )

                if product.inventory_tracking != InventoryTracking.stock_quantity:
                    continue

                if order_item.location_id is None:
                    raise AppException(
                        status_code=400,
                        error_code=InventoryErrorCode.LOCATION_NOT_FOUND,
                        message=(
                            f"Stock-quantity order item {order_item.id} "
                            "has no assigned warehouse."
                        ),
                    )

                quantity = Decimal(str(order_item.quantity))

                try:
                    if already_dispatched:
                        self.repo.restore_dispatched_consumable_stock(
                            db=db,
                            product_id=order_item.product_id,
                            location_id=order_item.location_id,
                            quantity=quantity,
                        )
                    else:
                        self.repo.release_consumable_reservation(
                            db=db,
                            product_id=order_item.product_id,
                            location_id=order_item.location_id,
                            quantity=quantity,
                        )
                except ValueError as exc:
                    raise AppException(
                        status_code=400,
                        error_code=InventoryErrorCode.INSUFFICIENT_STOCK,
                        message=str(exc),
                    )

    # -------------------------------------------------------------------------
    # Availability
    # -------------------------------------------------------------------------


    def _compute_availability_from_aggregates(
        self,
        product: Product,
        aggregates: dict,
    ) -> dict:
        """
        Compute total / available / reserved / sold for one product
        given pre-fetched aggregate data.
        """

        if product.inventory_tracking == InventoryTracking.individual_items:

            counts = aggregates["individual_item_counts"].get(product.id, {})

            available = Decimal(counts.get(InventoryItemStatus.available, 0))
            reserved = Decimal(counts.get(InventoryItemStatus.reserved, 0))
            sold = Decimal(counts.get(InventoryItemStatus.sold, 0))

            total = sum(
                Decimal(c)
                for s, c in counts.items()
                if s != InventoryItemStatus.retired
            )

        else:

            totals = aggregates["stock_quantity_totals"].get(
                product.id,
                {"quantity": Decimal("0"), "reserved": Decimal("0"), "sold": Decimal("0")},
            )

            quantity = totals["quantity"]
            reserved = totals["reserved"]
            sold = totals["sold"]
            available = quantity - reserved
            total = quantity + sold

        return {
            "total": total,
            "available": available,
            "reserved": reserved,
            "sold": sold,
        }

    def get_inventory_overview(
        self,
        db: Session,
        *,
        search: Optional[str] = None,
        inventory_tracking: Optional[InventoryTracking] = None,
        category_id: Optional[str] = None,
        stock_status: Optional[str] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[list[dict], int]:
        """
        Returns one row per product with aggregated availability.

        NOTE: `stock_status` filtering is applied after fetching the page.
        `total` reflects the unfiltered count. This is acceptable while
        page sizes are small (<=200) and stock status is a secondary filter.
        A future refactor can push the filter into SQL.
        """
        from app.products.repository import ProductRepository

        product_repo = ProductRepository()

        products, total = product_repo.list(
            db,
            search=search,
            inventory_tracking=(
                inventory_tracking.value if inventory_tracking else None
            ),
            category_id=category_id,
            status="active",
            page=page,
            page_size=page_size,
        )

        if not products:
            return [], total

        product_ids = [p.id for p in products]

        aggregates = self.repo.get_overview_aggregates(
            db=db,
            product_ids=product_ids,
        )

        items: list[dict] = []

        for product in products:

            availability = self._compute_availability_from_aggregates(
                product=product,
                aggregates=aggregates,
            )

            category_name = (
                product.category.name if product.category else None
            )

            is_low = (
                product.minimum_stock is not None
                and availability["available"] <= product.minimum_stock
            )

            # stock_status filter (post-fetch)
            if stock_status:
                if stock_status == "out" and availability["available"] > 0:
                    continue
                if stock_status == "low" and not is_low:
                    continue
                if stock_status == "ok" and is_low:
                    continue

            items.append({
                "product_id": product.id,
                "product_no": product.product_no,
                "product_name": product.name,
                "sku": product.code,
                "tag_prefix": product.tag_prefix,
                "category_id": product.category_id,
                "category_name": category_name,
                "inventory_tracking": product.inventory_tracking,
                "unit_label": product.unit.label,
                "unit_code": product.unit.code,
                "total": availability["total"],
                "available": availability["available"],
                "reserved": availability["reserved"],
                "sold": availability["sold"],
                "minimum_stock": product.minimum_stock,
                "is_low_stock": is_low,
            })

        return items, total
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

            if product.inventory_tracking == InventoryTracking.individual_items:
                counts = self.repo.get_individual_item_counts(
                    db=db,
                    product_id=product.id,
                )
                available = Decimal(counts.get(InventoryItemStatus.available, 0))
            else:
                totals = self.repo.get_stock_quantity_totals(
                    db=db,
                    product_id=product.id,
                )
                available = totals["quantity"] - totals["reserved"]

            if Decimal(str(order_item.quantity)) > available:
                insufficient_items.append(
                    {
                        "product_name": product.name,
                        "requested": str(order_item.quantity),
                        "available": str(available),
                        "unit": product.unit.label,
                    }
                )

        if insufficient_items:
            raise AppException(
                status_code=400,
                error_code=InventoryErrorCode.INSUFFICIENT_STOCK,
                message="One or more items have insufficient stock.",
                details={"items": insufficient_items},
            )

    def get_product_availability(
        self,
        db: Session,
        product: Product,
    ) -> ProductAvailabilityResponse:
        if product.inventory_tracking == InventoryTracking.individual_items:
            counts = self.repo.get_individual_item_counts(
                db=db,
                product_id=product.id,
            )
            available = Decimal(counts.get(InventoryItemStatus.available, 0))
            reserved = Decimal(counts.get(InventoryItemStatus.reserved, 0))
            sold = Decimal(counts.get(InventoryItemStatus.sold, 0))

            # total = everything owned, minus retired. Includes items
            # in any non-terminal state, plus sold (which are still "ours
            # historically" and part of the boss's 20/5/15 mental model).
            owned = sum(
                Decimal(c)
                for s, c in counts.items()
                if s != InventoryItemStatus.retired
            )
            total = owned

        else:
            totals = self.repo.get_stock_quantity_totals(
                db=db,
                product_id=product.id,
            )
            quantity = totals["quantity"]
            reserved = totals["reserved"]
            sold = totals["sold"]
            available = quantity - reserved
            total = quantity + sold

        return ProductAvailabilityResponse(
            product_id=product.id,
            total=total,
            available=available,
            reserved=reserved,
            sold=sold,
        )