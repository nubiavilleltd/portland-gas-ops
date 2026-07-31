from pathlib import Path
from typing import Iterable

from fastapi import HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.shared.models.document import Document
from app.shared.services import cloudinary_service
from app.shared.services.cloudinary_service import ResourceType


RAW_DOCUMENT_MIME_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

RAW_DOCUMENT_EXTENSIONS = {".pdf", ".doc", ".docx"}


def safety_upload_resource_type(mime_type: str | None, filename: str) -> ResourceType:
    """Return the Cloudinary resource type Safety evidence should use."""
    normalized_mime_type = (mime_type or "").lower()
    extension = Path(filename).suffix.lower()

    if (
        normalized_mime_type in RAW_DOCUMENT_MIME_TYPES
        or extension in RAW_DOCUMENT_EXTENSIONS
    ):
        return ResourceType.RAW

    return ResourceType.AUTO


def stream_safety_document(
    db: Session,
    *,
    attachment_id: str,
    categories: Iterable[str],
) -> Response:
    try:
        document_id = int(attachment_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attachment not found.",
        )

    document = (
        db.query(Document)
        .filter(
            Document.id == document_id,
            Document.category.in_(list(categories)),
            Document.type == "file",
        )
        .first()
    )
    if not document or not document.file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attachment not found.",
        )

    file_bytes, content_type = cloudinary_service.download_via_admin_api(
        document.file_path,
    )
    return Response(
        content=file_bytes,
        media_type=content_type or document.mime_type or "application/octet-stream",
        headers={"Content-Disposition": f'inline; filename="{document.name}"'},
    )
