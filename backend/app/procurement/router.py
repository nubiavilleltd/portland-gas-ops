<<<<<<< HEAD
"""
Procurement router — /api/procurement

Endpoints:
  GET    /                              list requests (staff see own; admin see all)
  POST   /                              create draft request
  GET    /purchase-orders/              list all purchase orders
  GET    /{id}                          request detail
  PATCH  /{id}                          update draft request
  POST   /{id}/submit                   draft → pending
  POST   /{id}/approve                  pending → approved  (admin)
  POST   /{id}/reject                   → rejected           (admin)
  POST   /{id}/return                   → returned           (admin)
  POST   /{id}/issue-po                 approved → po_issued, creates PO (admin)
  GET    /purchase-orders/{po_id}       PO detail
  PATCH  /purchase-orders/{po_id}/status  update PO delivery status (admin)
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.shared.dependencies import get_current_user
from app.shared.models.user import User
from app.procurement.schemas import (
    ProcurementCreate, ProcurementUpdate, ActionRequest,
    IssuePORequest, POStatusUpdate,
    ProcurementResponse, ProcurementListItem, PurchaseOrderResponse,
)
from app.procurement.repository import ProcurementRepository
from app.procurement.service import ProcurementService
from app.employees.service import get_employee_by_user_id

router = APIRouter()


def _svc(db: Session) -> ProcurementService:
    return ProcurementService(ProcurementRepository(db))


# ── Purchase orders (declared before /{id} to avoid path conflicts) ───────────

@router.get("/purchase-orders/", response_model=List[PurchaseOrderResponse])
def list_purchase_orders(
    request_id: Optional[str] = Query(None, description="Filter POs by procurement request"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _svc(db).list_pos(request_id=request_id)


@router.get("/purchase-orders/{po_id}", response_model=PurchaseOrderResponse)
def get_purchase_order(
    po_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _svc(db).get_po(po_id)


@router.patch("/purchase-orders/{po_id}/status", response_model=PurchaseOrderResponse)
def update_po_status(
    po_id: str,
    data: POStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    po = _svc(db).update_po_status(po_id, data, current_user)
    db.commit()
    db.refresh(po)
    return po


# ── Procurement requests ──────────────────────────────────────────────────────

@router.get("/", response_model=List[ProcurementListItem])
def list_requests(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = get_employee_by_user_id(current_user.id, db)
    return _svc(db).list_requests(current_user, employee, skip=skip, limit=limit, status_filter=status)


@router.post("/", response_model=ProcurementResponse, status_code=201)
def create_request(
    data: ProcurementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = get_employee_by_user_id(current_user.id, db)
    req = _svc(db).create_request(data, employee)
    db.commit()
    db.refresh(req)
    return req


@router.get("/{request_id}", response_model=ProcurementResponse)
def get_request(
    request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = get_employee_by_user_id(current_user.id, db)
    return _svc(db).get_request(request_id, current_user, employee)


@router.patch("/{request_id}", response_model=ProcurementResponse)
def update_request(
    request_id: str,
    data: ProcurementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = get_employee_by_user_id(current_user.id, db)
    req = _svc(db).update_request(request_id, data, employee)
    db.commit()
    db.refresh(req)
    return req


@router.post("/{request_id}/submit", response_model=ProcurementResponse)
def submit_request(
    request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = get_employee_by_user_id(current_user.id, db)
    req = _svc(db).submit_request(request_id, employee)
    db.commit()
    db.refresh(req)
    return req


@router.post("/{request_id}/approve", response_model=ProcurementResponse)
def approve_request(
    request_id: str,
    body: ActionRequest = ActionRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    req = _svc(db).approve_request(request_id, body, current_user)
    db.commit()
    db.refresh(req)
    return req


@router.post("/{request_id}/reject", response_model=ProcurementResponse)
def reject_request(
    request_id: str,
    body: ActionRequest = ActionRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    req = _svc(db).reject_request(request_id, body, current_user)
    db.commit()
    db.refresh(req)
    return req


@router.post("/{request_id}/return", response_model=ProcurementResponse)
def return_request(
    request_id: str,
    body: ActionRequest = ActionRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    req = _svc(db).return_request(request_id, body, current_user)
    db.commit()
    db.refresh(req)
    return req


@router.post("/{request_id}/issue-po", response_model=PurchaseOrderResponse, status_code=201)
def issue_po(
    request_id: str,
    body: IssuePORequest = IssuePORequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    issuer = get_employee_by_user_id(current_user.id, db)
    po = _svc(db).issue_po(request_id, body, current_user, issuer)
    db.commit()
    db.refresh(po)
    return po
=======
from fastapi import APIRouter
router = APIRouter()
>>>>>>> c7b4c06 (merging)
