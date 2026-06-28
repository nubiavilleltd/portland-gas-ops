import uuid
from datetime import datetime


def generate_reference(prefix: str) -> str:
    """Generate a short unique reference code, e.g. PRQ-20240513-A1B2."""
    date_part = datetime.utcnow().strftime("%Y%m%d")
    short_id = str(uuid.uuid4()).replace("-", "")[:6].upper()
    return f"{prefix}-{date_part}-{short_id}"


def paginate(query, skip: int = 0, limit: int = 20):
    """Apply skip/limit pagination to a SQLAlchemy query."""
    return query.offset(skip).limit(limit).all()
