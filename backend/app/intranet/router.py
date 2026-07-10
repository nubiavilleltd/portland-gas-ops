"""
Intranet router — /api/intranet

Category endpoints:
  GET    /news/categories/              list all categories
  POST   /news/categories/              create category (admin)
  DELETE /news/categories/{id}          delete category (admin)

Cover image upload endpoints (must come before /news/{id}):
  POST   /news/upload-image/            upload file → Cloudinary → documents → {id, url}
  POST   /news/upload-image-from-url/   fetch URL → Cloudinary → documents → {id, url}

News endpoints:
  GET    /news/              list published articles (intranet home page)
  GET    /news/admin/        list all articles including drafts (admin)
  GET    /news/{id}          single published article
  POST   /news/              create article (admin)
  PATCH  /news/{id}          update article (admin)
  DELETE /news/{id}          delete article (admin)
  PATCH  /news/{id}/publish  toggle published status (admin)
"""

from fastapi import APIRouter, Depends, File, UploadFile, status, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.shared.dependencies import get_current_user, login_required, require_admin
from app.shared.models.user import User
from app.employees.service import get_employee_by_user_id
from app.intranet.schemas import (
    NewsCreate, NewsUpdate, NewsResponse,
    NewsCategoryCreate, NewsCategoryResponse,
    ImageUploadResponse,
)
from app.intranet.service import IntranetNewsService, IntranetNewsCategoryService

router = APIRouter()


def _news_svc(db: Session) -> IntranetNewsService:
    return IntranetNewsService(db)

def _cat_svc(db: Session) -> IntranetNewsCategoryService:
    return IntranetNewsCategoryService(db)

def _employee_id(current_user: User, db: Session) -> str | None:
    try:
        return get_employee_by_user_id(current_user.id, db).id
    except Exception:
        return None


# ── Category endpoints — must come before /news/{id} ──────────────────────────

@router.get("/news/categories/", response_model=List[NewsCategoryResponse])
def list_news_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(login_required),
):
    return _cat_svc(db).list_all()


@router.post("/news/categories/", response_model=NewsCategoryResponse, status_code=status.HTTP_201_CREATED)
def create_news_category(
    data: NewsCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    cat = _cat_svc(db).create(data)
    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/news/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_news_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    _cat_svc(db).delete(category_id)
    db.commit()


# ── Upload endpoints — must come before /news/{id} ────────────────────────────

@router.post("/news/upload-image/", response_model=ImageUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_news_cover_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Upload a file (JPG/PNG/WebP) → Cloudinary → documents table. Returns {id, url}."""
    if file.content_type not in _ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=422, detail="Only JPG, PNG, WebP, or GIF images are allowed.")
    contents = await file.read()
    if len(contents) > _MAX_IMAGE_BYTES:
        raise HTTPException(status_code=422, detail="Image must be 5 MB or smaller.")
    await file.seek(0)  # reset so service can read again
    emp_id = _employee_id(current_user, db)
    doc = _news_svc(db).upload_cover_image_file(file, uploaded_by=emp_id)
    db.commit()
    db.refresh(doc)
    return ImageUploadResponse(id=doc.id, url=doc.file_path)


_ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
_MAX_IMAGE_BYTES = 5 * 1024 * 1024  # 5 MB


class UploadFromUrlBody(BaseModel):
    url: str

    @field_validator("url")
    @classmethod
    def must_be_https(cls, v: str) -> str:
        v = v.strip()
        if not v.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        return v


@router.post("/news/upload-image-from-url/", response_model=ImageUploadResponse, status_code=status.HTTP_201_CREATED)
def upload_news_cover_image_from_url(
    body: UploadFromUrlBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Fetch an external image URL into Cloudinary → documents table. Returns {id, url}."""
    emp_id = _employee_id(current_user, db)
    doc = _news_svc(db).upload_cover_image_from_url(body.url, uploaded_by=emp_id)
    db.commit()
    db.refresh(doc)
    return ImageUploadResponse(id=doc.id, url=doc.file_path)


# ── Public endpoints (any authenticated user) ──────────────────────────────────

@router.get("/news/", response_model=List[NewsResponse])
def list_published_news(
    db: Session = Depends(get_db),
    current_user: User = Depends(login_required),
):
    return _news_svc(db).list_published()


@router.get("/news/{news_id}", response_model=NewsResponse)
def get_news_article(
    news_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(login_required),
):
    return _news_svc(db).get_published(news_id)


# ── Admin endpoints ────────────────────────────────────────────────────────────

@router.get("/news/admin/", response_model=List[NewsResponse])
def list_all_news(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return _news_svc(db).list_all()


@router.post("/news/", response_model=NewsResponse, status_code=status.HTTP_201_CREATED)
def create_news(
    data: NewsCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    emp_id = _employee_id(current_user, db)
    item = _news_svc(db).create(data, created_by=emp_id)
    db.commit()
    db.refresh(item)
    # Reload with eager-loaded relationship so cover_image_url @property resolves
    return _news_svc(db)._get_or_404(item.id)


@router.patch("/news/{news_id}", response_model=NewsResponse)
def update_news(
    news_id: int,
    data: NewsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    _news_svc(db).update(news_id, data)
    db.commit()
    return _news_svc(db)._get_or_404(news_id)


@router.delete("/news/{news_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_news(
    news_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    _news_svc(db).delete(news_id)
    db.commit()


@router.patch("/news/{news_id}/publish", response_model=NewsResponse)
def toggle_news_published(
    news_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    _news_svc(db).toggle_published(news_id)
    db.commit()
    return _news_svc(db)._get_or_404(news_id)
