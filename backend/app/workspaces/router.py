from pathlib import Path
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.shared.dependencies import get_current_user, require_admin
from app.shared.models.user import User
from app.shared.services import cloudinary_service
from app.workspaces.schemas import (
    WorkspaceBrandingUpdate,
    WorkspaceLogoUploadResponse,
    WorkspaceResponse,
)
from app.workspaces.service import get_current_workspace, update_branding


router = APIRouter()

ALLOWED_LOGO_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_LOGO_BYTES = 2 * 1024 * 1024


def _serialize_workspace(membership_id: str, workspace) -> WorkspaceResponse:
    return WorkspaceResponse(
        id=workspace.id,
        membership_id=membership_id,
        name=workspace.name,
        logo_url=workspace.logo_url,
        logo_background=workspace.logo_background,
        primary_color=workspace.primary_color,
        secondary_color=workspace.secondary_color,
        is_configured=workspace.onboarding_completed_at is not None,
        onboarding_completed_at=workspace.onboarding_completed_at,
    )


@router.get("/current", response_model=WorkspaceResponse)
def read_current_workspace(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    membership, workspace = get_current_workspace(current_user.id, db)
    return _serialize_workspace(membership.id, workspace)


@router.patch("/current/branding", response_model=WorkspaceResponse)
def update_current_workspace_branding(
    payload: WorkspaceBrandingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    membership, workspace = get_current_workspace(current_user.id, db)
    update_branding(workspace, payload, db)
    return _serialize_workspace(membership.id, workspace)


@router.post("/current/logo", response_model=WorkspaceLogoUploadResponse)
async def upload_current_workspace_logo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    _, workspace = get_current_workspace(current_user.id, db)

    if file.content_type not in ALLOWED_LOGO_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Only PNG, JPG, and WEBP logos are allowed.",
        )

    contents = await file.read()
    if len(contents) > MAX_LOGO_BYTES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Workspace logo must be 2 MB or smaller.",
        )

    extension = Path(file.filename or "logo").suffix.lower().lstrip(".") or "png"
    logo_url = cloudinary_service.upload(
        contents,
        public_id=f"logo-{uuid.uuid4().hex}.{extension}",
        folder=f"workspaces/{workspace.id}/branding",
        resource_type="image",
        overwrite=False,
    )
    return WorkspaceLogoUploadResponse(logo_url=logo_url)
