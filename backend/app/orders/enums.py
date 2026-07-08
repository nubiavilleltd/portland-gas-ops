from __future__ import annotations
from enum import Enum

class OrderStatus(str, Enum):
    draft     = "draft"
    submitted = "submitted"
    confirmed = "confirmed"
    completed = "completed"
    cancelled = "cancelled"

class FulfillmentStatus(str, Enum):
    pending    = "pending"
    assigned   = "assigned"
    dispatched = "dispatched"
    in_transit = "in_transit"
    delivered  = "delivered"
    failed     = "failed"
