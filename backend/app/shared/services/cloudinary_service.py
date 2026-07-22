
"""
Unified Cloudinary storage service.

TWO interfaces in one file so both usage patterns work:

1. SIMPLE (used by vendors, employees, procurement — existing team code):
       from app.shared.services import cloudinary_service
       url = cloudinary_service.upload(file_bytes, public_id="...", folder="portland-gas/vendor-logos", resource_type="image")
       url = cloudinary_service.upload_file(file_bytes, filename, folder)
       url = cloudinary_service.upload_pdf(pdf_bytes, filename)

2. STRUCTURED (used by products — returns UploadResult with metadata):
       from app.shared.services.cloudinary_service import get_storage_service, ResourceType
       storage = get_storage_service()
       result  = storage.upload(file_bytes, filename="photo.jpg", folder="products/abc-123", resource_type=ResourceType.IMAGE)
       result.url, result.file_size, result.public_id

To swap storage providers in future: implement StorageInterface, change get_storage_service().
Nothing else changes.
"""

from __future__ import annotations

import logging
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Optional

from fastapi import HTTPException
from app.core.config import settings

logger = logging.getLogger(__name__)


# ── Resource type enum (used by structured interface) ─────────────────────────

class ResourceType(str, Enum):
    IMAGE = "image"   # JPEGs, PNGs, WebP
    RAW   = "raw"     # PDFs, DOCs — served with correct Content-Type
    AUTO  = "auto"    # Let Cloudinary detect


# ── Upload result (used by structured interface) ──────────────────────────────

@dataclass
class UploadResult:
    url:           str
    public_id:     str
    resource_type: str
    file_size:     int
    format:        str


# ── Storage interface (ABC) ───────────────────────────────────────────────────

class StorageInterface(ABC):
    @abstractmethod
    def upload(
        self,
        file_bytes:    bytes,
        filename:      str,
        folder:        str,
        resource_type: ResourceType = ResourceType.AUTO,
        overwrite:     bool         = False,
    ) -> UploadResult: ...

    @abstractmethod
    def delete(self, public_id: str, resource_type: ResourceType = ResourceType.IMAGE) -> bool: ...


# ── Error codes for storage failures ─────────────────────────────────────────
# Kept inline here so storage is self-contained. Imported by products/service.py
# if it needs to catch specific error codes.

class StorageErrorCode(str, Enum):
    STORAGE_NOT_CONFIGURED = "STORAGE_NOT_CONFIGURED"
    STORAGE_UPLOAD_FAILED  = "STORAGE_UPLOAD_FAILED"


# ── Shared configuration helper ───────────────────────────────────────────────

def _configure() -> None:
    """Configure Cloudinary SDK. Raises 503 if credentials are missing."""
    if not all([
        settings.CLOUDINARY_CLOUD_NAME,
        settings.CLOUDINARY_API_KEY,
        settings.CLOUDINARY_API_SECRET,
    ]):
        raise HTTPException(
            status_code=503,
            detail={
                "error_code": StorageErrorCode.STORAGE_NOT_CONFIGURED,
                "message": "File storage is not configured. Contact your administrator.",
            },
        )
    import cloudinary
    cloudinary.config(
        cloud_name = settings.CLOUDINARY_CLOUD_NAME,
        api_key    = settings.CLOUDINARY_API_KEY,
        api_secret = settings.CLOUDINARY_API_SECRET,
        secure     = True,
    )


# ═════════════════════════════════════════════════════════════════════════════
# SIMPLE INTERFACE — backwards-compatible with existing team code
# Vendors and employees call these functions directly.
# ═════════════════════════════════════════════════════════════════════════════

def upload(
    file_bytes:    bytes,
    public_id:     str,
    folder:        str,
    resource_type: str = "auto",
    overwrite:     bool = True,
) -> str:
    """
    Upload a file to Cloudinary and return the secure URL.
    Used by: vendors (upload_vendor_logo), procurement (upload_file, upload_pdf).

    Args:
        file_bytes:    Raw file content.
        public_id:     Cloudinary asset name (without folder prefix).
        folder:        Cloudinary folder, e.g. "portland-gas/vendor-logos".
        resource_type: "image" | "raw" | "auto"
        overwrite:     Replace existing asset with same public_id.

    Returns:
        HTTPS URL of the uploaded file.
    """
    _configure()
    try:
        import cloudinary.uploader
        result = cloudinary.uploader.upload(
            file_bytes,
            public_id=public_id,
            folder=folder,
            resource_type=resource_type,
            overwrite=overwrite,
        )
        return result["secure_url"]
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Cloudinary upload failed — folder=%s public_id=%s: %s", folder, public_id, exc)
        raise HTTPException(status_code=500, detail="File upload failed. Please try again.")


def upload_file(file_bytes: bytes, filename: str, folder: str = "portland-gas") -> Optional[str]:
    """Generic file upload. Returns URL or None on failure."""
    try:
        public_id = filename.rsplit(".", 1)[0]
        return upload(file_bytes, public_id, folder=folder, resource_type="auto")
    except Exception as exc:
        logger.error("Cloudinary upload failed for %s: %s", filename, exc)
        return None


def upload_pdf(pdf_bytes: bytes, filename: str) -> Optional[str]:
    """PDF upload as raw resource for correct Content-Type delivery."""
    try:
        return upload(
            pdf_bytes, filename,
            folder="portland-gas/purchase-orders",
            resource_type="raw",
        )
    except Exception as exc:
        logger.error("Cloudinary PDF upload failed for %s: %s", filename, exc)
        return None


def download_via_admin_api(file_path: str) -> tuple[bytes, str]:
    """
    Download a Cloudinary file using the Admin API (api.cloudinary.com).

    The CDN delivery URL (res.cloudinary.com) returns 401 on accounts flagged as
    "untrusted" by Cloudinary, even with signed URLs.  The Admin API accepts a
    signed request and returns the raw file bytes directly — bypassing the CDN
    restriction entirely.
    """
    _configure()
    import re
    import time
    import httpx
    import cloudinary.utils

    # URL format: https://res.cloudinary.com/{cloud}/{resource_type}/upload/v{version}/{public_id}
    # Signed URLs also contain s--signature-- before v{version}
    match = re.search(
        r"https?://res\.cloudinary\.com/[^/]+/(raw|image|video)/upload/(?:s--[^/]+--/)?(?:v\d+/)?(.+)",
        file_path,
    )
    if not match:
        raise ValueError(f"Cannot parse Cloudinary URL: {file_path}")

    resource_type = match.group(1)
    public_id     = match.group(2)

    # private_download_url generates a signed Admin API URL that serves file bytes
    admin_url = cloudinary.utils.private_download_url(
        public_id,
        "",                      # format — empty because raw public_ids include the extension
        resource_type=resource_type,
        type="upload",
        expires_at=int(time.time()) + 300,  # 5-minute window
    )

    try:
        response = httpx.get(admin_url, timeout=30, follow_redirects=True)
        response.raise_for_status()
        content_type = response.headers.get("content-type", "application/octet-stream")
        return response.content, content_type
    except Exception as exc:
        logger.error("Cloudinary admin download failed for %s: %s", file_path, exc)
        raise HTTPException(status_code=502, detail="Failed to fetch file from storage")


def download_file(file_path: str) -> tuple[bytes, str]:
    """
    Fetch a Cloudinary file by its delivery URL.
    Cloudinary delivery URLs (res.cloudinary.com) are publicly accessible —
    Basic Auth is not used here (that's only for the Admin API).
    Returns (file_bytes, content_type).
    """
    import httpx
    try:
        response = httpx.get(
            file_path,
            timeout=30,
            follow_redirects=True,
        )
        response.raise_for_status()
        content_type = response.headers.get("content-type", "application/octet-stream")
        return response.content, content_type
    except Exception as exc:
        logger.error("Cloudinary download failed for %s: %s", file_path, exc)
        raise HTTPException(status_code=502, detail="Failed to fetch file from storage")


# ═════════════════════════════════════════════════════════════════════════════
# STRUCTURED INTERFACE — used by products (and future domains needing metadata)
# Returns UploadResult with url, public_id, file_size, format.
# ═════════════════════════════════════════════════════════════════════════════

class CloudinaryStorageService(StorageInterface):
    """
    Structured Cloudinary implementation.
    Returns UploadResult instead of just a URL — gives callers file_size,
    public_id, and format without extra API calls.

    Folder strategy: portland-gas/<folder>/<stem>_<timestamp>
    Callers pass only the subfolder (e.g. "products/abc-123").
    The root folder comes from settings.CLOUDINARY_ROOT_FOLDER.
    """

    def _build_public_id(self, filename: str, folder: str) -> str:
        root = getattr(settings, "CLOUDINARY_ROOT_FOLDER", "portland-gas")
        stem = Path(filename).stem
        ext  = Path(filename).suffix   # kept for RAW so URL ends in .pdf
        ts   = int(time.time())
        return f"{root}/{folder}/{stem}_{ts}{ext}"

    def upload(
        self,
        file_bytes:    bytes,
        filename:      str,
        folder:        str,
        resource_type: ResourceType = ResourceType.AUTO,
        overwrite:     bool         = False,
    ) -> UploadResult:
        _configure()
        try:
            import cloudinary.uploader
            public_id = self._build_public_id(filename, folder)
            result = cloudinary.uploader.upload(
                file_bytes,
                public_id     = public_id,
                resource_type = resource_type.value,
                overwrite     = overwrite,
            )
            return UploadResult(
                url           = result["secure_url"],
                public_id     = result["public_id"],
                resource_type = result.get("resource_type", resource_type.value),
                file_size     = result.get("bytes", len(file_bytes)),
                format        = result.get("format", Path(filename).suffix.lstrip(".")),
            )
        except HTTPException:
            raise
        except Exception as exc:
            logger.error("Cloudinary upload failed for %s/%s: %s", folder, filename, exc)
            raise HTTPException(
                status_code=502,
                detail={
                    "error_code": StorageErrorCode.STORAGE_UPLOAD_FAILED,
                    "message": "File upload failed. Please try again.",
                },
            )

    def delete(self, public_id: str, resource_type: ResourceType = ResourceType.IMAGE) -> bool:
        _configure()
        try:
            import cloudinary.uploader
            result = cloudinary.uploader.destroy(public_id, resource_type=resource_type.value)
            return result.get("result") == "ok"
        except Exception as exc:
            logger.error("Cloudinary delete failed for %s: %s", public_id, exc)
            return False


# ── Factory (singleton) ───────────────────────────────────────────────────────

_storage_instance: Optional[StorageInterface] = None


def get_storage_service() -> StorageInterface:
    """
    Returns the configured storage service singleton.
    Import this in any domain that needs structured uploads with metadata.
    To swap providers: change this function's return value only.
    """
    global _storage_instance
    if _storage_instance is None:
        _storage_instance = CloudinaryStorageService()
    return _storage_instance