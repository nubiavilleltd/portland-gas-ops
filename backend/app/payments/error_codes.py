from __future__ import annotations
from enum import Enum

class PaymentErrorCode(str, Enum):
    PAYMENT_NOT_FOUND       = "PAYMENT_NOT_FOUND"
    PAYMENT_EXCEEDS_BALANCE = "PAYMENT_EXCEEDS_BALANCE"
    INVOICE_ALREADY_PAID    = "INVOICE_ALREADY_PAID"