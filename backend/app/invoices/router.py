from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.audit.schema import AuditActorType, AuditEntityType
from app.audit.service import AuditService
from app.core.dependencies import get_current_user, get_db
from app.core.exceptions import AppException
from app.invoices.error_codes import InvoiceErrorCode
from app.invoices.schema import (
    InvoiceCreate,
    InvoiceFilters,
    InvoiceListResponse,
    InvoiceResponse,
)
from app.invoices.service import InvoiceService
from app.payments.enums import PaymentStatus
from app.shared.dependencies import require_roles
from app.shared.models.user import User

router = APIRouter()
service = InvoiceService()


def _to_response(invoice) -> InvoiceResponse:
    """
    Convert ORM model to API response.

    Denormalized values come from snapshots stored on Invoice.
    """
    return InvoiceResponse.model_validate(invoice)


@router.get("", response_model=InvoiceListResponse)
def list_invoices(
    order_id: Optional[str] = Query(None),
    status_filter: Optional[PaymentStatus] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    filters = InvoiceFilters(
        order_id=order_id,
        status=status_filter,
        page=page,
        page_size=page_size,
    )

    items, total = service.list(db, filters)

    return InvoiceListResponse(
        items=[_to_response(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
        has_next=(page * page_size) < total,
    )


@router.post(
    "/",
    response_model=InvoiceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_invoice(
    data: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("super_admin", "admin")),
):
    invoice = service.create(
        db,
        data,
        created_by=current_user.id,
    )

    AuditService.record(
        db,
        AuditEntityType.invoice,
        invoice.id,
        "created",
        f"Invoice {invoice.invoice_no} generated",
        AuditActorType.employee,
        current_user.id,
    )

    AuditService.record(
        db,
        AuditEntityType.order,
        invoice.order_id,
        "invoice_generated",
        f"Invoice {invoice.invoice_no} generated",
        AuditActorType.employee,
        current_user.id,
    )

    db.commit()
    db.refresh(invoice)

    return _to_response(invoice)


@router.get("/by-order/{order_no}", response_model=InvoiceResponse)
def get_invoice_by_order(
    order_no: str,
    db: Session =Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.orders.service import OrderService

    order = OrderService().get_by_no_or_raise(db, order_no)

    invoice = service.get_by_order_id_or_raise(db, order.id)

    return _to_response(invoice)


@router.get("/{invoice_no}", response_model=InvoiceResponse)
def get_invoice(
    invoice_no: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    invoice = service.get_by_no_or_raise(db, invoice_no)
    return _to_response(invoice)


@router.post("/{invoice_no}/void", response_model=InvoiceResponse)
def void_invoice(
    invoice_no: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("super_admin", "admin")),
):
    invoice = service.get_by_no_or_raise(db, invoice_no)

    invoice = service.void(db, invoice)

    AuditService.record(
        db,
        AuditEntityType.invoice,
        invoice.id,
        "voided",
        f"Invoice {invoice.invoice_no} voided",
        AuditActorType.employee,
        current_user.id,
    )

    db.commit()
    db.refresh(invoice)

    return _to_response(invoice)
