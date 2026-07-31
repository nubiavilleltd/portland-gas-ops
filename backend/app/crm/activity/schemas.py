from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional

from pydantic import BaseModel, ConfigDict, Field


class CRMActivityEntityType(str, Enum):
    customer = "customer"
    contact = "contact"
    complaint = "complaint"
    visit = "visit"
    task = "task"
    communication = "communication"
    service_request = "service_request"


class CRMActivityActorType(str, Enum):
    employee = "employee"
    system = "system"
    customer = "customer"


class CRMActivityCreate(BaseModel):
    customer_id: str

    entity_type: CRMActivityEntityType
    entity_id: str

    action: str
    description: str

    actor_type: CRMActivityActorType = CRMActivityActorType.employee

    actor_employee_id: Optional[str] = None
    actor_name: Optional[str] = None

    metadata: Optional[Dict[str, Any]] = None


class CRMActivityResponse(BaseModel):
    id: str

    customer_id: str

    entity_type: CRMActivityEntityType
    entity_id: str

    action: str
    description: str

    actor_type: CRMActivityActorType
    actor_employee_id: Optional[str]
    actor_name: Optional[str]

    metadata: Optional[Dict[str, Any]] = Field(
        default=None,
        validation_alias="metadata_",
        serialization_alias="metadata",
    )

    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
    )