from __future__ import annotations
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.core.dependencies import get_db, get_current_user
from app.shared.dependencies import require_roles
from app.shared.models.user import User
from app.inventory.service import InventoryService
from app.inventory.schema import (
    CheckInTrackedInput, CheckInConsumableInput, ReturnItemInput,
    InventoryItemResponse, ConsumableStockResponse, StockMovementResponse,
    LocationResponse, InventoryKPIResponse,
)
from app.audit.schema import AuditLogResponse, AuditEntityType
from app.audit.service import AuditService

router  = APIRouter()
service = InventoryService()


def _movement_to_response(m) -> StockMovementResponse:
    data = StockMovementResponse.model_validate(m)
    data.item_ids = getattr(m, "_item_ids", [smi.inventory_item_id for smi in m.items])
    data.recorded_by = m.recorded_by
    return data


@router.get("/locations", response_model=List[LocationResponse])
def list_locations(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    return service.get_locations(db)


@router.get("/kpis", response_model=InventoryKPIResponse)
def get_kpis(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    return service.get_kpis(db)


@router.get("/items", response_model=List[InventoryItemResponse])
def list_items(
    product_id: Optional[str] = Query(None),
    status:     Optional[str] = Query(None),
    db:         Session       = Depends(get_db),
    current_user: User        = Depends(get_current_user),
):
    return service.list_items(db, product_id=product_id, status=status)


@router.get("/items/{item_id}", response_model=InventoryItemResponse)
def get_item(
    item_id:      int,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    return service.get_item_or_raise(db, item_id)


@router.post("/items/{item_id}/return", response_model=InventoryItemResponse)
def return_item(
    item_id:      int,
    data:         ReturnItemInput,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(require_roles("super_admin", "admin")),
):
    item = service.return_item(db, item_id, data, recorded_by=current_user.id)
    db.commit()
    db.refresh(item)
    return item


@router.get("/stock", response_model=List[ConsumableStockResponse])
def list_stock(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    return service.list_stock(db)


@router.get("/movements", response_model=List[StockMovementResponse])
def list_movements(
    product_id: Optional[str] = Query(None),
    item_id:    Optional[int] = Query(None),
    db:         Session       = Depends(get_db),
    current_user: User        = Depends(get_current_user),
):
    movements = service.list_movements(db, product_id=product_id, item_id=item_id)
    return [_movement_to_response(m) for m in movements]


@router.post("/check-in/tracked", response_model=List[InventoryItemResponse])
def check_in_tracked(
    data:         CheckInTrackedInput,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(require_roles("super_admin", "admin")),
):
    items = service.check_in_tracked(db, data, recorded_by=current_user.id)
    db.commit()
    for item in items:
        db.refresh(item)
    return items


@router.post("/check-in/consumable", response_model=ConsumableStockResponse)
def check_in_consumable(
    data:         CheckInConsumableInput,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(require_roles("super_admin", "admin")),
):
    stock = service.check_in_consumable(db, data, recorded_by=current_user.id)
    db.commit()
    db.refresh(stock)
    return stock


@router.get("/items/{item_id}/audit", response_model=List[AuditLogResponse])
def get_item_audit(
    item_id:      int,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    return AuditService.get_by_entity(db, AuditEntityType.inventory_item, str(item_id))