from __future__ import annotations

from typing import Optional, List
import json

from fastapi import APIRouter, Depends, Query, Request, status as http_status, UploadFile, File, Form
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.exceptions import AppException, ErrorCode

from app.audit.schema import AuditActorType, AuditEntityType
from app.audit.service import AuditService
from app.core.dependencies import get_current_user, get_db
from app.payments.schema import (
    PaymentCreate,
    PaymentListResponse,
    PaymentResponse,
    PaymentAttachmentResponse
)
from app.payments.service import PaymentService
from app.shared.dependencies import require_roles
from app.shared.models.user import User

from app.payments.constants import (
    ALLOWED_ATTACHMENT_TYPES,
    MAX_ATTACHMENT_SIZE_MB,
    MAX_ATTACHMENTS,
)

router = APIRouter()
service = PaymentService()

def _uploaded_by(user: User) -> str | None:
    return (
        user.employee.id
        if getattr(user, "employee", None)
        else None
    )


def _validate_attachments(
    files: List[UploadFile],
) -> List[tuple]:

    if len(files) > MAX_ATTACHMENTS:
        raise AppException(
            status_code=400,
            error_code=ErrorCode.VALIDATION_ERROR,
            message=f"Maximum {MAX_ATTACHMENTS} attachments allowed.",
        )

    validated = []

    for file in files:

        if file.content_type not in ALLOWED_ATTACHMENT_TYPES:
            raise AppException(
                status_code=400,
                error_code=ErrorCode.VALIDATION_ERROR,
                message=f"{file.filename} has an unsupported file type.",
            )

        file_bytes = file.file.read()
        file.file.seek(0)

        size_mb = len(file_bytes) / (1024 * 1024)

        if size_mb > MAX_ATTACHMENT_SIZE_MB:
            raise AppException(
                status_code=400,
                error_code=ErrorCode.VALIDATION_ERROR,
                message=(
                    f"{file.filename} exceeds "
                    f"{MAX_ATTACHMENT_SIZE_MB} MB."
                ),
            )

        validated.append(
            (
                file_bytes,
                file.filename or "attachment",
                file.content_type,
                len(file_bytes),
            )
        )

    return validated


def _to_response(
    db: Session,
    payment,
) -> PaymentResponse:

    data = PaymentResponse.model_validate(payment)

    data.attachments = service.get_attachments(
        db,
        payment,
    )

    if payment.invoice:
        data.invoice_no = payment.invoice.invoice_no

        if payment.invoice.order:
            data.customer_id = payment.invoice.order.customer_id
            data.customer_name = payment.invoice.order.customer_name

    return data


@router.get("", response_model=PaymentListResponse)
def list_payments(
    invoice_id: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items, total = service.list(
        db=db,
        invoice_id=invoice_id,
        page=page,
        page_size=page_size,
    )

    return PaymentListResponse(
        items=[_to_response(db, item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
        has_next=(page * page_size) < total,
    )


@router.post(
    "",
    response_model=PaymentResponse,
    status_code=http_status.HTTP_201_CREATED,
)
async def record_payment(
    data: str = Form(...),
    attachments: List[UploadFile] = File(default=[]),
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("super_admin", "admin")
    ),
):
    
    try:
        payload = PaymentCreate.model_validate(
            json.loads(data)
        )
    except ValidationError as exc:
        raise AppException(
            status_code=422,
            error_code=ErrorCode.VALIDATION_ERROR,
            message="Invalid payment data.",
            details={"error": str(exc)},
        )

    attachment_files = _validate_attachments(
        attachments
    )

    uploaded_by = _uploaded_by(current_user)
    idempotency_key = request.headers.get("idempotency-key")

    print(current_user.id)
    print(current_user.employee)
    print(type(current_user.employee))

    if current_user.employee:
        print("employee.id =", current_user.employee.id)
        print("employee.user_id =", current_user.employee.user_id)

    payment = service.record(
        db=db,
        data=payload,
        attachments=attachment_files,
        uploaded_by=uploaded_by,
        recorded_by=current_user.id,
        idempotency_key=idempotency_key,
    )

    from app.invoices.service import InvoiceService
    from app.orders.service import OrderService

    invoice_service = InvoiceService()
    order_service = OrderService()

    invoice = invoice_service.get_or_raise(
        db,
        payment.invoice_id,
    )

    order = order_service.get_or_raise(
        db,
        invoice.order_id,
    )

    AuditService.record(
        db,
        AuditEntityType.payment,
        payment.id,
        "recorded",
        f"Payment {payment.payment_no} recorded.",
        AuditActorType.employee,
        current_user.employee.id,
        current_user.full_name
    )

    AuditService.record(
        db,
        AuditEntityType.invoice,
        invoice.id,
        "payment_recorded",
        (
            f"Payment {payment.payment_no} "
            f"recorded for ₦{payment.amount:,.2f}."
        ),
        AuditActorType.employee,
        current_user.employee.id,
        current_user.full_name,
    )

    AuditService.record(
        db,
        AuditEntityType.order,
        order.id,
        "payment_recorded",
        (
            f"Payment {payment.payment_no} "
            f"recorded for ₦{payment.amount:,.2f} "
            f"via {payment.method.value}."
        ),
        AuditActorType.employee,
        current_user.employee.id,
        current_user.full_name,
    )

    db.commit()
    db.refresh(payment)

    return _to_response(db, payment)


@router.get(
    "/by-invoice/{invoice_no}",
    response_model=PaymentListResponse,
)
def get_payments_by_invoice(
    invoice_no: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.invoices.service import InvoiceService

    invoice = InvoiceService().get_by_no_or_raise(
        db,
        invoice_no,
    )

    payments = service.get_payments_by_invoice(
        db,
        invoice.id,
    )

    return PaymentListResponse(
        items=[_to_response(db, payment) for payment in payments],
        total=len(payments),
        page=1,
        page_size=len(payments) or 1,
        has_next=False,
    )


@router.get(
    "/by-no/{payment_no}",
    response_model=PaymentResponse,
)
def get_payment_by_no(
    payment_no: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payment = service.get_by_no_or_raise(
        db,
        payment_no,
    )

    return _to_response(db, payment)
@router.get(
    "/{payment_id}",
    response_model=PaymentResponse,
)
def get_payment(
    payment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payment = service.get_or_raise(
        db,
        payment_id,
    )

    return _to_response(db, payment)


@router.get(
    "/{payment_id}/attachments",
    response_model=list[PaymentAttachmentResponse],
)
def get_payment_attachments(
    payment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payment = service.get_or_raise(
        db,
        payment_id,
    )

    return service.get_attachments(
        db,
        payment,
    )

from fastapi.responses import Response
from app.shared.services import cloudinary_service


@router.get(
    "/{payment_id}/attachments/{attachment_id}/download",
)
def download_attachment(
    payment_id: str,
    attachment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Ensure payment exists
    service.get_or_raise(
        db,
        payment_id,
    )

    attachment = service.get_attachment_or_raise(
        db,
        payment_id,
        attachment_id,
    )

    file_bytes, _ = cloudinary_service.download_via_admin_api(
        attachment.file_path,
    )

    return Response(
        content=file_bytes,
        media_type=attachment.mime_type,
        headers={
            "Content-Disposition": (
                f'attachment; filename="{attachment.name}"'
            )
        },
    )
