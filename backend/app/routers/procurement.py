"""
Procurement router — /api/procurement

Why multipart/form-data instead of JSON for the create endpoint?
  When staff attach a supporting document (quote PDF, spec sheet), the file
  cannot go in a JSON body — JSON is text-only. So the create endpoint accepts
  multipart/form-data where:
    - The JSON fields (title, items, etc.) are sent as a "data" form field (JSON string)
    - The file is sent as "attachment" form field

  The frontend will serialize the form data as JSON into the "data" field and
  attach the file separately. FastAPI then parses both on this side.

Endpoints:
  GET    /api/procurement            → list requests (own for staff, all for managers)
  POST   /api/procurement            → create a new request (multipart)
  GET    /api/procurement/{id}       → get full detail (with vendor + items)
  PATCH  /api/procurement/{id}       → edit a draft/submitted request
  PATCH  /api/procurement/{id}/status → move through workflow (manager only)
  DELETE /api/procurement/{id}       → cancel (soft-delete)
"""

import json
from fastapi import APIRouter, Depends, Query, UploadFile, File, Form, HTTPException, status
from fastapi.responses import Response
from pydantic import ValidationError
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.procurement import ProcurementStatus
from app.schemas.procurement import (
    ProcurementCreate,
    ProcurementUpdate,
    ProcurementStatusUpdate,
    ProcurementResponse,
    ProcurementListItem,
)
from app.services import procurement_service, pdf_service

router = APIRouter()


@router.get("/", response_model=List[ProcurementListItem])
def list_procurement(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status_filter: Optional[ProcurementStatus] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List procurement requests.

    Staff see only their own. Admins/managers see everything.
    Filter by status with ?status=submitted (or ordered, delivered, etc.)
    """
    return procurement_service.list_requests(
        db, current_user, skip=skip, limit=limit, status_filter=status_filter
    )


@router.post("/", response_model=ProcurementResponse, status_code=201)
async def create_procurement(
    data: str = Form(..., description="JSON string of ProcurementCreate fields"),
    attachment: Optional[UploadFile] = File(None, description="Optional supporting document"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new procurement request.

    Accepts multipart/form-data:
      - data: JSON string matching ProcurementCreate schema
      - attachment: optional file (PDF, image, etc.)

    Why JSON string in a form field?
      FastAPI doesn't support nested Pydantic models with File uploads in the same
      request body using regular JSON. The workaround is to serialize the JSON
      data as a string in a form field, then parse it here on the server side.
      The frontend does: formData.append("data", JSON.stringify(payload))
    """
    # Parse and validate the JSON data field
    try:
        parsed = json.loads(data)
    except json.JSONDecodeError:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid JSON in 'data' field")

    try:
        create_data = ProcurementCreate(**parsed)
    except ValidationError as exc:
        # Return Pydantic's validation errors in a readable format
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=exc.errors(include_url=False),
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))

    # Read and validate attachment if a file was uploaded
    MAX_FILE_BYTES = 10 * 1024 * 1024   # 10 MB
    ALLOWED_MIME_TYPES = {
        "application/pdf", "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "image/png", "image/jpeg", "image/jpg",
    }
    attachment_bytes = None
    attachment_filename = None
    if attachment and attachment.filename:
        if attachment.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type not allowed. Accepted: PDF, Word, Excel, PNG, JPG",
            )
        attachment_bytes = await attachment.read()
        if len(attachment_bytes) > MAX_FILE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File too large. Maximum size is 10 MB",
            )
        attachment_filename = attachment.filename

    return procurement_service.create_request(
        db=db,
        data=create_data,
        current_user=current_user,
        attachment_bytes=attachment_bytes,
        attachment_filename=attachment_filename,
    )


@router.get("/{request_id}", response_model=ProcurementResponse)
def get_procurement(
    request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return procurement_service.get_request(db, request_id, current_user)


@router.patch("/{request_id}", response_model=ProcurementResponse)
def update_procurement(
    request_id: str,
    data: ProcurementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return procurement_service.update_request(db, request_id, data, current_user)


@router.patch("/{request_id}/status", response_model=ProcurementResponse)
def update_procurement_status(
    request_id: str,
    data: ProcurementStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Move a request through the workflow.
    Only admin/manager roles can call this endpoint.

    Valid transitions:
      submitted → ordered | cancelled
      ordered   → delivered | cancelled
    """
    return procurement_service.update_status(db, request_id, data, current_user)


@router.get("/{request_id}/download-po")
def download_po(
    request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Regenerate and download the Purchase Order PDF on demand.

    Why regenerate instead of fetching from Cloudinary?
      Cloudinary raw assets require authentication for direct access — proxying
      them adds complexity and a network round-trip. Regenerating from the DB is
      instant, always up-to-date, and has no external dependency at download time.
    """
    req = procurement_service.get_request(db, request_id, current_user)

    vendor = req.vendor
    items_for_pdf = [
        {
            "description": item.description,
            "quantity": item.quantity,
            "unit": item.unit.value,
            "unit_cost": item.unit_cost,
            "total_cost": item.total_cost,
        }
        for item in req.items
    ]

    import datetime
    pdf_bytes = pdf_service.generate_purchase_order(
        reference=req.reference,
        title=req.title,
        category=req.category.value,
        priority=req.priority.value,
        justification=req.justification,
        required_by=req.required_by,
        vendor_name=vendor.name    if vendor else None,
        vendor_address=vendor.address if vendor else None,
        vendor_phone=vendor.phone  if vendor else None,
        vendor_email=vendor.email  if vendor else None,
        items=items_for_pdf,
        requester_name=current_user.name,
        created_at=req.created_at.date() if req.created_at else datetime.date.today(),
    )

    filename = f"{req.reference}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.delete("/{request_id}", status_code=204)
def cancel_procurement(
    request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    procurement_service.cancel_request(db, request_id, current_user)
