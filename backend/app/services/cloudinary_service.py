"""
Cloudinary upload service.

Handles uploading files and PDFs to Cloudinary cloud storage.
Returns the secure URL of the uploaded file.

Used by: procurement (attachments + PO PDFs), and later assets, HR, etc.

When CLOUDINARY_CLOUD_NAME is not set, upload is skipped and None is returned.
"""

import logging
from app.config import settings

logger = logging.getLogger(__name__)


def _configure():
    """Configure the Cloudinary SDK with credentials from .env"""
    import cloudinary
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,  # Always use HTTPS URLs
    )


def upload_file(file_bytes: bytes, filename: str, folder: str = "portland-gas") -> str | None:
    """
    Upload a file (bytes) to Cloudinary.

    Args:
        file_bytes: The raw file content as bytes
        filename: Original filename (used to name the file in Cloudinary)
        folder: Cloudinary folder to organise uploads

    Returns:
        The secure HTTPS URL of the uploaded file, or None if upload is skipped.
    """
    if not settings.CLOUDINARY_CLOUD_NAME:
        logger.warning("CLOUDINARY_CLOUD_NAME not set — file upload skipped.")
        return None

    try:
        import cloudinary.uploader
        _configure()

        # Remove file extension from name for Cloudinary public_id
        public_id = f"{folder}/{filename.rsplit('.', 1)[0]}"

        result = cloudinary.uploader.upload(
            file_bytes,
            public_id=public_id,
            resource_type="auto",   # auto-detects image vs raw (PDF, etc.)
            overwrite=True,
        )

        return result.get("secure_url")

    except Exception as exc:
        logger.error("Cloudinary upload failed for %s: %s", filename, exc)
        return None


def upload_pdf(pdf_bytes: bytes, filename: str) -> str | None:
    """
    Upload a PDF to Cloudinary as a raw file.

    Why resource_type="raw" instead of "auto"?
      "auto" detects PDFs and uploads them under image/upload, which means
      Cloudinary treats them as images. The resulting URL cannot be opened
      directly in a browser as a PDF.
      "raw" uploads under raw/upload — the file is served exactly as-is,
      with the correct Content-Type: application/pdf header, so browsers
      open it natively.
    """
    if not settings.CLOUDINARY_CLOUD_NAME:
        logger.warning("CLOUDINARY_CLOUD_NAME not set — PDF upload skipped.")
        return None

    try:
        import cloudinary.uploader
        _configure()

        # Keep the .pdf extension in the public_id for raw uploads.
        # Without it, Cloudinary serves the URL without an extension and
        # macOS cannot detect the file type — it opens in TextEdit instead of Preview.
        public_id = f"portland-gas/purchase-orders/{filename}"

        result = cloudinary.uploader.upload(
            pdf_bytes,
            public_id=public_id,
            resource_type="raw",
            overwrite=True,
        )

        return result.get("secure_url")

    except Exception as exc:
        logger.error("Cloudinary PDF upload failed for %s: %s", filename, exc)
        return None
