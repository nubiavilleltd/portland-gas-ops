from __future__ import annotations
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from typing import Optional

from app.core.dependencies import get_db, get_current_user
from app.shared.dependencies import require_roles
from app.shared.models.user import User
from app.payments.service import PaymentService
from app.payments.schema import PaymentCreate, PaymentResponse, PaymentListResponse
from app.audit.service import AuditService
from app.audit.schema import AuditEntityType, AuditActorType


router  = APIRouter()
service = PaymentService()


def _to_response(payment) -> PaymentResponse:
    data = PaymentResponse.model_validate(payment)
    data.invoice_no = payment.invoice.invoice_no if payment.invoice else None
    return data


@router.get("/", response_model=PaymentListResponse)
def list_payments(
    invoice_id: Optional[str] = Query(None),
    page:       int           = Query(1, ge=1),
    page_size:  int           = Query(50, ge=1, le=200),
    db:         Session       = Depends(get_db),
    current_user: User        = Depends(get_current_user),
):
    items, total = service.list(db, invoice_id, page, page_size)
    return PaymentListResponse(
        items     = [_to_response(p) for p in items],
        total     = total,
        page      = page,
        page_size = page_size,
        has_next  = (page * page_size) < total,
    )


@router.post("/", response_model=PaymentResponse, status_code=201)
def record_payment(
    data:         PaymentCreate,
    request:      Request,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(require_roles("super_admin", "admin")),
):
    # Read idempotency key from header
    idempotency_key = request.headers.get("idempotency-key")

    payment = service.record(db, data, recorded_by=current_user.id,
                             idempotency_key=idempotency_key)
    

    # Get the invoice to find the order
    from app.invoices.repository import InvoiceRepository
    invoice = InvoiceRepository().get_by_id(db, payment.invoice_id)
    if invoice:
        AuditService.record(
            db, AuditEntityType.order, invoice.order_id,
            "payment_recorded",
            f"Payment of ₦{payment.amount:,.2f} recorded via {payment.method.value}",
            AuditActorType.employee, current_user.id,
        )
        # If order was auto-confirmed by this payment, record that too
        from app.orders.repository import OrderRepository
        order = OrderRepository().get_by_id(db, invoice.order_id)
        if order and order.order_status.value == "confirmed":
            AuditService.record(
                db, AuditEntityType.order, invoice.order_id,
                "confirmed",
                "Order automatically confirmed after full payment received",
                AuditActorType.system,
            )

    AuditService.record(
        db, AuditEntityType.invoice, invoice.id if invoice else payment.invoice_id,
        "payment_recorded",
        f"Payment PAY reference recorded — amount: ₦{payment.amount:,.2f}",
        AuditActorType.employee, current_user.id,
    )
    db.commit()
    db.refresh(payment)
    return _to_response(payment)


@router.get("/by-invoice/{invoice_no}", response_model=PaymentListResponse)
def get_payments_by_invoice(
    invoice_no:   str,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    from app.invoices.service import InvoiceService
    invoice = InvoiceService().get_by_no_or_raise(db, invoice_no)
    payments = service.get_payments_by_invoice(db, invoice.id)
    return PaymentListResponse(
        items     = [_to_response(p) for p in payments],
        total     = len(payments),
        page      = 1,
        page_size = len(payments) or 1,
        has_next  = False,
    )


@router.get("/{payment_no}", response_model=PaymentResponse)
def get_payment(
    payment_no:   str,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    payment = service.get_by_no_or_raise(db, payment_no)
    return _to_response(payment)