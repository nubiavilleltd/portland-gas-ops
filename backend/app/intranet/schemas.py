from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional
from datetime import datetime
from urllib.parse import urlparse

_HEX_COLOR_RE = r"^#[0-9A-Fa-f]{6}$"
_SAFE_URL_SCHEMES = {"http", "https"}
_AUDIO_EXTS = {".mp3", ".wav", ".ogg", ".aac", ".flac", ".m4a"}
_VIDEO_EXTS = {".mp4", ".webm", ".mov", ".avi", ".mkv"}

def _validate_url(v: Optional[str]) -> Optional[str]:
    """Block javascript:, data:, vbscript: and other dangerous URL schemes."""
    if v is None or v.strip() == "":
        return v
    try:
        scheme = urlparse(v.strip()).scheme.lower()
        if scheme and scheme not in _SAFE_URL_SCHEMES:
            raise ValueError(f"URL scheme '{scheme}' is not allowed")
    except ValueError:
        raise
    except Exception:
        raise ValueError("Invalid URL")
    return v


# ── Category schemas ───────────────────────────────────────────────────────────

class NewsCategoryCreate(BaseModel):
    name:  str = Field(..., min_length=1, max_length=60)
    color: str = Field("#6B7280", max_length=20, pattern=_HEX_COLOR_RE)


class NewsCategoryUpdate(BaseModel):
    name:  Optional[str] = Field(None, min_length=1, max_length=60)
    color: Optional[str] = Field(None, max_length=20, pattern=_HEX_COLOR_RE)


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
    id:              str
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


class SpotlightTagUpdate(BaseModel):
    label: Optional[str] = Field(None, min_length=1, max_length=80)
    color: Optional[str] = Field(None, max_length=20)
    bg:    Optional[str] = Field(None, max_length=20)


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

    @field_validator("virtual_link")
    @classmethod
    def validate_virtual_link(cls, v: Optional[str]) -> Optional[str]:
        return _validate_url(v)


class EventUpdate(BaseModel):
    title:        Optional[str]  = None
    description:  Optional[str]  = None
    event_type:   Optional[str]  = None
    location:     Optional[str]  = None
    virtual_link: Optional[str]  = None
    event_date:   Optional[str]  = None
    color:        Optional[str]  = None
    is_published: Optional[bool] = None

    @field_validator("virtual_link")
    @classmethod
    def validate_virtual_link(cls, v: Optional[str]) -> Optional[str]:
        return _validate_url(v)


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


# ── FAQ category schemas ───────────────────────────────────────────────────────

class FAQCategoryCreate(BaseModel):
    label:      str = Field(..., min_length=1, max_length=80)
    sort_order: int = 0


class FAQCategoryUpdate(BaseModel):
    label:      Optional[str] = Field(None, min_length=1, max_length=80)
    sort_order: Optional[int] = None


class FAQCategoryResponse(BaseModel):
    id:         int
    label:      str
    is_visible: bool
    sort_order: int
    created_at: datetime

    class Config:
        from_attributes = True


# ── FAQ schemas ────────────────────────────────────────────────────────────────

class FAQCreate(BaseModel):
    question:    str  = Field(..., min_length=1)
    answer:      str  = Field(..., min_length=1)
    category:    str  = Field(..., min_length=1, max_length=80)
    order_index: int  = 0
    is_published: bool = True


class FAQUpdate(BaseModel):
    question:    Optional[str]  = None
    answer:      Optional[str]  = None
    category:    Optional[str]  = None
    order_index: Optional[int]  = None
    is_published: Optional[bool] = None


class FAQResponse(BaseModel):
    id:          int
    question:    str
    answer:      str
    category:    str
    order_index: int
    is_published: bool
    created_at:  datetime
    updated_at:  datetime

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


# ── Feedback schemas ───────────────────────────────────────────────────────────

# ── Podcast schemas ────────────────────────────────────────────────────────────

class PodcastCreate(BaseModel):
    episode_number:    int           = Field(..., ge=1)
    title:             str           = Field(..., min_length=1, max_length=255)
    description:       Optional[str] = None
    guest_name:        Optional[str] = Field(None, max_length=200)
    duration:          Optional[str] = Field(None, max_length=30)
    cover_image_id:    Optional[int] = None
    audio_document_id: Optional[int] = None
    embed_url:         Optional[str] = None   # YouTube / Vimeo embed URL
    audio_url:         Optional[str] = None   # External streaming link
    media_type:        str           = Field("audio", pattern="^(audio|video)$")
    is_published:      bool          = False
    is_featured:       bool          = False

    @field_validator("embed_url", "audio_url")
    @classmethod
    def validate_urls(cls, v: Optional[str]) -> Optional[str]:
        return _validate_url(v)

    @model_validator(mode="after")
    def validate_media_type_consistency(self) -> "PodcastCreate":
        url = (self.audio_url or "").lower()
        if url:
            if self.media_type == "audio" and any(url.endswith(ext) for ext in _VIDEO_EXTS):
                raise ValueError("The external link looks like a video file. Switch Podcast Type to Video or provide an audio link.")
            if self.media_type == "video" and any(url.endswith(ext) for ext in _AUDIO_EXTS):
                raise ValueError("The external link looks like an audio file. Switch Podcast Type to Audio or provide a video link.")
        if self.embed_url and self.media_type == "audio":
            raise ValueError("Embed links (YouTube / Vimeo) are for video podcasts. Switch Podcast Type to Video or use an External Link instead.")
        return self


class PodcastUpdate(BaseModel):
    episode_number:    Optional[int]  = None
    title:             Optional[str]  = None
    description:       Optional[str]  = None
    guest_name:        Optional[str]  = None
    duration:          Optional[str]  = None
    cover_image_id:    Optional[int]  = None
    audio_document_id: Optional[int]  = None
    embed_url:         Optional[str]  = None
    audio_url:         Optional[str]  = None
    media_type:        Optional[str]  = None
    is_published:      Optional[bool] = None
    is_featured:       Optional[bool] = None

    @field_validator("embed_url", "audio_url")
    @classmethod
    def validate_urls(cls, v: Optional[str]) -> Optional[str]:
        return _validate_url(v)

    @model_validator(mode="after")
    def validate_media_type_consistency(self) -> "PodcastUpdate":
        url = (self.audio_url or "").lower()
        if url and self.media_type:
            if self.media_type == "audio" and any(url.endswith(ext) for ext in _VIDEO_EXTS):
                raise ValueError("The external link looks like a video file. Switch Podcast Type to Video or provide an audio link.")
            if self.media_type == "video" and any(url.endswith(ext) for ext in _AUDIO_EXTS):
                raise ValueError("The external link looks like an audio file. Switch Podcast Type to Audio or provide a video link.")
        if self.embed_url and self.media_type == "audio":
            raise ValueError("Embed links (YouTube / Vimeo) are for video podcasts. Switch Podcast Type to Video or use an External Link instead.")
        return self


class PodcastResponse(BaseModel):
    id:                int
    episode_number:    int
    title:             str
    description:       Optional[str]
    guest_name:        Optional[str]
    duration:          Optional[str]
    cover_image_id:    Optional[int]
    cover_image_url:   Optional[str]   # resolved via @property from documents join
    audio_document_id: Optional[int]
    audio_file_url:    Optional[str]   # resolved via @property from documents join
    embed_url:         Optional[str]
    audio_url:         Optional[str]
    media_type:        str
    is_published:      bool
    is_featured:       bool
    created_at:        datetime
    updated_at:        datetime

    class Config:
        from_attributes = True


class FeedbackCreate(BaseModel):
    category:     str  = Field(..., min_length=1, max_length=80)
    subject:      str  = Field(..., min_length=1, max_length=200)
    message:      str  = Field(..., min_length=1)
    is_anonymous: bool = False


class FeedbackStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(open|in_review|resolved|closed)$")


class FeedbackResponse(BaseModel):
    id:                int
    submitted_by_id:   Optional[str]
    submitted_by_name: Optional[str]
    submitted_by_dept: Optional[str]
    category:          str
    subject:           str
    message:           str
    is_anonymous:      bool
    status:            str
    resolved_by_id:    Optional[str]
    resolved_at:       Optional[datetime]
    created_at:        datetime

    class Config:
        from_attributes = True
