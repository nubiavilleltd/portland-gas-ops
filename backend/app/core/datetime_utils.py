from datetime import datetime, timezone
from typing import Optional


def as_utc(value: Optional[datetime]) -> Optional[datetime]:
    if value is None:
        return None

    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)

    return value.astimezone(timezone.utc)


def utc_isoformat(value: Optional[datetime]) -> Optional[str]:
    utc_value = as_utc(value)
    if utc_value is None:
        return None

    return utc_value.isoformat().replace("+00:00", "Z")
