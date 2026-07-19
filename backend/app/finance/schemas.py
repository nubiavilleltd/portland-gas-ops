from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date


class DocumentInfo(BaseModel):
    id: int
    name: str
    file_path: Optional[str] = None
    mime_type: Optional[str] = None

    class Config:
        from_attributes = True


# ── Cash Requisition Schemas ─────────────────────────────────────────────────

class CashRequisitionCreate(BaseModel):
    title: str
    description: Optional[str] = None
    department: Optional[str] = None   # defaults to requester's department when omitted
    amount: float
    currency: str = "NGN"              # NGN, USD, EUR, GBP
    expected_retirement: Optional[date] = None
    document_id: Optional[int] = None


class CashRequisitionRead(BaseModel):
    id: str
    reference: str
    requester_id: Optional[str] = None
    requester_name: Optional[str] = None
    requester_job_title: Optional[str] = None
    title: str
    description: Optional[str] = None
    department: Optional[str] = None
    amount: float
    currency: Optional[str] = None
    expected_retirement: Optional[date] = None
    document: Optional[DocumentInfo] = None
    status: str
    approval_request_id: Optional[str] = None
    next_actor_name: Optional[str] = None      # who currently holds the request (pending step assignee)
    current_step_name: Optional[str] = None    # name of the current pending step
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
