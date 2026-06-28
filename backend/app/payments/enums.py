from __future__ import annotations
from enum import Enum

class PaymentStatus(str, Enum):
    unpaid          = "unpaid"
    partially_paid  = "partially_paid"
    paid            = "paid"
    overdue         = "overdue"
    void            = "void"

class PaymentMethod(str, Enum):
    bank_transfer = "bank_transfer"
    cash          = "cash"
    card          = "card"
    cheque        = "cheque"