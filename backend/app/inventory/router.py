
from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.shared.dependencies import require_roles
from app.shared.models.user import User

from app.inventory.service import InventoryService
from app.inventory.schema import (
    CheckInTrackedInput,
    CheckInConsumableInput,
    ReturnItemInput,
    InventoryItemResponse,
    ConsumableStockResponse,
    StockMovementResponse,
    CreateLocationInput,
    LocationResponse,
    InventoryKPIResponse,
)

from app.audit.schema import AuditLogResponse, AuditEntityType
from app.audit.service import AuditService

router = APIRouter()
service = InventoryService()


def _movement_to_response(movement) -> StockMovementResponse:
    response = StockMovementResponse.model_validate(movement)
    response.item_ids = getattr(
        movement,
        "_item_ids",
        [item.inventory_item_id for item in movement.items],
    )
    return response


# -------------------------------------------------------------------------
# Warehouse Locations
# -------------------------------------------------------------------------

@router.get("/locations", response_model=List[LocationResponse])
def list_locations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_locations(db)

@router.post(
    "/locations",
    response_model=LocationResponse,
)
def create_location(
    data: CreateLocationInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("super_admin", "admin")),
):
    location = service.create_location(
        db=db,
        name=data.name,
        address=data.address,
        is_default=data.is_default,
    )

    db.commit()
    db.refresh(location)

    return location

# -------------------------------------------------------------------------
# Dashboard
# -------------------------------------------------------------------------

@router.get("/kpis", response_model=InventoryKPIResponse)
def get_kpis(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_kpis(db)


# -------------------------------------------------------------------------
# Inventory Items
# -------------------------------------------------------------------------

@router.get("/items", response_model=List[InventoryItemResponse])
def list_inventory_items(
    product_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.list_items(
        db,
        product_id=product_id,
        status=status,
    )


@router.get("/items/{item_id}", response_model=InventoryItemResponse)
def get_inventory_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_item_or_raise(db, item_id)


@router.post(
    "/items/{item_id}/return",
    response_model=InventoryItemResponse,
)
def return_inventory_item(
    item_id: int,
    data: ReturnItemInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("super_admin", "admin")),
):
    item = service.return_item(
        db,
        item_id,
        data,
        recorded_by=current_user.employee.id,
        recorded_by_name=current_user.full_name,
    )

    db.commit()
    db.refresh(item)

    return item


# -------------------------------------------------------------------------
# Consumable Stock
# -------------------------------------------------------------------------

@router.get(
    "/stock",
    response_model=List[ConsumableStockResponse],
)
def list_consumable_stock(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.list_stock(db)


# -------------------------------------------------------------------------
# Stock Movements
# -------------------------------------------------------------------------

@router.get(
    "/movements",
    response_model=List[StockMovementResponse],
)
def list_stock_movements(
    product_id: Optional[str] = Query(None),
    item_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    movements = service.list_movements(
        db,
        product_id=product_id,
        item_id=item_id,
    )

    return [_movement_to_response(m) for m in movements]


# -------------------------------------------------------------------------
# Check In
# -------------------------------------------------------------------------

@router.post(
    "/check-in/tracked",
    response_model=List[InventoryItemResponse],
)
def check_in_tracked_items(
    data: CheckInTrackedInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("super_admin", "admin")),
):
    items = service.check_in_tracked(
        db,
        data,
        recorded_by=current_user.employee.id,
        recorded_by_name=current_user.full_name,
    )

    db.commit()

    for item in items:
        db.refresh(item)

    return items


@router.post(
    "/check-in/consumable",
    response_model=ConsumableStockResponse,
)
def check_in_consumable_stock(
    data: CheckInConsumableInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("super_admin", "admin")),
):
    stock = service.check_in_consumable(
        db,
        data,
        recorded_by=current_user.employee.id,
        recorded_by_name=current_user.full_name,
    )

    db.commit()
    db.refresh(stock)

    return stock


# -------------------------------------------------------------------------
# Audit
# -------------------------------------------------------------------------

@router.get(
    "/items/{item_id}/audit",
    response_model=List[AuditLogResponse],
)
def get_inventory_item_audit(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return AuditService.get_by_entity(
        db,
        AuditEntityType.inventory_item,
        str(item_id),
    )