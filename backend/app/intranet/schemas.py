from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

# Valid color keys — map to Tailwind-safe classes on the frontend
NEWS_CATEGORY_COLORS = ["purple", "yellow", "gray", "red", "blue", "green", "teal", "orange"]


# ── Category schemas ───────────────────────────────────────────────────────────

class NewsCategoryCreate(BaseModel):
    name:  str = Field(..., min_length=1, max_length=60)
    color: str = Field("gray", description=f"One of: {', '.join(NEWS_CATEGORY_COLORS)}")


class NewsCategoryResponse(BaseModel):
    id:         int
    name:       str
    color:      str
    created_at: datetime

    class Config:
        from_attributes = True


# ── News schemas ───────────────────────────────────────────────────────────────

class NewsCreate(BaseModel):
    title:          str           = Field(..., min_length=1, max_length=255)
    body:           str           = Field(..., min_length=1)
    category:       str           = Field(..., min_length=1, max_length=60)
    cover_image_id: Optional[int] = None
    author_name:    str           = Field(..., min_length=1, max_length=200)
    is_published:   bool          = False
    published_at:   Optional[datetime] = None


class NewsUpdate(BaseModel):
    title:          Optional[str]      = None
    body:           Optional[str]      = None
    category:       Optional[str]      = None
    cover_image_id: Optional[int]      = None
    author_name:    Optional[str]      = None
    is_published:   Optional[bool]     = None
    published_at:   Optional[datetime] = None


class NewsResponse(BaseModel):
    id:              int
    title:           str
    body:            str
    category:        str
    cover_image_id:  Optional[int]
    cover_image_url: Optional[str]   # resolved from documents join via @property
    author_name:     str
    is_published:    bool
    published_at:    Optional[datetime]
    created_at:      datetime
    updated_at:      datetime

    class Config:
        from_attributes = True


# ── Upload image response ──────────────────────────────────────────────────────

class ImageUploadResponse(BaseModel):
    id:  int    # documents.id  — store as cover_image_id
    url: str    # Cloudinary URL — for preview
