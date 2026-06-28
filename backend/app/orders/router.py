from __future__ import annotations
from fastapi import APIRouter, Depends, Query, status as http_status
from sqlalchemy.orm import Session
from typing import Optional

from app.core.dependencies import get_db, get_current_user
from app.shared.dependencies import require_roles
from app.shared.models.user import User
from app.orders.service import OrderService
from app.orders.schema import (
    OrderCreate, OrderUpdate, OrderFilters, CancelOrderRequest,
    OrderResponse, OrderListResponse,
    UpdateFulfillmentRequest, SetTripRequest, SetInvoiceRequest,
)
from app.orders.enums import OrderStatus, FulfillmentStatus
from app.payments.enums import PaymentStatus

router  = APIRouter()
service = OrderService()


def _to_response(order) -> OrderResponse:
    """Build OrderResponse including denormalised customer_name."""
    data = OrderResponse.model_validate(order)
    data.customer_name = order.customer.name if order.customer else ""
    return data


@router.get("/", response_model=OrderListResponse)
def list_orders(
    search:             Optional[str]              = Query(None),
    order_status:       Optional[OrderStatus]      = Query(None),
    fulfillment_status: Optional[FulfillmentStatus] = Query(None),
    payment_status:     Optional[PaymentStatus]    = Query(None),
    customer_id:        Optional[str]              = Query(None),
    page:               int                        = Query(1, ge=1),
    page_size:          int                        = Query(50, ge=1, le=200),
    db:                 Session                    = Depends(get_db),
    current_user:       User                       = Depends(get_current_user),
):
    filters = OrderFilters(
        search=search, order_status=order_status,
        fulfillment_status=fulfillment_status, payment_status=payment_status,
        customer_id=customer_id, page=page, page_size=page_size,
    )
    items, total = service.list(db, filters)
    return OrderListResponse(
        items     = [_to_response(o) for o in items],
        total     = total,
        page      = page,
        page_size = page_size,
        has_next  = (page * page_size) < total,
    )


@router.post("/", response_model=OrderResponse, status_code=http_status.HTTP_201_CREATED)
def create_draft(
    data:         OrderCreate,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    order = service.create_draft(db, data, created_by=current_user.id)
    db.commit()
    db.refresh(order)
    return _to_response(order)


@router.get("/{order_no}", response_model=OrderResponse)
def get_order(
    order_no:     str,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    order = service.get_by_no_or_raise(db, order_no)
    return _to_response(order)


@router.put("/{order_no}", response_model=OrderResponse)
def update_draft(
    order_no:     str,
    data:         OrderUpdate,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    order = service.update_draft(db, order_no, data)
    db.commit()
    db.refresh(order)
    return _to_response(order)


@router.post("/{order_no}/submit", response_model=OrderResponse)
def submit_order(
    order_no:     str,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    order = service.submit(db, order_no)
    db.commit()
    db.refresh(order)
    return _to_response(order)


@router.post("/{order_no}/confirm", response_model=OrderResponse)
def confirm_order(
    order_no:     str,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(require_roles("super_admin", "admin")),
):
    """Manual confirmation — submitted → confirmed."""
    order = service.confirm(db, order_no, confirmed_by=current_user.id)
    db.commit()
    db.refresh(order)
    return _to_response(order)


@router.post("/{order_no}/cancel", response_model=OrderResponse)
def cancel_order(
    order_no:     str,
    body:         CancelOrderRequest,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(require_roles("super_admin", "admin")),
):
    """
    Cancel order. Backend also voids any linked invoice atomically.
    Import InvoiceService here to avoid circular imports.
    """
    from app.invoices.service import InvoiceService
    invoice_service = InvoiceService()

    order = service.cancel(db, order_no, reason=body.reason)

    # Cascade: void linked invoice if exists
    if order.invoice_id:
        invoice = invoice_service.get_by_id_or_none(db, order.invoice_id)
        if invoice:
            invoice_service.void(db, invoice)

    db.commit()
    db.refresh(order)
    return _to_response(order)


@router.post("/{order_no}/confirm-delivery", response_model=OrderResponse)
def confirm_delivery(
    order_no:     str,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(require_roles("super_admin", "admin")),
):
    """
    Confirm delivery. Sets fulfillment=delivered.
    If payment_status==paid: auto-completes the order.
    Mirrors confirmDeliveryWorkflow exactly.
    """
    order = service.confirm_delivery(db, order_no)
    db.commit()
    db.refresh(order)
    return _to_response(order)


@router.patch("/{order_no}/fulfillment", response_model=OrderResponse)
def update_fulfillment(
    order_no:     str,
    body:         UpdateFulfillmentRequest,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(require_roles("super_admin", "admin")),
):
    """Called by trips module when trip status changes."""
    order = service.update_fulfillment_status(db, order_no, body.fulfillment_status)
    db.commit()
    db.refresh(order)
    return _to_response(order)


@router.patch("/{order_no}/trip", response_model=OrderResponse)
def set_trip(
    order_no:     str,
    body:         SetTripRequest,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(require_roles("super_admin", "admin")),
):
    order = service.set_trip(db, order_no, body.trip_id)
    db.commit()
    db.refresh(order)
    return _to_response(order)


@router.patch("/{order_no}/invoice", response_model=OrderResponse)
def set_invoice(
    order_no:     str,
    body:         SetInvoiceRequest,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(require_roles("super_admin", "admin")),
):
    order = service.get_by_no_or_raise(db, order_no)
    updated = service.set_invoice(db, order, body.invoice_id)
    db.commit()
    db.refresh(updated)
    return _to_response(updated)