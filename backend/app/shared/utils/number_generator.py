from datetime import datetime, timezone


def generate_entity_no(db, model, field_name: str, prefix: str) -> str:
    """
    Generate a sequential entity number.
    Format: {PREFIX}-{YYYYMMDD}-{NNN}
    Examples: PRD-20260626-001, ORD-20260626-042

    Args:
        db:         SQLAlchemy session
        model:      The SQLAlchemy model class
        field_name: The column name e.g. "product_no", "order_no"
        prefix:     e.g. "PRD", "ORD", "INV"
    """
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    pattern = f"{prefix}-{today}-%"

    last = (
        db.query(getattr(model, field_name))
        .filter(getattr(model, field_name).like(pattern))
        .order_by(getattr(model, field_name).desc())
        .first()
    )

    if last:
        last_seq = int(last[0].split("-")[-1])
        next_seq = last_seq + 1
    else:
        next_seq = 1

    return f"{prefix}-{today}-{next_seq:03d}"