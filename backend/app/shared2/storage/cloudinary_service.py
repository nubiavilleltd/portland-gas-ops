
from __future__ import annotations
"""
Cloudinary implementation of StorageInterface.

All callers receive UploadResult — they never import cloudinary directly.
To swap providers: implement StorageInterface for the new provider,
then change get_storage_service() to return it. Zero callers change.

Folder strategy:
  All files go under "portland-gas/<folder>/<filename>"
  The "portland-gas" root is the CLOUDINARY_ROOT_FOLDER config value.
  Callers only pass the subfolder name (e.g. "products", "employees/documents").
"""

import logging
import time
from pathlib import Path


from app.core.config import settings
from app.shared2.storage.storage_interface import (
    StorageInterface, ResourceType, UploadResult
)

from app.core.exceptions import AppException
from app.shared2.storage.error_codes import StorageErrorCode

logger = logging.getLogger(__name__)


class CloudinaryStorageService(StorageInterface):
    """
    Cloudinary-backed implementation of StorageInterface.
    Lazy-imports cloudinary so the app boots even without it installed.
    """

    def _configure(self) -> None:
        """Configure Cloudinary SDK from settings. Raises 503 if not configured."""
        if not all([
            settings.CLOUDINARY_CLOUD_NAME,
            settings.CLOUDINARY_API_KEY,
            settings.CLOUDINARY_API_SECRET,
        ]):
            raise AppException(
                status_code=503,
                error_code=StorageErrorCode.STORAGE_NOT_CONFIGURED,
                message="File storage is not configured. Contact your administrator.",
            )
        import cloudinary
        cloudinary.config(
            cloud_name = settings.CLOUDINARY_CLOUD_NAME,
            api_key    = settings.CLOUDINARY_API_KEY,
            api_secret = settings.CLOUDINARY_API_SECRET,
            secure     = True,   # Always HTTPS
        )

    def _build_public_id(self, filename: str, folder: str) -> str:
        """
        Build the Cloudinary public_id.
        Format: portland-gas/<folder>/<stem>_<timestamp>
        The timestamp suffix prevents collisions when the same filename is uploaded twice.
        For RAW files we keep the extension — without it Cloudinary serves files
        without Content-Type, which breaks PDF display in browsers.
        """
        root = getattr(settings, "CLOUDINARY_ROOT_FOLDER", "portland-gas")
        stem = Path(filename).stem
        ext  = Path(filename).suffix   # e.g. ".pdf"
        ts   = int(time.time())
        # For raw files keep the extension in public_id so the URL ends in .pdf
        # For images Cloudinary adds the extension automatically
        return f"{root}/{folder}/{stem}_{ts}{ext}"

    def upload(
        self,
        file_bytes:    bytes,
        filename:      str,
        folder:        str,
        resource_type: ResourceType = ResourceType.AUTO,
        overwrite:     bool         = False,
    ) -> UploadResult:
        self._configure()

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
           raise AppException(
                status_code=502,
                error_code=StorageErrorCode.STORAGE_UPLOAD_FAILED,
                message="File upload failed. Please try again.",
            )

    def delete(self, public_id: str, resource_type: ResourceType = ResourceType.IMAGE) -> bool:
        self._configure()
        try:
            import cloudinary.uploader
            result = cloudinary.uploader.destroy(
                public_id,
                resource_type = resource_type.value,
            )
            return result.get("result") == "ok"
        except Exception as exc:
            logger.error("Cloudinary delete failed for %s: %s", public_id, exc)
            return False


# ── Factory function ──────────────────────────────────────────────────────────
# This is the ONLY function callers import.
# To swap providers: change this function's return type.
# All callers automatically get the new provider.

_storage_instance: StorageInterface | None = None


def get_storage_service() -> StorageInterface:
    """
    Returns the configured storage service (singleton per process).
    Currently: Cloudinary. Swap by changing this function's implementation.
    """
    global _storage_instance
    if _storage_instance is None:
        _storage_instance = CloudinaryStorageService()
    return _storage_instance