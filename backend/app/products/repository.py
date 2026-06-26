from __future__ import annotations

from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Optional, List, Tuple

from app.products.model import Product
from app.products.enums import ProductStatus
from app.models.document import Document


class ProductRepository:

    def get_by_id(self, db: Session, product_id: str) -> Optional[Product]:
        return db.query(Product).filter(Product.id == product_id).first()

    def get_by_name(self, db: Session, name: str) -> Optional[Product]:
        return db.query(Product).filter(
            func.lower(Product.name) == name.lower().strip()
        ).first()

    def get_by_code(self, db: Session, code: str) -> Optional[Product]:
        return db.query(Product).filter(
            func.upper(Product.code) == code.upper().strip()
        ).first()

    def list(
        self,
        db:           Session,
        search:       Optional[str] = None,
        product_type: Optional[str] = None,
        status:       Optional[str] = None,
        page:         int = 1,
        page_size:    int = 50,
    ) -> Tuple[List[Product], int]:
        q = db.query(Product)

        if search:
            term = f"%{search.strip()}%"
            q = q.filter(
                or_(
                    Product.name.ilike(term),
                    Product.description.ilike(term),
                    Product.code.ilike(term),
                )
            )
        if product_type:
            q = q.filter(Product.product_type == product_type)
        if status:
            q = q.filter(Product.status == status)

        total = q.with_entities(func.count(Product.id)).scalar() or 0
        items = (
            q.order_by(Product.name)
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
        return items, total

    def create(self, db: Session, **fields) -> Product:
        product = Product(**fields)
        db.add(product)
        db.flush()
        return product

    def update(self, db: Session, product: Product, **fields) -> Product:
        for key, value in fields.items():
            setattr(product, key, value)
        db.flush()
        return product

    # ── Image / document helpers ──────────────────────────────────────────────

    def get_product_images(self, db: Session, product_id: str) -> List[Document]:
        return (
            db.query(Document)
            .filter(
                Document.category == f"product:{product_id}",
                Document.type == "file",
            )
            .order_by(Document.created_at)
            .all()
        )

    def create_image_document(
        self,
        db:          Session,
        product_id:  str,
        filename:    str,
        url:         str,
        file_size:   int,
        mime_type:   str,
        uploaded_by: Optional[str] = None,
    ) -> Document:
        doc = Document(
            type        = "file",
            name        = filename,
            category    = f"product:{product_id}",
            file_path   = url,
            file_size   = file_size,
            mime_type   = mime_type,
            uploaded_by = uploaded_by,
            parent_id   = None,
        )
        db.add(doc)
        db.flush()
        return doc

    def delete_image_document(self, db: Session, doc_id: int) -> None:
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if doc:
            db.delete(doc)
            db.flush()