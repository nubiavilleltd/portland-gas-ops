from __future__ import annotations

from fastapi import APIRouter, Depends, Query, File, UploadFile, Form, status
from sqlalchemy.orm import Session
from typing import Optional, List
import json

from app.core.dependencies import get_db, get_current_user
from app.shared.dependencies import require_roles
from app.products.service import ProductService
from app.products.schema import (
    ProductCreate, ProductUpdate, ProductFilters,
    ProductResponse, ProductListResponse,
)
from app.products.enums import ProductType, ProductStatus
from app.shared.models.user import User
from app.core.exceptions import AppException, ErrorCode
from pydantic import ValidationError

router  = APIRouter()
service = ProductService()

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_SIZE_MB   = 5
MAX_IMAGES          = 3


def _validate_images(files: List[UploadFile]) -> List[tuple]:
    if len(files) > MAX_IMAGES:
        raise AppException(
            status_code=400,
            error_code=ErrorCode.VALIDATION_ERROR,
            message=f"Maximum {MAX_IMAGES} images allowed",
        )
    result = []
    for file in files:
        if file.content_type not in ALLOWED_IMAGE_TYPES:
            raise AppException(
                status_code=400,
                error_code=ErrorCode.VALIDATION_ERROR,
                message=f"Invalid image type '{file.content_type}'. Allowed: JPEG, PNG, WebP",
            )
        file_bytes = file.file.read()
        size_mb    = len(file_bytes) / (1024 * 1024)
        if size_mb > MAX_IMAGE_SIZE_MB:
            raise AppException(
                status_code=400,
                error_code=ErrorCode.VALIDATION_ERROR,
                message=f"Image '{file.filename}' exceeds {MAX_IMAGE_SIZE_MB}MB limit",
            )
        result.append((file_bytes, file.filename or "image", file.content_type, len(file_bytes)))
    return result


@router.get("/", response_model=ProductListResponse)
def list_products(
    search:       Optional[str]           = Query(None),
    product_type: Optional[ProductType]   = Query(None),
    status:       Optional[ProductStatus] = Query(None),
    page:         int                     = Query(1, ge=1),
    page_size:    int                     = Query(50, ge=1, le=200),
    db:           Session                 = Depends(get_db),
    current_user: User                    = Depends(get_current_user),
):
    filters = ProductFilters(
        search=search, product_type=product_type,
        status=status, page=page, page_size=page_size,
    )
    items, total = service.list(db, filters)

    response_items = []
    for product in items:
        images = service.get_images(db, product)
        data   = ProductResponse.model_validate(product)
        data.images = images
        response_items.append(data)

    return ProductListResponse(
        items     = response_items,
        total     = total,
        page      = page,
        page_size = page_size,
        has_next  = (page * page_size) < total,
    )


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    data:         str               = Form(...),
    images:       List[UploadFile]  = File(default=[]),
    db:           Session           = Depends(get_db),
    current_user: User              = Depends(require_roles("super_admin", "admin")),
):
    try:
        payload = ProductCreate.model_validate(json.loads(data))
    except ValidationError as exc:
        raise AppException(
            status_code=422,
            error_code=ErrorCode.VALIDATION_ERROR,
            message="Invalid product data",
            details={"error": str(exc)},
        )

    image_files = _validate_images(images)

    uploaded_by = None
    if hasattr(current_user, "employee") and current_user.employee:
        uploaded_by = current_user.employee.id

    product = service.create(db, payload, image_files, uploaded_by)
    db.commit()
    db.refresh(product)

    images_response = service.get_images(db, product)
    response        = ProductResponse.model_validate(product)
    response.images = images_response
    return response


@router.get("/{product_no}", response_model=ProductResponse)
def get_product(
    product_no:   str,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    product         = service.get_by_no_or_raise(db, product_no)
    images_response = service.get_images(db, product)
    response        = ProductResponse.model_validate(product)
    response.images = images_response
    return response


@router.put("/{product_no}", response_model=ProductResponse)
async def update_product(
    product_no:     str,
    data:           str              = Form(...),
    images:         List[UploadFile] = File(default=[]),
    kept_image_ids: str              = Form(default="[]"),
    db:             Session          = Depends(get_db),
    current_user:   User             = Depends(require_roles("super_admin", "admin")),
):
    try:
        payload  = ProductUpdate.model_validate(json.loads(data))
        kept_ids = json.loads(kept_image_ids)
    except ValidationError as exc:
        raise AppException(
            status_code=422,
            error_code=ErrorCode.VALIDATION_ERROR,
            message="Invalid product data",
            details={"error": str(exc)},
        )

    image_files = _validate_images(images)

    uploaded_by = None
    if hasattr(current_user, "employee") and current_user.employee:
        uploaded_by = current_user.employee.id

    product = service.update(
        db, product_no, payload,
        new_images     = image_files,
        kept_image_ids = kept_ids,
        uploaded_by    = uploaded_by,
    )
    db.commit()
    db.refresh(product)

    images_response = service.get_images(db, product)
    response        = ProductResponse.model_validate(product)
    response.images = images_response
    return response


@router.post("/{product_no}/deactivate", response_model=ProductResponse)
def deactivate_product(
    product_no:   str,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(require_roles("super_admin", "admin")),
):
    product         = service.deactivate(db, product_no)
    db.commit()
    db.refresh(product)
    images_response = service.get_images(db, product)
    response        = ProductResponse.model_validate(product)
    response.images = images_response
    return response


@router.post("/{product_no}/activate", response_model=ProductResponse)
def activate_product(
    product_no:   str,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(require_roles("super_admin", "admin")),
):
    product         = service.activate(db, product_no)
    db.commit()
    db.refresh(product)
    images_response = service.get_images(db, product)
    response        = ProductResponse.model_validate(product)
    response.images = images_response
    return response