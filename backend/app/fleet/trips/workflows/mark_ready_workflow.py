from __future__ import annotations

from sqlalchemy.orm import Session

from app.audit.schema import AuditActorType
from app.audit.schema import AuditEntityType
from app.audit.service import AuditService

from app.fleet.trips.service import TripService
from app.fleet.trips.schema import TripInventoryAssignment
from app.orders.service import OrderService
from app.inventory.repository import InventoryRepository
from app.inventory.enums import InventoryItemStatus


class MarkReadyWorkflow:

    def __init__(self):
        self.trip_service = TripService()
        self.audit_service = AuditService()
        self.order_service = OrderService()
        self.inventory_repo = InventoryRepository()

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
                # We'll replace this with an AppException in the next step.
                raise ValueError(
                    f"Product {assignment.product_id} "
                    f"does not exist on order {assignment.order_id}."
                )
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
                        f"Inventory item {item.id} is already assigned to an order."
                    )
                if item.status != InventoryItemStatus.available:
                    raise ValueError(
                        f"Inventory item {item.id} is not available."
                    )
                self.inventory_repo.reserve_inventory_item(
                    db=db,
                    item=item,
                )

                self.inventory_repo.assign_inventory_to_order_item(
                    db=db,
                    order_item_id=order_item.id,
                    inventory_item_id=item.id,
                )
            self.order_service.update_order_item(
                db=db,
                order_item=order_item,
                disposition=assignment.disposition,
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