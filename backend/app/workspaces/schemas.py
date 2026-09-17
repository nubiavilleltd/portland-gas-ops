import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_validator


HEX_COLOR_PATTERN = re.compile(r"^#[0-9A-Fa-f]{6}$")


class WorkspaceBrandingUpdate(BaseModel):
    name: str
    primary_color: str
    secondary_color: str
    logo_url: Optional[str] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Workspace name is required")
        if len(normalized) > 255:
            raise ValueError("Workspace name must be 255 characters or fewer")
        return normalized

    @field_validator("primary_color", "secondary_color")
    @classmethod
    def validate_color(cls, value: str) -> str:
        normalized = value.strip().upper()
        if not HEX_COLOR_PATTERN.fullmatch(normalized):
            raise ValueError("Color must be a six-digit hex value such as #7234BD")
        return normalized

    @field_validator("logo_url")
    @classmethod
    def validate_logo_url(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        normalized = value.strip()
        if not normalized.startswith("https://"):
            raise ValueError("Logo URL must use HTTPS")
        if len(normalized) > 1000:
            raise ValueError("Logo URL must be 1000 characters or fewer")
        return normalized


class WorkspaceLogoUploadResponse(BaseModel):
    logo_url: str


class WorkspaceResponse(BaseModel):
    id: str
    membership_id: str
    name: str
    logo_url: Optional[str]
    primary_color: str
    secondary_color: str
    is_configured: bool
    onboarding_completed_at: Optional[datetime]
