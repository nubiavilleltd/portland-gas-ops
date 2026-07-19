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


# ── Invoice Processing Schemas ───────────────────────────────────────────────

class InvoiceProcessingCreate(BaseModel):
    invoice_id: Optional[str] = None       # internal ID (IID-…), generated on the form
    invoice_number: Optional[str] = None   # vendor's invoice number
    title: str
    description: Optional[str] = None
    vendor: str                            # vendor/supplier name (from vendors)
    department: Optional[str] = None       # defaults to requester's department
    po_number: Optional[str] = None        # procurement_requests reference
    payment_terms: Optional[str] = None
    gross_amount: float
    tax_amount: Optional[float] = 0
    amount: float                          # net amount
    currency: str = "NGN"
    document_id: Optional[int] = None


class InvoiceProcessingRead(BaseModel):
    id: str
    reference: str
    requester_id: Optional[str] = None
    requester_name: Optional[str] = None
    requester_job_title: Optional[str] = None
    invoice_id: Optional[str] = None
    invoice_number: Optional[str] = None
    title: str
    description: Optional[str] = None
    vendor: Optional[str] = None
    department: Optional[str] = None
    po_number: Optional[str] = None
    payment_terms: Optional[str] = None
    gross_amount: float
    tax_amount: Optional[float] = None
    amount: float
    currency: Optional[str] = None
    document: Optional[DocumentInfo] = None
    status: str
    approval_request_id: Optional[str] = None
    next_actor_name: Optional[str] = None
    current_step_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class POOption(BaseModel):
    reference: str


class VendorOption(BaseModel):
    id: str
    name: str
