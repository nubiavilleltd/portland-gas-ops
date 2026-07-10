import time
import bleach
from datetime import datetime, timezone
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, UploadFile

from app.intranet.models import IntranetNews, IntranetNewsCategory
from app.intranet.schemas import NewsCreate, NewsUpdate, NewsCategoryCreate
from app.shared.models.document import Document
from app.shared.services import cloudinary_service


# ── HTML sanitisation ──────────────────────────────────────────────────────────
# Allowlist of tags TipTap can produce. script/style/iframe are NOT in this list
# so any injected markup is stripped before it ever reaches the database.

_ALLOWED_TAGS = [
    "p", "br", "strong", "b", "em", "i", "u", "s", "del", "mark",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li",
    "blockquote", "code", "pre",
    "a", "hr", "span",
]

_ALLOWED_ATTRS: dict = {
    "a":    ["href", "target", "rel"],
    "span": ["style"],   # TipTap uses inline style for text colour/highlight
    "p":    ["style"],
}

def _sanitize_body(html: str) -> str:
    """Strip dangerous HTML while preserving all TipTap formatting."""
    return bleach.clean(
        html,
        tags=_ALLOWED_TAGS,
        attributes=_ALLOWED_ATTRS,
        strip=True,          # remove disallowed tags entirely (don't escape)
        strip_comments=True,
    )


# ── Category service ───────────────────────────────────────────────────────────

class IntranetNewsCategoryService:

    def __init__(self, db: Session):
        self.db = db

    def list_all(self) -> list[IntranetNewsCategory]:
        return self.db.query(IntranetNewsCategory).order_by(IntranetNewsCategory.name).all()

    def create(self, data: NewsCategoryCreate) -> IntranetNewsCategory:
        existing = self.db.query(IntranetNewsCategory).filter(
            IntranetNewsCategory.name == data.name
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="A category with this name already exists")
        cat = IntranetNewsCategory(name=data.name, color=data.color)
        self.db.add(cat)
        self.db.flush()
        return cat

    def delete(self, category_id: int) -> None:
        cat = self.db.query(IntranetNewsCategory).filter(IntranetNewsCategory.id == category_id).first()
        if not cat:
            raise HTTPException(status_code=404, detail="Category not found")
        self.db.delete(cat)


# ── News service ───────────────────────────────────────────────────────────────

class IntranetNewsService:

    def __init__(self, db: Session):
        self.db = db

    # ── Helpers ────────────────────────────────────────────────────────────────

    def _base_query(self):
        """Base query with cover_image eagerly loaded to avoid lazy-load outside session."""
        return self.db.query(IntranetNews).options(joinedload(IntranetNews.cover_image))

    def _get_or_404(self, news_id: int) -> IntranetNews:
        item = self._base_query().filter(IntranetNews.id == news_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="News article not found")
        return item

    # ── Public (intranet home page) ────────────────────────────────────────────

    def list_published(self) -> list[IntranetNews]:
        return (
            self._base_query()
            .filter(IntranetNews.is_published == True)
            .order_by(IntranetNews.published_at.desc())
            .all()
        )

    def get_published(self, news_id: int) -> IntranetNews:
        item = self._get_or_404(news_id)
        if not item.is_published:
            raise HTTPException(status_code=404, detail="News article not found")
        return item

    # ── Admin ──────────────────────────────────────────────────────────────────

    def list_all(self) -> list[IntranetNews]:
        return (
            self._base_query()
            .order_by(IntranetNews.created_at.desc())
            .all()
        )

    def create(self, data: NewsCreate, created_by: str | None = None) -> IntranetNews:
        item = IntranetNews(
            title=data.title,
            body=_sanitize_body(data.body),
            category=data.category,
            cover_image_id=data.cover_image_id,
            author_name=data.author_name,
            created_by=created_by,
            is_published=data.is_published,
            published_at=data.published_at or (datetime.now(timezone.utc) if data.is_published else None),
        )
        self.db.add(item)
        self.db.flush()
        return item

    def update(self, news_id: int, data: NewsUpdate) -> IntranetNews:
        item = self._get_or_404(news_id)
        patch = data.model_dump(exclude_unset=True)
        if "body" in patch:
            patch["body"] = _sanitize_body(patch["body"])
        for field, value in patch.items():
            setattr(item, field, value)
        return item

    def delete(self, news_id: int) -> None:
        item = self._get_or_404(news_id)
        self.db.delete(item)

    def toggle_published(self, news_id: int) -> IntranetNews:
        item = self._get_or_404(news_id)
        item.is_published = not item.is_published
        if item.is_published and not item.published_at:
            item.published_at = datetime.now(timezone.utc)
        return item

    # ── Cover image upload ─────────────────────────────────────────────────────

    def upload_cover_image_file(
        self,
        file: UploadFile,
        uploaded_by: str | None = None,
    ) -> Document:
        """Upload a file to Cloudinary and create a Document row. Returns the Document."""
        file_bytes = file.file.read()  # router already seeked to 0 after size check
        filename   = file.filename or f"cover_{int(time.time())}"
        url = cloudinary_service.upload(
            file_bytes,
            public_id=f"intranet-news/cover_{int(time.time())}",
            folder="portland-gas/intranet",
            resource_type="image",
        )
        doc = Document(
            type="file",
            name=filename,
            category="intranet",
            file_path=url,
            file_size=len(file_bytes),
            mime_type=file.content_type,
            uploaded_by=uploaded_by,
        )
        self.db.add(doc)
        self.db.flush()
        return doc

    def upload_cover_image_from_url(
        self,
        image_url: str,
        uploaded_by: str | None = None,
    ) -> Document:
        """Fetch an external URL into Cloudinary and create a Document row. Returns the Document."""
        url = cloudinary_service.upload(
            image_url,                          # Cloudinary accepts URL strings directly
            public_id=f"intranet-news/cover_{int(time.time())}",
            folder="portland-gas/intranet",
            resource_type="image",
        )
        doc = Document(
            type="file",
            name=image_url.split("/")[-1][:255] or "cover_image",
            category="intranet",
            file_path=url,
            file_size=None,
            mime_type="image/*",
            uploaded_by=uploaded_by,
        )
        self.db.add(doc)
        self.db.flush()
        return doc
