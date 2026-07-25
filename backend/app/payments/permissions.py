from __future__ import annotations

from app.core.exceptions import AppException
from app.core.exceptions import ErrorCode
from app.shared.models.user import User
from backend.app.invoices.model import Invoice
from backend.app.payments.model import Payment


class PaymentPermissions:

    def ensure_can_record_payment(
        self,
        user: User,
    ) -> None:

        if user.role not in (
            "super_admin",
            "admin",
        ):
            raise AppException(
                status_code=403,
                error_code=ErrorCode.FORBIDDEN,
                message="You do not have permission to record payments.",
            )
    
    def ensure_can_list_payments(
        self,
        user: User,
    ) -> None:

        if user.role not in (
            "super_admin",
            "admin",
        ):
            raise AppException(
                status_code=403,
                error_code=ErrorCode.FORBIDDEN,
                message="You do not have permission to view payments.",
            )
        
    def ensure_can_view_invoice_payments(
        self,
        user: User,
        invoice: Invoice,
    ) -> None:

        if user.role not in (
            "super_admin",
            "admin",
        ):
            raise AppException(
                status_code=403,
                error_code=ErrorCode.FORBIDDEN,
                message="You do not have permission to view payments for this invoice.",
            )
        
    def ensure_can_view_payment(
        self,
        user: User,
        payment: Payment,
    ) -> None:

        if user.role not in (
            "super_admin",
            "admin",
        ):
            raise AppException(
                status_code=403,
                error_code=ErrorCode.FORBIDDEN,
                message="You do not have permission to view this payment.",
            )


permissions = PaymentPermissions()