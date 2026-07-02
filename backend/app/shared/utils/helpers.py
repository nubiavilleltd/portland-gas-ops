import re
import html
import uuid
from datetime import datetime
from typing import Type

from sqlalchemy.orm import Session


def generate_reference(prefix: str, db: Session, model_class: Type, reference_col) -> str:
    """
    Generate a unique human-readable reference, e.g. PR-2026-A1B2C3.

    Uses a 6-character uppercase hex suffix drawn from a UUID, giving
    16^6 = 16,777,216 possible values per prefix per year. Verifies
    uniqueness against the DB before returning; retries up to 5 times
    on the extremely unlikely collision. The column must have a UNIQUE
    constraint as a final safety net.

    Usage:
        ref = generate_reference("PR", db, ProcurementRequest, ProcurementRequest.reference)
        ref = generate_reference("AR", db, AssetRequest,       AssetRequest.reference)
    """
    year = datetime.utcnow().year
    for _ in range(5):
        short_id = uuid.uuid4().hex[:6].upper()
        ref = f"{prefix}-{year}-{short_id}"
        exists = db.query(model_class).filter(reference_col == ref).first()
        if not exists:
            return ref
    raise RuntimeError(
        f"Could not generate a unique reference for prefix '{prefix}' after 5 attempts."
    )


def sanitize_str(value: str) -> str:
    """
    Strip HTML tags and decode HTML entities from a string.
    Use this on any user-supplied text field to prevent stored XSS.

    SQLAlchemy ORM already parameterises all DB queries, so SQL injection
    is handled at the ORM layer — this function covers XSS only.
    """
    if not value:
        return value
    # Remove all HTML / script tags
    cleaned = re.sub(r"<[^>]+>", "", value)
    # Decode HTML entities (e.g. &lt; → <) then strip again
    cleaned = html.unescape(cleaned)
    return cleaned.strip()


def paginate(query, skip: int = 0, limit: int = 20):
    """Apply skip/limit pagination to a SQLAlchemy query."""
    return query.offset(skip).limit(limit).all()
