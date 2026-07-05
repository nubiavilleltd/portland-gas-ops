# from __future__ import annotations
# from sqlalchemy.orm import Session
# from typing import Optional, List
# from decimal import Decimal
# from datetime import date, datetime, timezone

# from app.inventory.repository import InventoryRepository
# from app.inventory.model import InventoryItem, ConsumableStock, StockMovement
# from app.inventory.schema import (
#     CheckInTrackedInput, CheckInConsumableInput, ReturnItemInput,
#     InventoryKPIResponse,
# )
# from app.inventory.enums import (
#     InventoryItemStatus, InventoryItemCondition, MovementType,
#     DispositionStatus,
# )
# from app.inventory.error_codes import InventoryErrorCode
# from app.inventory import guards
# from app.core.exceptions import AppException, ErrorCode
# from app.audit.service import AuditService
# from app.audit.schema import AuditEntityType, AuditActorType


# class InventoryService:

#     def __init__(self):
#         self.repo = InventoryRepository()

#     def get_item_or_raise(self, db: Session, item_id: int) -> InventoryItem:
#         item = self.repo.get_inventory_item_by_id(db, item_id)
#         if not item:
#             raise AppException(404, InventoryErrorCode.INVENTORY_ITEM_NOT_FOUND,
#                                f"Inventory item {item_id} not found")
#         return item

#     def get_locations(self, db: Session):
#         return self.repo.list_locations(db)

#     def get_kpis(self, db: Session) -> dict:
#         return self.repo.get_kpis(db)

#     def list_items(
#         self, db: Session,
#         product_id: Optional[str] = None,
#         status:     Optional[str] = None,
#     ) -> List[InventoryItem]:
#         return self.repo.list_items(db, product_id=product_id, status=status)

#     def list_stock(self, db: Session) -> List[ConsumableStock]:
#         return self.repo.list_stock(db)

#     def list_movements(
#         self, db: Session,
#         product_id: Optional[str] = None,
#         item_id:    Optional[int] = None,
#     ) -> List[StockMovement]:
#         movements = self.repo.list_movements(db, product_id=product_id, item_id=item_id)
#         # Attach item_ids to each movement for the response
#         for movement in movements:
#             movement._item_ids = [smi.inventory_item_id for smi in movement.items]
#         return movements

#     def check_in_tracked(
#         self,
#         db:          Session,
#         data:        CheckInTrackedInput,
#         recorded_by: str,
#     ) -> List[InventoryItem]:
#         """
#         Check in N tracked items. Generates a tag number for each.
#         Creates one InventoryItem per unit + one StockMovement with all item_ids.
#         """
#         from app.products.model import Product
#         product = db.query(Product).filter(Product.id == data.product_id).first()
#         if not product:
#             raise AppException(404, ErrorCode.NOT_FOUND, "Product not found")
#         if product.product_type.value != "tracked":
#             raise AppException(400, InventoryErrorCode.PRODUCT_NOT_TRACKED,
#                                "Only tracked products can be checked in as inventory items")

#         location = self.repo.get_location_by_id(db, data.location_id)
#         if not location:
#             raise AppException(404, InventoryErrorCode.LOCATION_NOT_FOUND, "Location not found")

#         product_code = product.code or product.name[:3].upper()
#         today = date.today()
#         created_items = []

#         for _ in range(data.quantity):
#             tag_number = self.repo.generate_tag_number(db, product_code)
#             item = self.repo.create_item(
#                 db,
#                 product_id  = data.product_id,
#                 tag_number  = tag_number,
#                 status      = InventoryItemStatus.available,
#                 condition   = data.condition,
#                 location_id = data.location_id,
#                 received_at = today,
#                 notes       = data.notes,
#             )
#             created_items.append(item)

#         # Single stock movement for the whole batch
#         movement = self.repo.create_movement(
#             db,
#             product_id    = data.product_id,
#             movement_type = MovementType.check_in,
#             quantity      = Decimal(data.quantity),
#             location_id   = data.location_id,
#             recorded_by   = recorded_by,
#             notes         = data.notes,
#         )
#         self.repo.add_movement_items(db, movement.id, [i.id for i in created_items])

#         # Audit
#         AuditService.record(
#             db,
#             entity_type       = AuditEntityType.inventory_item,
#             entity_id         = str(created_items[0].id),
#             action            = "check_in",
#             description       = f"{data.quantity} {product.name} unit(s) checked in",
#             actor_type        = AuditActorType.employee,
#             actor_employee_id = recorded_by,
#         )

#         return created_items

#     def check_in_consumable(
#         self,
#         db:          Session,
#         data:        CheckInConsumableInput,
#         recorded_by: str,
#     ) -> ConsumableStock:
#         """Add quantity to consumable stock level."""
#         from app.products.model import Product
#         product = db.query(Product).filter(Product.id == data.product_id).first()
#         if not product:
#             raise AppException(404, ErrorCode.NOT_FOUND, "Product not found")
#         if product.product_type.value != "consumable":
#             raise AppException(400, InventoryErrorCode.PRODUCT_NOT_CONSUMABLE,
#                                "Only consumable products can be checked in this way")

#         location = self.repo.get_location_by_id(db, data.location_id)
#         if not location:
#             raise AppException(404, InventoryErrorCode.LOCATION_NOT_FOUND, "Location not found")

#         stock = self.repo.upsert_stock(db, data.product_id, data.location_id, data.quantity)

#         self.repo.create_movement(
#             db,
#             product_id    = data.product_id,
#             movement_type = MovementType.check_in,
#             quantity      = data.quantity,
#             location_id   = data.location_id,
#             recorded_by   = recorded_by,
#             notes         = data.notes,
#         )

#         return stock

#     def return_item(
#         self,
#         db:          Session,
#         item_id:     int,
#         data:        ReturnItemInput,
#         recorded_by: str,
#     ) -> InventoryItem:
#         item = self.get_item_or_raise(db, item_id)

#         if not guards.can_return(item):
#             raise AppException(400, InventoryErrorCode.CANNOT_RETURN_ITEM,
#                                "Only loaned items with a customer can be returned")

#         # Damaged → maintenance. Anything else → available
#         new_status = (
#             InventoryItemStatus.maintenance
#             if data.condition == InventoryItemCondition.damaged
#             else InventoryItemStatus.available
#         )

#         updated_item = self.repo.update_item(
#             db, item,
#             status      = new_status,
#             condition   = data.condition,
#             disposition = None,
#             order_id    = None,
#             customer_id = None,
#             notes       = data.notes or item.notes,
#         )

#         movement = self.repo.create_movement(
#             db,
#             product_id    = item.product_id,
#             movement_type = MovementType.return_,
#             quantity      = Decimal(1),
#             location_id   = item.location_id,
#             recorded_by   = recorded_by,
#             notes         = data.notes,
#         )
#         self.repo.add_movement_items(db, movement.id, [item.id])

#         AuditService.record(
#             db,
#             entity_type       = AuditEntityType.inventory_item,
#             entity_id         = str(item.id),
#             action            = "returned",
#             description       = f"Item {item.tag_number} returned — condition: {data.condition.value}",
#             actor_type        = AuditActorType.employee,
#             actor_employee_id = recorded_by,
#         )

#         return updated_item







from __future__ import annotations

from datetime import date
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

    # -------------------------------------------------------------------------
    # Retrieval
    # -------------------------------------------------------------------------

    def get_item_or_raise(self, db: Session, item_id: int) -> InventoryItem:
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

    def list_items(
        self,
        db: Session,
        product_id: Optional[str] = None,
        status: Optional[InventoryItemStatus] = None,
        location_id: Optional[int] = None,
        page: int = 1,
        page_size: int = 50,
    ):
        return self.repo.list_inventory_items(
            db,
            product_id=product_id,
            status=status,
            location_id=location_id,
            page=page,
            page_size=page_size,
        )

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

        product = ProductService().get_by_id_or_raise(db, data.product_id)

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

        movement = self.repo.create_stock_movement(
            db,
            product_id=data.product_id,
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

        product = ProductService().get_by_id_or_raise(db, data.product_id)

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

        self.repo.create_stock_movement(
            db,
            product_id=data.product_id,
            movement_type=MovementType.check_in,
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