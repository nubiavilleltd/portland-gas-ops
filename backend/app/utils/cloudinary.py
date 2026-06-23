"""
Cloudinary upload helper.

When CLOUDINARY_* env vars are not set, raises a clear error rather than
silently failing. Set them in .env for both local dev and production.
"""

import cloudinary
import cloudinary.uploader
from fastapi import HTTPException
from app.config import settings


def _configure():
    if not all([settings.CLOUDINARY_CLOUD_NAME, settings.CLOUDINARY_API_KEY, settings.CLOUDINARY_API_SECRET]):
        raise HTTPException(
            status_code=503,
            detail="File storage is not configured. Contact your administrator.",
        )
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
    )


def upload_image(file_bytes: bytes, public_id: str) -> str:
    """Upload an image to Cloudinary and return the secure URL."""
    _configure()
    result = cloudinary.uploader.upload(
        file_bytes,
        public_id=public_id,
        overwrite=True,
        resource_type="image",
        folder="portland-gas/profile-pictures",
    )
    return result["secure_url"]


def upload_document(file_bytes: bytes, public_id: str) -> str:
    """
    Upload a document (PDF, DOC, DOCX, image) to Cloudinary and return the secure URL.
    Uses resource_type="raw" so PDFs/DOCs are stored and delivered as-is rather than
    being processed as images, giving a /raw/upload/ URL that works for direct download.
    """
    _configure()
    result = cloudinary.uploader.upload(
        file_bytes,
        public_id=public_id,
        overwrite=False,
        resource_type="raw",
        folder="portland-gas/employee-documents",
    )
    return result["secure_url"]
