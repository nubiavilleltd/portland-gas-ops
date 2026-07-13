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


# ── Leadership message schemas ─────────────────────────────────────────────────

class LeadershipCreate(BaseModel):
    author_id:   Optional[str] = None
    author_name: str           = Field(..., min_length=1, max_length=200)
    author_role: Optional[str] = Field(None, max_length=200)
    author_dept: Optional[str] = Field(None, max_length=200)
    avatar_url:  Optional[str] = None
    title:       str           = Field(..., min_length=1, max_length=200)
    body:        str           = Field(..., min_length=1)
    is_published: bool         = False
    sort_order:  int           = 0


class LeadershipUpdate(BaseModel):
    author_id:    Optional[str]  = None
    author_name:  Optional[str]  = None
    author_role:  Optional[str]  = None
    author_dept:  Optional[str]  = None
    avatar_url:   Optional[str]  = None
    title:        Optional[str]  = None
    body:         Optional[str]  = None
    is_published: Optional[bool] = None
    sort_order:   Optional[int]  = None


class LeadershipResponse(BaseModel):
    id:           int
    author_id:    Optional[str]
    author_name:  str
    author_role:  Optional[str]
    author_dept:  Optional[str]
    avatar_url:   Optional[str]
    title:        str
    body:         str
    is_published: bool
    published_at: Optional[datetime]
    sort_order:   int
    created_at:   datetime
    updated_at:   datetime

    class Config:
        from_attributes = True


# ── Spotlight tag schemas ──────────────────────────────────────────────────────

class SpotlightTagCreate(BaseModel):
    label: str = Field(..., min_length=1, max_length=80)
    color: str = Field(..., max_length=20)   # hex text colour
    bg:    str = Field(..., max_length=20)   # hex background colour


class SpotlightTagResponse(BaseModel):
    id:         int
    label:      str
    color:      str
    bg:         str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Event schemas ──────────────────────────────────────────────────────────────

class EventCreate(BaseModel):
    title:        str            = Field(..., min_length=1, max_length=255)
    description:  Optional[str] = None
    event_type:   str            = Field(..., min_length=1, max_length=40)
    location:     Optional[str] = Field(None, max_length=200)
    virtual_link: Optional[str] = Field(None, max_length=500)
    event_date:   str            = Field(..., min_length=10, max_length=10)  # YYYY-MM-DD
    color:        str            = Field("#7234BD", max_length=10)
    is_published: bool           = False


class EventUpdate(BaseModel):
    title:        Optional[str]  = None
    description:  Optional[str]  = None
    event_type:   Optional[str]  = None
    location:     Optional[str]  = None
    virtual_link: Optional[str]  = None
    event_date:   Optional[str]  = None
    color:        Optional[str]  = None
    is_published: Optional[bool] = None


class EventResponse(BaseModel):
    id:           int
    title:        str
    description:  Optional[str]
    event_type:   str
    location:     Optional[str]
    virtual_link: Optional[str]
    event_date:   str
    color:        str
    is_published: bool
    created_at:   datetime
    updated_at:   datetime

    class Config:
        from_attributes = True


# ── Spotlight schemas (covers EOM + spotlight cards) ───────────────────────────

class SpotlightCreate(BaseModel):
    employee_id:   Optional[str] = None
    employee_name: str           = Field(..., min_length=1, max_length=200)
    employee_role: Optional[str] = Field(None, max_length=200)
    employee_dept: Optional[str] = Field(None, max_length=200)
    avatar_url:    Optional[str] = None
    title:         str           = Field(..., min_length=1, max_length=150)
    message:       str           = Field(..., min_length=1)
    category:      str           = Field(..., min_length=1, max_length=40)
    month:         Optional[int] = None
    year:          Optional[int] = None
    tag:           Optional[str] = Field(None, max_length=80)
    tag_color:     Optional[str] = Field(None, max_length=20)
    tag_bg:        Optional[str] = Field(None, max_length=20)
    is_published:  bool          = False


class SpotlightUpdate(BaseModel):
    employee_id:   Optional[str]  = None
    employee_name: Optional[str]  = None
    employee_role: Optional[str]  = None
    employee_dept: Optional[str]  = None
    avatar_url:    Optional[str]  = None
    title:         Optional[str]  = None
    message:       Optional[str]  = None
    category:      Optional[str]  = None
    month:         Optional[int]  = None
    year:          Optional[int]  = None
    tag:           Optional[str]  = None
    tag_color:     Optional[str]  = None
    tag_bg:        Optional[str]  = None
    is_published:  Optional[bool] = None


class SpotlightResponse(BaseModel):
    id:            int
    employee_id:   Optional[str]
    employee_name: str
    employee_role: Optional[str]
    employee_dept: Optional[str]
    avatar_url:    Optional[str]
    title:         str
    message:       str
    category:      str
    month:         Optional[int]
    year:          Optional[int]
    tag:           Optional[str]
    tag_color:     Optional[str]
    tag_bg:        Optional[str]
    is_published:  bool
    published_at:  Optional[datetime]
    created_at:    datetime

    class Config:
        from_attributes = True
