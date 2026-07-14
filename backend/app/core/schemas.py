from datetime import datetime
from typing import Any

from pydantic import BaseModel, field_serializer

from app.core.datetime_utils import utc_isoformat


class UtcDateTimeModel(BaseModel):
    @field_serializer("*", when_used="json")
    def serialize_datetimes(self, value: Any):
        if isinstance(value, datetime):
            return utc_isoformat(value)

        return value
