from fastapi import APIRouter, Depends, status, Query, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.shared.dependencies import get_current_user, require_roles
from app.shared.models.user import User
from app.shared.models.document import Document
from app.shared.services.cloudinary_service import upload_file
from app.hr.models import LeaveRequest
from app.hr.schemas import LeaveTypeCreate, LeaveTypeUpdate, LeaveTypeRead, LeaveRequestCreate, LeaveRequestRead
from app.hr import service
from app.employees.service import get_employee_by_user_id

router = APIRouter(prefix="/api/hr", tags=["HR Management"])


# ════════════════════════════════════════════════════════════════════════════
# CREATE - POST /api/hr/leave-types
# ════════════════════════════════════════════════════════════════════════════

@router.post(
    "/leave-types",
    response_model=LeaveTypeRead,
    status_code=status.HTTP_201_CREATED,
)
def create_leave_type(
    payload: LeaveTypeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_roles("super_admin", "admin", "hr")),
):
    """
    Create a new leave type.

    **Required Roles:** super_admin, admin, or hr

    **Body Parameters:**
    - leave_type_name: str (e.g., "Annual Leave")
    - entitlement_days: int (e.g., 21)
    - description: str (optional)
    - is_active: bool (default: True)

    **Example Request:**
    ```json
    {
        "leave_type_name": "Annual Leave",
        "entitlement_days": 21,
        "description": "Paid annual leave",
        "is_active": true
    }
    ```
    """
    leave_type = service.create_leave_type(db, payload)
    db.commit()
    db.refresh(leave_type)
    return leave_type


# ════════════════════════════════════════════════════════════════════════════
# READ ALL - GET /api/hr/leave-types
# ════════════════════════════════════════════════════════════════════════════

@router.get(
    "/leave-types",
    response_model=dict,
)
def list_leave_types(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List all leave types with pagination.

    **Query Parameters:**
    - skip: int (default: 0) - Skip N records
    - limit: int (default: 100, max: 200) - Return N records
    - is_active: bool (optional) - Filter by active status

    **Response:**
    ```json
    {
        "data": [
            {
                "id": 1,
                "leave_type_name": "Annual Leave",
                "entitlement_days": 21,
                "description": "Paid annual leave",
                "is_active": true,
                "created_at": "2026-07-01T10:30:00",
                "updated_at": "2026-07-01T10:30:00"
            }
        ],
        "total": 10,
        "skip": 0,
        "limit": 100
    }
    ```
    """
    leave_types, total = service.get_all_leave_types(
        db,
        skip=skip,
        limit=limit,
        is_active=is_active,
    )

    return {
        "data": [LeaveTypeRead.model_validate(lt) for lt in leave_types],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


# ════════════════════════════════════════════════════════════════════════════
# READ ONE - GET /api/hr/leave-types/{leave_type_id}
# ════════════════════════════════════════════════════════════════════════════

@router.get(
    "/leave-types/{leave_type_id}",
    response_model=LeaveTypeRead,
)
def get_leave_type(
    leave_type_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a single leave type by ID.

    **Path Parameters:**
    - leave_type_id: int

    **Response:** Single LeaveTypeRead object
    """
    return service.get_leave_type(db, leave_type_id)


# ════════════════════════════════════════════════════════════════════════════
# UPDATE - PUT /api/hr/leave-types/{leave_type_id}
# ════════════════════════════════════════════════════════════════════════════

@router.put(
    "/leave-types/{leave_type_id}",
    response_model=LeaveTypeRead,
)
def update_leave_type(
    leave_type_id: int,
    payload: LeaveTypeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_roles("super_admin", "admin", "hr")),
):
    """
    Update an existing leave type.

    **Path Parameters:**
    - leave_type_id: int

    **Body Parameters:** (all optional)
    - leave_type_name: str
    - entitlement_days: int
    - description: str
    - is_active: bool

    **Required Roles:** super_admin, admin, or hr
    """
    leave_type = service.update_leave_type(db, leave_type_id, payload)
    db.commit()
    db.refresh(leave_type)
    return leave_type


# ════════════════════════════════════════════════════════════════════════════
# DEACTIVATE - PATCH /api/hr/leave-types/{leave_type_id}/deactivate
# ════════════════════════════════════════════════════════════════════════════

@router.patch(
    "/leave-types/{leave_type_id}/deactivate",
    response_model=LeaveTypeRead,
)
def deactivate_leave_type(
    leave_type_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_roles("super_admin", "admin", "hr")),
):
    """
    Deactivate a leave type (soft delete).

    **Path Parameters:**
    - leave_type_id: int

    **Required Roles:** super_admin, admin, or hr
    """
    leave_type = service.deactivate_leave_type(db, leave_type_id)
    db.commit()
    db.refresh(leave_type)
    return leave_type


# ════════════════════════════════════════════════════════════════════════════
# REACTIVATE - PATCH /api/hr/leave-types/{leave_type_id}/reactivate
# ════════════════════════════════════════════════════════════════════════════

@router.patch(
    "/leave-types/{leave_type_id}/reactivate",
    response_model=LeaveTypeRead,
)
def reactivate_leave_type(
    leave_type_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_roles("super_admin", "admin", "hr")),
):
    """
    Reactivate a deactivated leave type.

    **Path Parameters:**
    - leave_type_id: int

    **Required Roles:** super_admin, admin, or hr
    """
    leave_type = service.reactivate_leave_type(db, leave_type_id)
    db.commit()
    db.refresh(leave_type)
    return leave_type


# ════════════════════════════════════════════════════════════════════════════
# LEAVE REQUESTS
# ════════════════════════════════════════════════════════════════════════════

@router.post(
    "/leave-requests",
    response_model=LeaveRequestRead,
    status_code=status.HTTP_201_CREATED,
)
def create_leave_request(
    payload: LeaveRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new leave request (draft status).

    **Body Parameters:**
    - employee_id: str (UUID)
    - leave_type_id: int
    - reliever_id: str (UUID)
    - start_date: date (YYYY-MM-DD)
    - end_date: date (YYYY-MM-DD)
    - reason: str (optional)
    - document_id: int (optional)
    """
    leave_request = service.create_leave_request(db, payload, current_user.id)
    db.commit()
    db.refresh(leave_request)
    return leave_request


@router.get(
    "/leave-requests",
    response_model=dict,
)
def list_leave_requests(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    sort_by: str = Query("created_at", pattern="^(created_at|start_date|end_date|days|status)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List all leave requests with pagination.

    **Query Parameters:**
    - skip: int (default: 0)
    - limit: int (default: 100, max: 200)

    **Response:**
    ```json
    {
        "data": [
            {
                "id": "uuid",
                "reference": "LRQ-2026-0001",
                "employee_id": "uuid",
                "employee_name": "John Doe",
                "leave_type_id": 1,
                "leave_type_name": "Annual Leave",
                "start_date": "2026-06-01",
                "end_date": "2026-06-10",
                "days": 10,
                "status": "draft",
                ...
            }
        ],
        "total": 42,
        "skip": 0,
        "limit": 100
    }
    ```
    """
    leave_requests, total = service.get_all_leave_requests(
        db, skip=skip, limit=limit, sort_by=sort_by, sort_order=sort_order
    )

    return {
        "data": [LeaveRequestRead.model_validate(lr) for lr in leave_requests],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get(
    "/leave-requests/{reference}",
    response_model=LeaveRequestRead,
)
def get_leave_request(
    reference: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a single leave request by reference.

    **Path Parameters:**
    - reference: str (e.g., "LRQ-2026-0001")

    **Response:** Single LeaveRequestRead object
    """
    return service.get_leave_request_by_reference(db, reference)


# ════════════════════════════════════════════════════════════════════════════
# UPLOAD DOCUMENT - POST /api/hr/leave-requests/{id}/upload-document
# ════════════════════════════════════════════════════════════════════════════

@router.post(
    "/leave-requests/{leave_request_id}/upload-document",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
)
def upload_leave_request_document(
    leave_request_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Upload a supporting document for a leave request.

    **Path Parameters:**
    - leave_request_id: str (UUID)

    **Body:**
    - file: UploadFile (multipart/form-data)

    **Response:**
    ```json
    {
        "document_id": 123,
        "file_name": "document.pdf",
        "file_url": "https://res.cloudinary.com/..."
    }
    ```
    """
    # Validate leave request exists
    leave_request = db.query(LeaveRequest).filter(LeaveRequest.id == leave_request_id).first()
    if not leave_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave request not found")

    # Validate file type
    ALLOWED_TYPES = {"application/pdf", "image/png", "image/jpeg", "image/webp", "application/msword",
                     "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="File type not allowed. Allowed: PDF, JPG, PNG, WEBP, DOC, DOCX")

    # Validate file size (max 10 MB)
    file_bytes = file.file.read()
    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be 10 MB or smaller")

    # Upload to Cloudinary (non-blocking - allow upload to fail gracefully)
    url = None
    try:
        url = upload_file(file_bytes, file.filename or "document", folder="portland-gas/leave-requests")
    except Exception as e:
        print(f"Cloudinary upload error: {str(e)}")
        # Store file locally or with fallback URL if Cloudinary fails
        url = f"file://{file.filename}" if file.filename else "file://document"

    # Get uploader employee
    uploader_employee = get_employee_by_user_id(current_user.id, db)

    # Create Document record
    doc = Document(
        type="file",
        name=file.filename or "leave_request_document",
        category="hr",
        file_path=url,
        file_size=len(file_bytes),
        mime_type=file.content_type,
        uploaded_by=uploader_employee.id if uploader_employee else None,
    )
    db.add(doc)
    db.flush()

    # Update leave request with document_id
    leave_request.document_id = doc.id
    db.commit()  # Commit changes
    db.refresh(leave_request)  # Refresh to get latest state

    return {
        "document_id": doc.id,
        "file_name": file.filename or "document",
        "file_url": url,
    }


# ════════════════════════════════════════════════════════════════════════════
# SUBMIT FOR APPROVAL - POST /api/hr/leave-requests/{id}/submit-for-approval
# ════════════════════════════════════════════════════════════════════════════

@router.post(
    "/leave-requests/{leave_request_id}/submit-for-approval",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
)
def submit_leave_request_for_approval(
    leave_request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Submit a leave request for approval via the workflow engine.

    Creates ApprovalRequest and AllRequest entries to start the approval workflow.

    **Path Parameters:**
    - leave_request_id: str (UUID)

    **Response:**
    ```json
    {
        "approval_request_id": "uuid",
        "reference": "LRQ-2026-0001",
        "status": "pending"
    }
    ```
    """
    approval_request = service.submit_leave_request_for_approval(db, leave_request_id)
    db.commit()
    db.refresh(approval_request)

    return {
        "approval_request_id": approval_request.id,
        "request_type": approval_request.request_type,
        "request_id": approval_request.request_id,
        "status": approval_request.overall_status,
        "current_step_number": approval_request.current_step_number,
    }
