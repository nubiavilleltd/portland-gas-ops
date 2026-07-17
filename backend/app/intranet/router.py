"""
Intranet router — /api/intranet

News:
  GET/POST/PATCH/DELETE /news/...         (see below)

Events:
  GET    /events/              list published events
  GET    /events/admin/        list all events (admin)
  GET    /events/{id}          single published event
  POST   /events/              create (admin)
  PATCH  /events/{id}          update (admin)
  DELETE /events/{id}          delete (admin)
  PATCH  /events/{id}/publish  toggle published (admin)

Spotlight (EOM + spotlight cards):
  GET    /spotlight/           list all published (any auth)
  GET    /spotlight/admin/     list all (admin)
  POST   /spotlight/           create (admin)
  PATCH  /spotlight/{id}       update (admin)
  DELETE /spotlight/{id}       delete (admin)
  PATCH  /spotlight/{id}/publish toggle published (admin)
"""

from fastapi import APIRouter, Depends, File, UploadFile, status, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.shared.dependencies import get_current_user, login_required, require_admin
from app.shared.models.user import User
from app.shared.models.approval import NotificationType
from app.shared.services import notification_service
from app.employees.service import get_employee_by_user_id
from app.intranet.schemas import (
    NewsCreate, NewsUpdate, NewsResponse,
    NewsCategoryCreate, NewsCategoryUpdate, NewsCategoryResponse,
    ImageUploadResponse,
    EventCreate, EventUpdate, EventResponse,
    SpotlightCreate, SpotlightUpdate, SpotlightResponse,
    SpotlightTagCreate, SpotlightTagUpdate, SpotlightTagResponse,
    LeadershipCreate, LeadershipUpdate, LeadershipResponse,
    FAQCreate, FAQUpdate, FAQResponse,
    FAQCategoryCreate, FAQCategoryUpdate, FAQCategoryResponse,
    FeedbackCreate, FeedbackStatusUpdate, FeedbackResponse,
    PodcastCreate, PodcastUpdate, PodcastResponse,
)
from app.intranet.service import (
    IntranetNewsService, IntranetNewsCategoryService,
    IntranetEventService, IntranetSpotlightService,
    IntranetSpotlightTagService, IntranetLeadershipService,
    IntranetFAQService, IntranetFAQCategoryService,
    IntranetFeedbackService, IntranetPodcastService,
)

router = APIRouter()


def _news_svc(db: Session) -> IntranetNewsService:
    return IntranetNewsService(db)

def _cat_svc(db: Session) -> IntranetNewsCategoryService:
    return IntranetNewsCategoryService(db)

def _event_svc(db: Session) -> IntranetEventService:
    return IntranetEventService(db)

def _spotlight_svc(db: Session) -> IntranetSpotlightService:
    return IntranetSpotlightService(db)

def _tag_svc(db: Session) -> IntranetSpotlightTagService:
    return IntranetSpotlightTagService(db)

def _leadership_svc(db: Session) -> IntranetLeadershipService:
    return IntranetLeadershipService(db)

def _faq_svc(db: Session) -> IntranetFAQService:
    return IntranetFAQService(db)

def _faq_cat_svc(db: Session) -> IntranetFAQCategoryService:
    return IntranetFAQCategoryService(db)

def _employee_id(current_user: User, db: Session) -> str | None:
    try:
        return get_employee_by_user_id(current_user.id, db).id
    except Exception:
        return None


# ── Category endpoints — must come before /news/{id} ──────────────────────────

@router.get("/news/categories", response_model=List[NewsCategoryResponse])
def list_news_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(login_required),
):
    return _cat_svc(db).list_all()


@router.post("/news/categories", response_model=NewsCategoryResponse, status_code=status.HTTP_201_CREATED)
def create_news_category(
    data: NewsCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    cat = _cat_svc(db).create(data)
    db.commit()
    db.refresh(cat)
    return cat


@router.patch("/news/categories/{category_id}", response_model=NewsCategoryResponse)
def update_news_category(
    category_id: int,
    data: NewsCategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    cat = _cat_svc(db).update(category_id, data)
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

@router.post("/news/upload-image", response_model=ImageUploadResponse, status_code=status.HTTP_201_CREATED)
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


@router.post("/news/upload-image-from-url", response_model=ImageUploadResponse, status_code=status.HTTP_201_CREATED)
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

@router.get("/news", response_model=List[NewsResponse])
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

@router.get("/news/admin", response_model=List[NewsResponse])
def list_all_news(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return _news_svc(db).list_all()


@router.post("/news", response_model=NewsResponse, status_code=status.HTTP_201_CREATED)
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


# ── Event endpoints ────────────────────────────────────────────────────────────

@router.get("/events", response_model=List[EventResponse])
def list_published_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(login_required),
):
    return _event_svc(db).list_published()


@router.get("/events/admin", response_model=List[EventResponse])
def list_all_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return _event_svc(db).list_all()


@router.get("/events/{event_id}", response_model=EventResponse)
def get_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(login_required),
):
    return _event_svc(db).get_published(event_id)


@router.post("/events", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    data: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    item = _event_svc(db).create(data)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/events/{event_id}", response_model=EventResponse)
def update_event(
    event_id: int,
    data: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    _event_svc(db).update(event_id, data)
    db.commit()
    return _event_svc(db)._get_or_404(event_id)


@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    _event_svc(db).delete(event_id)
    db.commit()


@router.patch("/events/{event_id}/publish", response_model=EventResponse)
def toggle_event_published(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    _event_svc(db).toggle_published(event_id)
    db.commit()
    return _event_svc(db)._get_or_404(event_id)


# ── Spotlight endpoints (EOM + spotlight cards) ────────────────────────────────

@router.get("/spotlight", response_model=List[SpotlightResponse])
def list_published_spotlight(
    db: Session = Depends(get_db),
    current_user: User = Depends(login_required),
):
    return _spotlight_svc(db).list_published()


@router.get("/spotlight/admin", response_model=List[SpotlightResponse])
def list_all_spotlight(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return _spotlight_svc(db).list_all()


@router.post("/spotlight", response_model=SpotlightResponse, status_code=status.HTTP_201_CREATED)
def create_spotlight(
    data: SpotlightCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    item = _spotlight_svc(db).create(data)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/spotlight/{spotlight_id}", response_model=SpotlightResponse)
def update_spotlight(
    spotlight_id: int,
    data: SpotlightUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    _spotlight_svc(db).update(spotlight_id, data)
    db.commit()
    return _spotlight_svc(db)._get_or_404(spotlight_id)


@router.delete("/spotlight/{spotlight_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_spotlight(
    spotlight_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    _spotlight_svc(db).delete(spotlight_id)
    db.commit()


@router.patch("/spotlight/{spotlight_id}/publish", response_model=SpotlightResponse)
def toggle_spotlight_published(
    spotlight_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    _spotlight_svc(db).toggle_published(spotlight_id)
    db.commit()
    return _spotlight_svc(db)._get_or_404(spotlight_id)


# ── Spotlight tag endpoints ─────────────────────────────────────────────────────

@router.get("/spotlight/tags", response_model=List[SpotlightTagResponse])
def list_spotlight_tags(
    db: Session = Depends(get_db),
    current_user: User = Depends(login_required),
):
    return _tag_svc(db).list_all()


@router.post("/spotlight/tags", response_model=SpotlightTagResponse, status_code=status.HTTP_201_CREATED)
def create_spotlight_tag(
    data: SpotlightTagCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    tag = _tag_svc(db).create(data)
    db.commit()
    db.refresh(tag)
    return tag


@router.patch("/spotlight/tags/{tag_id}", response_model=SpotlightTagResponse)
def update_spotlight_tag(
    tag_id: int,
    data: SpotlightTagUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    tag = _tag_svc(db).update(tag_id, data)
    db.commit()
    db.refresh(tag)
    return tag


@router.delete("/spotlight/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_spotlight_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    _tag_svc(db).delete(tag_id)
    db.commit()


# ── Leadership message endpoints ───────────────────────────────────────────────

class ReorderItem(BaseModel):
    id:         int
    sort_order: int


@router.get("/leadership", response_model=List[LeadershipResponse])
def list_published_leadership(
    db: Session = Depends(get_db),
    current_user: User = Depends(login_required),
):
    return _leadership_svc(db).list_published()


@router.get("/leadership/admin", response_model=List[LeadershipResponse])
def list_all_leadership(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return _leadership_svc(db).list_all()


@router.post("/leadership", response_model=LeadershipResponse, status_code=status.HTTP_201_CREATED)
def create_leadership(
    data: LeadershipCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    item = _leadership_svc(db).create(data)
    db.commit()
    db.refresh(item)
    return item


@router.post("/leadership/reorder", status_code=status.HTTP_204_NO_CONTENT)
def reorder_leadership(
    updates: List[ReorderItem],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    _leadership_svc(db).reorder([u.model_dump() for u in updates])
    db.commit()


@router.patch("/leadership/{msg_id}", response_model=LeadershipResponse)
def update_leadership(
    msg_id: int,
    data: LeadershipUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    _leadership_svc(db).update(msg_id, data)
    db.commit()
    return _leadership_svc(db)._get_or_404(msg_id)


@router.delete("/leadership/{msg_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_leadership(
    msg_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    _leadership_svc(db).delete(msg_id)
    db.commit()


@router.patch("/leadership/{msg_id}/publish", response_model=LeadershipResponse)
def toggle_leadership_published(
    msg_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    _leadership_svc(db).toggle_published(msg_id)
    db.commit()
    return _leadership_svc(db)._get_or_404(msg_id)


# ── FAQ category endpoints — must come before /faqs/{id} ─────────────────────

@router.get("/faqs/categories", response_model=List[FAQCategoryResponse])
def list_faq_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(login_required),
):
    return _faq_cat_svc(db).list_all()


@router.post("/faqs/categories", response_model=FAQCategoryResponse, status_code=status.HTTP_201_CREATED)
def create_faq_category(
    data: FAQCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    cat = _faq_cat_svc(db).create(data)
    db.commit()
    db.refresh(cat)
    return cat


@router.patch("/faqs/categories/{category_id}", response_model=FAQCategoryResponse)
def update_faq_category(
    category_id: int,
    data: FAQCategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    cat = _faq_cat_svc(db).update(category_id, data)
    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/faqs/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_faq_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    _faq_cat_svc(db).delete(category_id)
    db.commit()


@router.patch("/faqs/categories/{category_id}/visibility", response_model=FAQCategoryResponse)
def toggle_faq_category_visibility(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    cat = _faq_cat_svc(db).toggle_visibility(category_id)
    db.commit()
    db.refresh(cat)
    return cat


# ── FAQ reorder — must come before /faqs/{id} ────────────────────────────────

class FAQReorderItem(BaseModel):
    id:          int
    order_index: int


@router.post("/faqs/reorder", status_code=status.HTTP_204_NO_CONTENT)
def reorder_faqs(
    updates: List[FAQReorderItem],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    _faq_svc(db).reorder([u.model_dump() for u in updates])
    db.commit()


# ── FAQ published list — must come before /faqs/{id} ─────────────────────────

@router.get("/faqs/published", response_model=List[FAQResponse])
def list_published_faqs(
    db: Session = Depends(get_db),
    current_user: User = Depends(login_required),
):
    return _faq_svc(db).list_published()


# ── FAQ admin list ────────────────────────────────────────────────────────────

@router.get("/faqs", response_model=List[FAQResponse])
def list_all_faqs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return _faq_svc(db).list_all()


@router.post("/faqs", response_model=FAQResponse, status_code=status.HTTP_201_CREATED)
def create_faq(
    data: FAQCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    item = _faq_svc(db).create(data)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/faqs/{faq_id}", response_model=FAQResponse)
def update_faq(
    faq_id: int,
    data: FAQUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    _faq_svc(db).update(faq_id, data)
    db.commit()
    return _faq_svc(db)._get_or_404(faq_id)


@router.delete("/faqs/{faq_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_faq(
    faq_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    _faq_svc(db).delete(faq_id)
    db.commit()


@router.patch("/faqs/{faq_id}/publish", response_model=FAQResponse)
def toggle_faq_published(
    faq_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    _faq_svc(db).toggle_published(faq_id)
    db.commit()
    return _faq_svc(db)._get_or_404(faq_id)


# ── Feedback endpoints ────────────────────────────────────────────────────────

def _feedback_svc(db: Session) -> IntranetFeedbackService:
    return IntranetFeedbackService(db)


@router.get("/feedback", response_model=List[FeedbackResponse])
def list_feedback(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return _feedback_svc(db).list_all()


@router.post("/feedback", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
def submit_feedback(
    data: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(login_required),
):
    """Public endpoint — any authenticated employee can submit feedback."""
    try:
        emp = get_employee_by_user_id(current_user.id, db)
        emp_id   = emp.id
        emp_name = f"{current_user.first_name or ''} {current_user.last_name or ''}".strip() or emp_id
        emp_dept = emp.department_rel.name if emp.department_rel else None
    except Exception:
        emp_id = emp_name = emp_dept = None

    item = _feedback_svc(db).create(data, emp_id, emp_name, emp_dept)
    db.commit()
    db.refresh(item)
    return item


_STATUS_LABELS = {
    "open":      "Open",
    "in_review": "In Review",
    "resolved":  "Resolved",
    "closed":    "Closed",
}


@router.patch("/feedback/{feedback_id}/status", response_model=FeedbackResponse)
def update_feedback_status(
    feedback_id: int,
    data: FeedbackStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    try:
        resolver = get_employee_by_user_id(current_user.id, db)
        resolved_by_id = resolver.id
    except Exception:
        resolved_by_id = None

    prev_status = _feedback_svc(db)._get_or_404(feedback_id).status
    item = _feedback_svc(db).update_status(feedback_id, data.status, resolved_by_id)

    # Send in-app notification to the submitter if status actually changed and not anonymous
    if item.submitted_by_id and data.status != prev_status:
        status_label = _STATUS_LABELS.get(data.status, data.status)
        notification_service.create_notification(
            db=db,
            recipient_id=item.submitted_by_id,
            type=NotificationType.info,
            title="Feedback Update",
            message=f'Your feedback "{item.subject}" has been updated to: {status_label}.',
            reference_type="feedback",
            reference_id=str(item.id),
        )

    db.commit()
    db.refresh(item)
    return item


# ── Podcast endpoints ─────────────────────────────────────────────────────────
# NOTE: specific paths (/admin/, /upload-cover/, /upload-audio/) MUST come
#       before the /{episode_id} catch-all.

def _podcast_svc(db: Session) -> IntranetPodcastService:
    return IntranetPodcastService(db)


_ALLOWED_IMAGE_TYPES_PODCAST = {"image/jpeg", "image/png", "image/webp", "image/gif"}
_MAX_IMAGE_BYTES_PODCAST      = 5 * 1024 * 1024          # 5 MB
_ALLOWED_AUDIO_TYPES          = {
    "audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/aac",
    "audio/flac", "audio/m4a", "audio/x-m4a",
    "video/mp4", "video/webm", "video/quicktime", "video/x-msvideo",
}
_MAX_AUDIO_BYTES              = 500 * 1024 * 1024         # 500 MB


@router.get("/podcast/admin", response_model=List[PodcastResponse])
def list_all_podcasts(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return _podcast_svc(db).list_all()


@router.get("/podcast", response_model=List[PodcastResponse])
def list_published_podcasts(
    db: Session = Depends(get_db),
    current_user: User = Depends(login_required),
):
    return _podcast_svc(db).list_published()


@router.post("/podcast/upload-cover", response_model=ImageUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_podcast_cover(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Upload a cover image → Cloudinary → documents table. Returns {id, url}."""
    if file.content_type not in _ALLOWED_IMAGE_TYPES_PODCAST:
        raise HTTPException(status_code=422, detail="Only JPG, PNG, WebP, or GIF images are allowed.")
    contents = await file.read()
    if len(contents) > _MAX_IMAGE_BYTES_PODCAST:
        raise HTTPException(status_code=422, detail="Image must be 5 MB or smaller.")
    await file.seek(0)
    emp_id = _employee_id(current_user, db)
    doc = _podcast_svc(db).upload_cover_image(file, uploaded_by=emp_id)
    db.commit()
    db.refresh(doc)
    return ImageUploadResponse(id=doc.id, url=doc.file_path)


@router.post("/podcast/upload-audio", response_model=ImageUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_podcast_audio(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Upload an audio/video file → Cloudinary → documents table. Returns {id, url}."""
    if file.content_type not in _ALLOWED_AUDIO_TYPES:
        raise HTTPException(status_code=422, detail="Only audio/video files are allowed (MP3, WAV, MP4, WebM…).")
    contents = await file.read()
    if len(contents) > _MAX_AUDIO_BYTES:
        raise HTTPException(status_code=422, detail="File must be 500 MB or smaller.")
    await file.seek(0)
    emp_id = _employee_id(current_user, db)
    doc = _podcast_svc(db).upload_audio_file(file, uploaded_by=emp_id)
    db.commit()
    db.refresh(doc)
    return ImageUploadResponse(id=doc.id, url=doc.file_path)


@router.get("/podcast/{episode_id}", response_model=PodcastResponse)
def get_podcast_episode(
    episode_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(login_required),
):
    return _podcast_svc(db).get_published(episode_id)


@router.post("/podcast", response_model=PodcastResponse, status_code=status.HTTP_201_CREATED)
def create_podcast(
    data: PodcastCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    item = _podcast_svc(db).create(data)
    db.commit()
    return _podcast_svc(db)._get_or_404(item.id)


@router.patch("/podcast/{episode_id}", response_model=PodcastResponse)
def update_podcast(
    episode_id: int,
    data: PodcastUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    _podcast_svc(db).update(episode_id, data)
    db.commit()
    return _podcast_svc(db)._get_or_404(episode_id)


@router.delete("/podcast/{episode_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_podcast(
    episode_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    _podcast_svc(db).delete(episode_id)
    db.commit()


@router.patch("/podcast/{episode_id}/publish", response_model=PodcastResponse)
def toggle_podcast_published(
    episode_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    _podcast_svc(db).toggle_published(episode_id)
    db.commit()
    return _podcast_svc(db)._get_or_404(episode_id)


@router.patch("/podcast/{episode_id}/feature", response_model=PodcastResponse)
def set_podcast_featured(
    episode_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    _podcast_svc(db).set_featured(episode_id)
    db.commit()
    return _podcast_svc(db)._get_or_404(episode_id)
