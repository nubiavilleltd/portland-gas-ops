from __future__ import annotations
from app.orders.permissions import OrderPermissions
from fastapi import APIRouter, Depends, Query, status as http_status
from sqlalchemy.orm import Session
from typing import Optional

from app.core.dependencies import get_db, get_current_user
from app.shared.models.user import User
from app.orders.service import OrderService
from app.orders.schema import (
    OrderCreate, OrderDraftCreate, OrderUpdate, OrderFilters, CancelOrderRequest,
    OrderResponse, OrderListResponse,
    UpdateFulfillmentRequest, SetTripRequest, SetInvoiceRequest, ConfirmDeliveryRequest,
)
from app.orders.enums import OrderStatus, FulfillmentStatus
from app.payments.enums import PaymentStatus
from app.audit.service import AuditService
from app.audit.schema import AuditEntityType, AuditActorType, AuditLogResponse
from app.orders.error_codes import OrderErrorCode

from app.core.exceptions import AppException, ErrorCode


router  = APIRouter()
service = OrderService()
permissions = OrderPermissions()


def _to_response(order) -> OrderResponse:
    response = OrderResponse.model_validate(order)

    response.created_by_name = (
        order.created_by_user.full_name
        if order.created_by_user
        else None
    )

    return response


@router.get("", response_model=OrderListResponse)
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
    items, total = service.list(db, filters, current_user)
    return OrderListResponse(
        items     = [_to_response(o) for o in items],
        total     = total,
        page      = page,
        page_size = page_size,
        has_next  = (page * page_size) < total,
    )


@router.post("", response_model=OrderResponse, status_code=http_status.HTTP_201_CREATED)
def create_draft(
    data:         OrderDraftCreate,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    permissions.ensure_can_create_order(
        current_user,
    )
    order = service.create_draft(db, data, created_by=current_user.id)

    AuditService.record(
    db, AuditEntityType.order, order.id,
    "created", "Order created as draft",
    AuditActorType.employee, current_user.employee.id,
    current_user.full_name)

    db.commit()
    db.refresh(order)
    return _to_response(order)

@router.post("/submit", response_model=OrderResponse, status_code=http_status.HTTP_201_CREATED)
def create_and_submit_order(
    data:         OrderCreate,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    permissions.ensure_can_create_order(
        current_user,
    )
    order = service.create_and_submit(db, data, created_by=current_user.id)

    AuditService.record(
        db, AuditEntityType.order, order.id,
        "created", "Order created",
        AuditActorType.employee, current_user.employee.id, current_user.full_name)

    AuditService.record(
        db, AuditEntityType.order, order.id,
        "submitted", "Order submitted for processing",
        AuditActorType.employee, current_user.employee.id, current_user.full_name)

    db.commit()
    db.refresh(order)
    return _to_response(order)


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id:     str,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):

    order = service.get_or_raise(db, order_id)
    permissions.ensure_can_view_order(
        current_user,
        order,
    )
    return _to_response(order)


@router.get("/by-no/{order_no}", response_model=OrderResponse)
def get_order_by_no(
    order_no: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = service.get_by_no_or_raise(db, order_no)
    permissions.ensure_can_view_order(
        current_user,
        order,
    )
    return _to_response(order)


@router.put("/{order_id}", response_model=OrderResponse)
def update_draft(
    order_id:     str,
    data:         OrderUpdate,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    existing_order = service.get_or_raise(db, order_id)
    permissions.ensure_can_edit_order(
        current_user,
        existing_order,
    )

    updated_order = service.update_draft(db, existing_order, data)
   
    db.commit()
    db.refresh(updated_order)
    return _to_response(updated_order)


@router.post("/{order_id}/submit", response_model=OrderResponse)
def submit_order(
    order_id:     str,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    existing_order = service.get_or_raise(db, order_id)
    permissions.ensure_can_submit_order(
        current_user,
        existing_order
    )
    order = service.submit(db, existing_order)
    AuditService.record(
    db, AuditEntityType.order, order.id,
    "submitted", "Order submitted for processing",
    AuditActorType.employee, current_user.employee.id, current_user.full_name)

    db.commit()
    db.refresh(order)
    return _to_response(order)

@router.post("/{order_id}/cancel", response_model=OrderResponse)
def cancel_order(
    order_id:     str,
    body:         CancelOrderRequest,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """
    Cancel order. Backend also voids any linked invoice atomically.
    Import InvoiceService here to avoid circular imports.
    """
    from app.invoices.service import InvoiceService
    invoice_service = InvoiceService()

    existing_order = service.get_or_raise(db, order_id)


    permissions.ensure_can_cancel_order(
        current_user,
        existing_order
    )

    order = service.cancel(db, existing_order, reason=body.reason)

    # Cascade: void linked invoice if exists
    if order.invoice_id:
        invoice = invoice_service.get_or_none(db, order.invoice_id)
        if invoice and invoice.status in (
            PaymentStatus.paid,
            PaymentStatus.partially_paid,
        ):
            raise AppException(
                400,
                OrderErrorCode.ORDER_CANNOT_BE_CANCELLED,
                "Orders with paid or partially paid invoices cannot be cancelled."
            )
    
    AuditService.record(
    db, AuditEntityType.order, order.id,
    "cancelled",
    f"Order cancelled: {body.reason}" if body.reason else "Order cancelled",
    AuditActorType.employee, current_user.employee.id, current_user.full_name)

    db.commit()
    db.refresh(order)
    return _to_response(order)


@router.post("/{order_id}/confirm-delivery", response_model=OrderResponse)
def confirm_delivery(
    order_id:     str,
    payload: ConfirmDeliveryRequest,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """
    Confirm delivery. Sets fulfillment=delivered.
    If payment_status==paid: auto-completes the order.
    Mirrors confirmDeliveryWorkflow exactly.
    """
    existing_order = service.get_or_raise(db, order_id)

    permissions.ensure_can_confirm_delivery(
        current_user,
        existing_order
    )
    order = service.confirm_delivery(db, existing_order, payload)

    AuditService.record(
    db, AuditEntityType.order, order.id,
    "delivered", "Delivery confirmed",
    AuditActorType.employee, current_user.employee.id, current_user.full_name)

    if order.order_status.value == "completed":
        AuditService.record(
            db, AuditEntityType.order, order.id,
            "completed", "Order auto-completed after delivery confirmed",
            AuditActorType.system,
        )
    
    db.commit()
    db.refresh(order)
    return _to_response(order)


@router.patch("/{order_id}/fulfillment", response_model=OrderResponse)
def update_fulfillment(
    order_id:     str,
    body:         UpdateFulfillmentRequest,
    db:           Session = Depends(get_db),
   current_user: User = Depends(get_current_user)
):
    """Called by trips module when trip status changes."""
    existing_order = service.get_or_raise(db, order_id)
    permissions.ensure_can_update_fulfillment(
        current_user,
        existing_order
    )
    order = service.update_fulfillment_status(db, existing_order, body.fulfillment_status)
    db.commit()
    db.refresh(order)
    return _to_response(order)


@router.patch("/{order_id}/trip", response_model=OrderResponse)
def set_trip(
    order_id:     str,
    body:         SetTripRequest,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    
    permissions.ensure_can_assign_trip(
        current_user,
    )
    order = service.set_trip(db, order_id, body.trip_id)
    db.commit()
    db.refresh(order)
    return _to_response(order)


@router.patch("/{order_id}/invoice", response_model=OrderResponse)
def set_invoice(
    order_id:     str,
    body:         SetInvoiceRequest,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    order = service.get_or_raise(db, order_id)
    permissions.ensure_can_set_invoice(
        current_user,
    )
    updated = service.set_invoice(db, order, body.invoice_id)
    db.commit()
    db.refresh(updated)
    return _to_response(updated)

@router.get("/{order_id}/audit", response_model=list[AuditLogResponse])
def get_order_audit(
    order_id:     str,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    order = service.get_or_raise(db, order_id)
    permissions.ensure_can_view_order(
        current_user,
        order,
    )
    return AuditService.get_by_entity(db, AuditEntityType.order, order.id)
