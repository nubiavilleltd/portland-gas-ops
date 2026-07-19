
from __future__ import annotations

from decimal import Decimal

from sqlalchemy.orm import Session

from app.audit.schema import AuditActorType
from app.audit.schema import AuditEntityType
from app.audit.service import AuditService

from app.fleet.trips.service import TripService
from app.fleet.trips.schema import TripInventoryAssignment
from app.orders.service import OrderService
from app.inventory.repository import InventoryRepository
from app.inventory.enums import (
    InventoryItemStatus,
    MovementType,
)


class MarkReadyWorkflow:

    def __init__(self):
        self.trip_service = TripService()
        self.audit_service = AuditService()
        self.order_service = OrderService()
        self.inventory_repo = InventoryRepository()

    def _process_tracked_assignment(
        self,
        db: Session,
        trip,
        assignment,
        order_item,
        actor_id: str,
        assigned_item_ids: set[str],
    ):

        if len(assignment.item_ids) != int(order_item.quantity):
            raise ValueError(
                f"Product {assignment.product_id} requires "
                f"{int(order_item.quantity)} inventory item(s), "
                f"but {len(assignment.item_ids)} were provided."
            )

        for item_id in assignment.item_ids:

            if item_id in assigned_item_ids:
                raise ValueError(
                    f"Inventory item {item_id} was selected more than once."
                )

            assigned_item_ids.add(item_id)

            item = self.inventory_repo.get_inventory_item_by_id(
                db=db,
                item_id=item_id,
            )

            if item is None:
                raise ValueError(
                    f"Inventory item {item_id} not found."
                )

            if item.product_id != assignment.product_id:
                raise ValueError(
                    f"Inventory item {item_id} does not belong to product "
                    f"{assignment.product_id}."
                )

            if self.inventory_repo.is_inventory_item_assigned(
                db=db,
                inventory_item_id=item.id,
            ):
                raise ValueError(
                    f"Inventory item {item.id} is already assigned."
                )

            if item.status != InventoryItemStatus.available:
                raise ValueError(
                    f"Inventory item {item.id} is not available."
                )

            self.inventory_repo.reserve_inventory_item(
                db=db,
                item=item,
                order_id=assignment.order_id,
                trip_id=trip.id,
                disposition=assignment.disposition,
            )

            movement = self.inventory_repo.create_stock_movement(
                db=db,
                movement_no=self.inventory_repo.generate_movement_no(db),
                product_id=item.product_id,
                movement_type=MovementType.reservation,
                quantity=Decimal("1"),
                location_id=item.location_id,
                recorded_by=actor_id,
                reference_type="trip",
                reference_id=str(trip.id),
                notes=(
                    f"Reserved inventory item {item.tag_number} "
                    f"for trip {trip.trip_no}"
                ),
            )

            self.inventory_repo.add_stock_movement_items(
                db=db,
                movement_id=movement.id,
                inventory_item_ids=[item.id],
            )

            self.inventory_repo.assign_inventory_to_order_item(
                db=db,
                order_item_id=order_item.id,
                inventory_item_id=item.id,
            )

    def _process_consumable_assignment(
        self,
        db: Session,
        trip,
        assignment,
        order_item,
        actor_id: str,
    ):

        if assignment.location_id is None:
            raise ValueError(
                "A warehouse must be selected for consumable products."
            )

        self.inventory_repo.deduct_consumable_stock(
            db=db,
            product_id=assignment.product_id,
            location_id=assignment.location_id,
            quantity=Decimal(str(order_item.quantity)),
        )

        self.inventory_repo.create_stock_movement(
            db=db,
            movement_no=self.inventory_repo.generate_movement_no(db),
            product_id=assignment.product_id,
            movement_type=MovementType.reservation,
            quantity=Decimal(str(order_item.quantity)),
            location_id=assignment.location_id,
            recorded_by=actor_id,
            reference_type="trip",
            reference_id=str(trip.id),
            notes=(
                f"Reserved consumable stock "
                f"for trip {trip.trip_no}"
            ),
        )

    def execute(
        self,
        db: Session,
        trip_id: str,
        assignments: list[TripInventoryAssignment],
        actor_id: str,
    ):

        trip = self.trip_service.get_or_raise(
            db=db,
            trip_id=trip_id,
        )

        trip_order_ids = {
            trip_order.order_id
            for trip_order in trip.trip_orders
        }

        assigned_item_ids: set[str] = set()

        for assignment in assignments:

            if assignment.order_id not in trip_order_ids:
                raise ValueError(
                    f"Order {assignment.order_id} is not assigned to trip {trip_id}."
                )

            order_items = self.order_service.get_order_items(
                db=db,
                order_id=assignment.order_id,
            )

            order_item = next(
                (
                    item
                    for item in order_items
                    if item.product_id == assignment.product_id
                ),
                None,
            )

            if order_item is None:
                raise ValueError(
                    f"Product {assignment.product_id} "
                    f"does not exist on order {assignment.order_id}."
                )

            if assignment.item_ids:
                self._process_tracked_assignment(
                    db=db,
                    trip=trip,
                    assignment=assignment,
                    order_item=order_item,
                    actor_id=actor_id,
                    assigned_item_ids=assigned_item_ids,
                )
            else:
                self._process_consumable_assignment(
                    db=db,
                    trip=trip,
                    assignment=assignment,
                    order_item=order_item,
                    actor_id=actor_id,
                )

            self.order_service.update_order_item(
                db=db,
                order_item=order_item,
                disposition=assignment.disposition,
            )

            self.audit_service.record(
                db=db,
                entity_type=AuditEntityType.order,
                entity_id=str(assignment.order_id),
                action="inventory_assigned",
                description=(
                    f"Inventory assigned for trip {trip.trip_no}."
                ),
                actor_type=AuditActorType.employee,
                actor_employee_id=actor_id,
            )

        trip = self.trip_service.mark_ready(
            db=db,
            trip_id=trip_id,
        )

        self.audit_service.record(
            db=db,
            entity_type=AuditEntityType.trip,
            entity_id=str(trip.id),
            action="marked_ready",
            description="Trip marked ready for dispatch.",
            actor_type=AuditActorType.employee,
            actor_employee_id=actor_id,
        )

        return trip