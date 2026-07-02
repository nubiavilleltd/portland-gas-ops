from __future__ import annotations
from pydantic import BaseModel
from typing import Optional, Any, Dict, List
from datetime import datetime
from enum import Enum


class AuditEntityType(str, Enum):
    order          = "order"
    trip           = "trip"
    invoice        = "invoice"
    inventory_item = "inventory_item"


class AuditActorType(str, Enum):
    employee = "employee"
    system   = "system"
    customer = "customer"


class AuditLogCreate(BaseModel):
    entity_type:       AuditEntityType
    entity_id:         str
    action:            str
    description:       str
    actor_type:        AuditActorType
    actor_employee_id: Optional[str]  = None
    actor_name:        Optional[str]  = None
    metadata:          Optional[Dict[str, Any]] = None


class AuditLogResponse(BaseModel):
    id:               int
    entity_type:      AuditEntityType
    entity_id:        str
    action:           str
    description:      str
    actor_type:       AuditActorType
    actor_employee_id: Optional[str]
    actor_name:       Optional[str]
    metadata:         Optional[Dict[str, Any]]
    created_at:       datetime

    class Config:
        from_attributes = True