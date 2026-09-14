from __future__ import annotations

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import AppException
from app.products import guards
from app.products.enums import InventoryTracking, ProductStatus
from app.products.error_codes import ProductErrorCode
from app.products.model import Product
from app.products.repository import ProductRepository
from app.products.schema import (
    ProductCreate,
    ProductFilters,
    ProductImageResponse,
    ProductUpdate,
    ProductPickerResponse,
    ProductResponse,
)
from app.shared.services.cloudinary_service import (
    ResourceType,
    get_storage_service,
)


class ProductService:

    def __init__(self):
        self.repo = ProductRepository()
        self.storage = get_storage_service()

    # ─────────────────────────────────────────────────────────────
    # Retrieval
    # ─────────────────────────────────────────────────────────────

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

    def list(
        self,
        db: Session,
        filters: ProductFilters,
    ) -> tuple[list[Product], int]:
        return self.repo.list(
            db,
            search=filters.search,
            inventory_tracking=(
                filters.inventory_tracking.value
                if filters.inventory_tracking
                else None
            ),
            status=filters.status.value if filters.status else None,
            page=filters.page,
            page_size=filters.page_size,
        )

    def list_for_picker(
        self,
        db: Session,
        filters: ProductFilters,
    ):
        """
        Returns products enriched with inventory availability for the
        Product Picker.

        NOTE: the availability shape here is still the old
        physical/committed/available triple. It will be replaced in a
        later step with the new total/available/reserved/sold model.
        """

        from app.inventory.service import InventoryService

        products, total = self.list(db=db, filters=filters)

        inventory_service = InventoryService()

        items: list[ProductPickerResponse] = []

        for product in products:

            availability = inventory_service.get_product_availability(
                db=db,
                product=product,
            )

            images = self.get_images(db, product)

            data = ProductResponse.model_validate(product).model_dump()
            data["images"] = images

            item = ProductPickerResponse(
                **data,
                physical_quantity=availability.physical_quantity,
                committed_quantity=availability.committed_quantity,
                available_quantity=availability.available_quantity,
                is_orderable=availability.available_quantity > 0,
            )

            items.append(item)

        return items, total

    def get_images(
        self,
        db: Session,
        product: Product,
    ) -> list[ProductImageResponse]:
        docs = self.repo.get_product_images(db, product.id)

        return [
            ProductImageResponse(
                id=str(doc.id),
                url=doc.file_path or "",
                name=doc.name,
            )
            for doc in docs
        ]

    # ─────────────────────────────────────────────────────────────
    # Create
    # ─────────────────────────────────────────────────────────────

    def create(
        self,
        db: Session,
        data: ProductCreate,
        image_files: list[tuple[bytes, str, str, int]],
        uploaded_by: str | None = None,
    ) -> Product:

        self._ensure_unique_name(db, data.name)
        self._ensure_unique_code(db, data.code)
        self._ensure_unique_tag_prefix(db, data.tag_prefix)

        try:
            with db.begin_nested():

                product = self.repo.create(
                    db,
                    product_no=self.repo.generate_product_no(db),
                    name=data.name,
                    code=data.code,
                    tag_prefix=data.tag_prefix,
                    description=data.description,
                    inventory_tracking=data.inventory_tracking,
                    category_id=data.category_id,
                    unit_id=data.unit_id,
                    default_unit_price=data.default_unit_price,
                    minimum_stock=data.minimum_stock,
                )

                primary_doc_id = self._upload_images(
                    db=db,
                    product=product,
                    images=image_files,
                    uploaded_by=uploaded_by,
                )

                if primary_doc_id:
                    self.repo.update(
                        db,
                        product,
                        primary_document_id=primary_doc_id,
                    )

            return product

        except IntegrityError:
            raise AppException(
                status_code=409,
                error_code=ProductErrorCode.PRODUCT_NAME_ALREADY_EXISTS,
                message="A product with this name, code, or tag prefix already exists",
            )

    # ─────────────────────────────────────────────────────────────
    # Update
    # ─────────────────────────────────────────────────────────────

    def update(
        self,
        db: Session,
        product_id: str,
        data: ProductUpdate,
        new_images: list[tuple[bytes, str, str, int]] | None = None,
        kept_image_ids: list[str] | None = None,
        primary_image_id: str | None = None,
        uploaded_by: str | None = None,
    ) -> Product:

        product = self.get_or_raise(db, product_id)

        if data.name and data.name.lower() != product.name.lower():
            self._ensure_unique_name(db, data.name)

        if data.code and data.code != product.code:
            self._ensure_unique_code(db, data.code)

        if data.tag_prefix and data.tag_prefix != product.tag_prefix:
            self._ensure_unique_tag_prefix(db, data.tag_prefix)

        # NOTE: immutability rules for tag_prefix and inventory_tracking
        # will be enforced in a later step, once inventory existence can
        # be checked without a circular import.

        updates = data.model_dump(exclude_unset=True)

        product = self.repo.update(
            db,
            product,
            **updates,
        )

        if new_images is not None or kept_image_ids is not None:

            existing_docs = self.repo.get_product_images(db, product.id)
            kept = set(kept_image_ids or [])

            for doc in existing_docs:
                if str(doc.id) not in kept:
                    self.repo.delete_image_document(db, doc.id)

            uploaded_primary = self._upload_images(
                db=db,
                product=product,
                images=new_images or [],
                uploaded_by=uploaded_by,
            )

            if primary_image_id:
                primary_doc_id = int(primary_image_id)
            else:
                primary_doc_id = uploaded_primary

            self.repo.update(
                db,
                product,
                primary_document_id=primary_doc_id,
            )

        return product

    # ─────────────────────────────────────────────────────────────
    # Status
    # ─────────────────────────────────────────────────────────────

    def activate(
        self,
        db: Session,
        product_id: str,
    ) -> Product:

        product = self.get_or_raise(db, product_id)

        if not guards.can_activate(product):
            raise AppException(
                status_code=400,
                error_code=ProductErrorCode.PRODUCT_ALREADY_ACTIVE,
                message="Product is already active",
            )

        return self.repo.update(
            db,
            product,
            status=ProductStatus.active,
        )

    def deactivate(
        self,
        db: Session,
        product_id: str,
    ) -> Product:

        product = self.get_or_raise(db, product_id)

        if not guards.can_deactivate(product):
            raise AppException(
                status_code=400,
                error_code=ProductErrorCode.PRODUCT_ALREADY_INACTIVE,
                message="Product is already inactive",
            )

        return self.repo.update(
            db,
            product,
            status=ProductStatus.inactive,
        )

    # ─────────────────────────────────────────────────────────────
    # Private helpers
    # ─────────────────────────────────────────────────────────────

    def _ensure_unique_name(
        self,
        db: Session,
        name: str,
    ) -> None:

        if self.repo.get_by_name(db, name):
            raise AppException(
                status_code=409,
                error_code=ProductErrorCode.PRODUCT_NAME_ALREADY_EXISTS,
                message=f"A product named '{name}' already exists",
                details={"field": "name"},
            )

    def _ensure_unique_code(
        self,
        db: Session,
        code: str | None,
    ) -> None:

        if code and self.repo.get_by_code(db, code):
            raise AppException(
                status_code=409,
                error_code=ProductErrorCode.PRODUCT_CODE_ALREADY_EXISTS,
                message=f"Product code '{code}' is already in use",
                details={"field": "code"},
            )

    def _ensure_unique_tag_prefix(
        self,
        db: Session,
        tag_prefix: str | None,
    ) -> None:

        if tag_prefix and self.repo.get_by_tag_prefix(db, tag_prefix):
            raise AppException(
                status_code=409,
                error_code=ProductErrorCode.PRODUCT_CODE_ALREADY_EXISTS,
                message=f"Tag prefix '{tag_prefix}' is already in use",
                details={"field": "tag_prefix"},
            )

    def _upload_images(
        self,
        *,
        db: Session,
        product: Product,
        images: list[tuple[bytes, str, str, int]],
        uploaded_by: str | None,
    ) -> int | None:

        first_doc_id = None

        for file_bytes, filename, mime_type, file_size in images:

            result = self.storage.upload(
                file_bytes=file_bytes,
                filename=filename,
                folder=f"products/{product.id}",
                resource_type=ResourceType.IMAGE,
                overwrite=False,
            )

            doc = self.repo.create_image_document(
                db=db,
                product_id=product.id,
                filename=filename,
                url=result.url,
                file_size=result.file_size,
                mime_type=mime_type,
                uploaded_by=uploaded_by,
            )

            if first_doc_id is None:
                first_doc_id = doc.id

        return first_doc_id