"""
Unified Cloudinary upload service.

Single entry point for all file uploads across the system.
Every domain uses this one function — just pass the appropriate folder and resource_type.

resource_type guide:
  "image" → photos, logos (served as images)
  "raw"   → PDFs, Word docs (served with correct Content-Type for browser download)
  "auto"  → let Cloudinary detect (fine for mixed uploads)
"""

import logging
from fastapi import HTTPException
from app.core.config import settings

logger = logging.getLogger(__name__)


def _configure() -> None:
    if not all([settings.CLOUDINARY_CLOUD_NAME, settings.CLOUDINARY_API_KEY, settings.CLOUDINARY_API_SECRET]):
        raise HTTPException(
            status_code=503,
            detail="File storage is not configured. Contact your administrator.",
        )
    import cloudinary
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )


def upload(
    file_bytes: bytes,
    public_id: str,
    folder: str,
    resource_type: str = "auto",
    overwrite: bool = True,
) -> str:
    """
    Upload a file to Cloudinary and return the secure URL.

    Args:
        file_bytes:    Raw file content.
        public_id:     Cloudinary asset identifier (without folder prefix).
        folder:        Cloudinary folder, e.g. "portland-gas/vendor-logos".
        resource_type: "image" | "raw" | "auto"
        overwrite:     Replace existing asset with same public_id. Default True.

    Returns:
        HTTPS URL of the uploaded file.

    Raises:
        HTTPException 503 — Cloudinary not configured.
        HTTPException 500 — upload failed.
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


# ── Convenience wrappers used by routers ──────────────────────────────────────

def upload_file(file_bytes: bytes, filename: str, folder: str = "portland-gas") -> str | None:
    """Generic file upload. Returns URL or None on failure."""
    try:
        public_id = filename.rsplit(".", 1)[0]
        return upload(file_bytes, public_id, folder=folder, resource_type="auto")
    except Exception as exc:
        logger.error("Cloudinary upload failed for %s: %s", filename, exc)
        return None


def upload_pdf(pdf_bytes: bytes, filename: str) -> str | None:
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
