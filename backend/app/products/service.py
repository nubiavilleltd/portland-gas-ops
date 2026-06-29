from __future__ import annotations

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional
from decimal import Decimal

from app.products.repository import ProductRepository
from app.products.model import Product
from app.products.schema import ProductCreate, ProductUpdate, ProductFilters, ProductImageResponse
from app.products.enums import ProductStatus
from app.products import guards
from app.shared.services.cloudinary_service import get_storage_service, ResourceType
from app.core.exceptions import AppException, ErrorCode
from app.products.error_codes import ProductErrorCode
from app.shared.models.document import Document
from app.shared.utils.number_generator import generate_entity_no


class ProductService:

    def __init__(self):
        self.repo    = ProductRepository()
        self.storage = get_storage_service()

    def get_or_raise(self, db: Session, product_id: str) -> Product:
        product = self.repo.get_by_id(db, product_id)
        if not product:
            raise AppException(
                status_code=404,
                error_code=ProductErrorCode.PRODUCT_NOT_FOUND,
                message=f"Product {product_id} not found",
            )
        return product
    def get_by_no_or_raise(self, db: Session, product_no: str) -> Product:
        product = self.repo.get_by_no(db, product_no)
        if not product:
            raise AppException(
                status_code=404,
                error_code=ProductErrorCode.PRODUCT_NOT_FOUND,
                message=f"Product {product_no} not found",
            )
        return product

    def get_images(self, db: Session, product: Product) -> list[ProductImageResponse]:
        docs = self.repo.get_product_images(db, product.id)
        return [
            ProductImageResponse(
                id   = str(doc.id),
                url  = doc.file_path or "",
                name = doc.name,
            )
            for doc in docs
        ]

    def create(
        self,
        db:           Session,
        data:         ProductCreate,
        image_files:  list[tuple[bytes, str, str, int]],  # (bytes, filename, mime_type, size)
        uploaded_by:  Optional[str] = None,
    ) -> Product:
        # Name uniqueness check
        if self.repo.get_by_name(db, data.name):
            raise AppException(
                status_code=409,
                error_code=ErrorCode.DUPLICATE_ENTRY,
                message=f"A product named '{data.name}' already exists",
                details={"field": "name"},
            )

        # Code uniqueness check (tracked products only)
        if data.code and self.repo.get_by_code(db, data.code):
            raise AppException(
                status_code=409,
                error_code=ErrorCode.DUPLICATE_ENTRY,
                message=f"Product code '{data.code}' is already in use",
                details={"field": "code"},
            )

        try:
            with db.begin_nested():
                product_no = self.repo.generate_product_no(db)
                product = self.repo.create(
                    db,
                    name               = data.name,
                    code               = data.code,
                    product_no=product_no,
                    description        = data.description,
                    product_type       = data.product_type,
                    unit               = data.unit,
                    default_unit_price = data.default_unit_price,
                    minimum_stock      = data.minimum_stock,
                )
            # Upload images and create document records
            first_doc_id: Optional[int] = None
            for (file_bytes, filename, mime_type, file_size) in image_files:
                result = self.storage.upload(
                    file_bytes    = file_bytes,
                    filename      = filename,
                    folder        = f"products/{product.id}",
                    resource_type = ResourceType.IMAGE,
                    overwrite     = False,
                )
                doc = self.repo.create_image_document(
                    db,
                    product_id  = product.id,
                    filename    = filename,
                    url         = result.url,
                    file_size   = result.file_size,
                    mime_type   = mime_type,
                    uploaded_by = uploaded_by,
                )
                if first_doc_id is None:
                    first_doc_id = doc.id

            # Set primary image
            if first_doc_id:
                product.primary_document_id = first_doc_id

            return product
        except AppException:
            raise
        except IntegrityError:
            raise AppException(
                status_code=409,
                error_code=ErrorCode.DUPLICATE_ENTRY,
                message="A product with this name or code already exists",
            )

    def list(self, db: Session, filters: ProductFilters) -> tuple[list[Product], int]:
        return self.repo.list(
            db,
            search       = filters.search,
            product_type = filters.product_type.value if filters.product_type else None,
            status       = filters.status.value if filters.status else None,
            page         = filters.page,
            page_size    = filters.page_size,
        )

    def update(
        self,
        db:          Session,
        product_no:  str,
        data:        ProductUpdate,
        new_images:  list[tuple[bytes, str, str, int]] = None,
        kept_image_ids: list[str] = None,
        uploaded_by: Optional[str] = None,
    ) -> Product:
        product = self.get_by_no_or_raise(db, product_no)

        # Name uniqueness on update
        if data.name and data.name.strip().lower() != product.name.lower():
            if self.repo.get_by_name(db, data.name):
                raise AppException(
                    status_code=409,
                    error_code=ErrorCode.DUPLICATE_ENTRY,
                    message=f"A product named '{data.name}' already exists",
                    details={"field": "name"},
                )

        # Code uniqueness on update
        if data.code and data.code.upper() != (product.code or "").upper():
            if self.repo.get_by_code(db, data.code):
                raise AppException(
                    status_code=409,
                    error_code=ErrorCode.DUPLICATE_ENTRY,
                    message=f"Product code '{data.code}' is already in use",
                    details={"field": "code"},
                )

        # Apply scalar field updates
        updates = data.model_dump(exclude_unset=True)
        product = self.repo.update(db, product, **updates)

        # Handle image changes
        if new_images is not None or kept_image_ids is not None:
            existing_docs = self.repo.get_product_images(db, product.id)
            kept_ids_set  = set(kept_image_ids or [])

            # Delete images that were removed
            for doc in existing_docs:
                if str(doc.id) not in kept_ids_set:
                    self.repo.delete_image_document(db, doc.id)

            # Upload new images
            first_remaining_id: Optional[int] = None

            # Find first kept doc id to potentially use as primary
            for doc in existing_docs:
                if str(doc.id) in kept_ids_set:
                    first_remaining_id = doc.id
                    break

            for (file_bytes, filename, mime_type, file_size) in (new_images or []):
                result = self.storage.upload(
                    file_bytes    = file_bytes,
                    filename      = filename,
                    folder        = f"products/{product.id}",
                    resource_type = ResourceType.IMAGE,
                    overwrite     = False,
                )
                doc = self.repo.create_image_document(
                    db,
                    product_id  = product.id,
                    filename    = filename,
                    url         = result.url,
                    file_size   = result.file_size,
                    mime_type   = mime_type,
                    uploaded_by = uploaded_by,
                )
                if first_remaining_id is None:
                    first_remaining_id = doc.id

            # Update primary image
            product.primary_document_id = first_remaining_id

        return product

    def activate(self, db: Session, product_no: str) -> Product:
        product = self.get_by_no_or_raise(db, product_no)
        if not guards.can_activate(product):
            raise AppException(
                status_code=400,
                error_code=ErrorCode.INVALID_STATUS_TRANSITION,
                message="Only inactive products can be activated",
            )
        return self.repo.update(db, product, status=ProductStatus.active)

    def deactivate(self, db: Session, product_no: str) -> Product:
        product = self.get_by_no_or_raise(db, product_no)
        if not guards.can_deactivate(product):
            raise AppException(
                status_code=400,
                error_code=ErrorCode.INVALID_STATUS_TRANSITION,
                message="Only active products can be deactivated",
            )
        return self.repo.update(db, product, status=ProductStatus.inactive)