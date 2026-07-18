from __future__ import annotations

from typing import Optional

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.products.model import Product
from app.shared.models.document import Document
from app.shared.utils.number_generator import generate_entity_no


class ProductRepository:

    def generate_product_no(self, db: Session) -> str:
        return generate_entity_no(db, Product, "product_no", "PRO")

    def get_by_id(self, db: Session, product_id: str) -> Product | None:
        return db.query(Product).filter(Product.id == product_id).first()

    def get_by_no(self, db: Session, product_no: str) -> Product | None:
        return db.query(Product).filter(Product.product_no == product_no).first()

    def get_by_name(self, db: Session, name: str) -> Product | None:
        return (
            db.query(Product)
            .filter(func.lower(Product.name) == name.lower().strip())
            .first()
        )

    def get_by_code(self, db: Session, code: str) -> Product | None:
        return (
            db.query(Product)
            .filter(func.upper(Product.code) == code.upper().strip())
            .first()
        )

    def list(
        self,
        db: Session,
        search: str | None = None,
        product_type: str | None = None,
        status: str | None = None,
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[list[Product], int]:
        q = db.query(Product)

        if search:
            term = f"%{search.strip()}%"
            q = q.filter(
                or_(
                    Product.product_no.ilike(term),
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
            q.order_by(
                Product.created_at.desc(),
                Product.id.desc(),
            )
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        return items, total

    def create(
        self,
        db: Session,
        product_no: str,
        **fields,
    ) -> Product:
        product = Product(product_no=product_no, **fields)
        db.add(product)
        db.flush()
        return product

    def update(
        self,
        db: Session,
        product: Product,
        **fields,
    ) -> Product:
        for key, value in fields.items():
            if value is not None:
                setattr(product, key, value)

        db.flush()
        return product

    # ── Image helpers ───────────────────────────────────────────

    def get_product_images(
        self,
        db: Session,
        product_id: str,
    ) -> list[Document]:
        return (
            db.query(Document)
            .filter(
                Document.category == f"product:{product_id}",
                Document.type == "file",
            )
            .order_by(Document.created_at.asc())
            .all()
        )

    def create_image_document(
        self,
        db: Session,
        product_id: str,
        filename: str,
        url: str,
        file_size: int,
        mime_type: str,
        uploaded_by: str | None = None,
    ) -> Document:
        doc = Document(
            type="file",
            name=filename,
            category=f"product:{product_id}",
            file_path=url,
            file_size=file_size,
            mime_type=mime_type,
            uploaded_by=uploaded_by,
            parent_id=None,
        )

        db.add(doc)
        db.flush()
        return doc

    def delete_image_document(
        self,
        db: Session,
        doc_id: int,
    ) -> None:
        doc = (
            db.query(Document)
            .filter(Document.id == doc_id)
            .first()
        )

        if doc:
            db.delete(doc)
            db.flush()