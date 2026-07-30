# from __future__ import annotations
# from app.invoices.model import Invoice
# from app.payments.enums import PaymentStatus



from __future__ import annotations

from app.core.exceptions import AppException
from app.invoices.model import Invoice
from app.payments.enums import PaymentStatus
from app.payments.error_codes import PaymentErrorCode
from decimal import Decimal



def ensure_can_record_payment(
    invoice: Invoice,
) -> None:

    if invoice.status in (
        PaymentStatus.paid,
        PaymentStatus.void,
    ):
        raise AppException(
            status_code=400,
            error_code=PaymentErrorCode.INVOICE_ALREADY_PAID,
            message="This invoice cannot accept additional payments.",
        )
    
def ensure_payment_does_not_exceed_balance(
    amount: Decimal,
    remaining_balance: Decimal,
) -> None:
    if amount > remaining_balance:
        raise AppException(
            status_code=400,
            error_code=PaymentErrorCode.PAYMENT_EXCEEDS_BALANCE,
            message=(
                f"Payment exceeds outstanding balance of "
                f"₦{remaining_balance:,.2f}."
            ),
            details={
                "remaining_balance": str(remaining_balance),
                "attempted_amount": str(amount),
            },
        )