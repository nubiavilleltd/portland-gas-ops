from __future__ import annotations

from app.core.exceptions import AppException
from app.core.exceptions import ErrorCode
from app.shared.models.user import User
from app.invoices.model import Invoice
from app.payments.model import Payment


class PaymentPermissions:

    def ensure_can_record_payment(
        self,
        user: User,
    ) -> None:
        return True

        # if user.role not in (
        #     "super_admin",
        #     "admin",
        # ):
        #     raise AppException(
        #         status_code=403,
        #         error_code=ErrorCode.FORBIDDEN,
        #         message="You do not have permission to record payments.",
        #     )
    
    def ensure_can_list_payments(
        self,
        user: User,
    ) -> None:
        True

        # if user.role not in (
        #     "super_admin",
        #     "admin",
        # ):
        #     raise AppException(
        #         status_code=403,
        #         error_code=ErrorCode.FORBIDDEN,
        #         message="You do not have permission to view payments.",
        #     )
        
    def ensure_can_view_invoice_payments(
        self,
        user: User,
        invoice: Invoice,
    ) -> None:
        return True

        # if user.role not in (
        #     "super_admin",
        #     "admin",
        # ):
        #     raise AppException(
        #         status_code=403,
        #         error_code=ErrorCode.FORBIDDEN,
        #         message="You do not have permission to view payments for this invoice.",
        #     )
        
    def ensure_can_view_payment(
        self,
        user: User,
        payment: Payment,
    ) -> None:

        return True

        # if user.role not in (
        #     "super_admin",
        #     "admin",
        # ):
        #     raise AppException(
        #         status_code=403,
        #         error_code=ErrorCode.FORBIDDEN,
        #         message="You do not have permission to view this payment.",
        #     )


permissions = PaymentPermissions()