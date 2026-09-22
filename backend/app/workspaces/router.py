from pathlib import Path
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.database import get_db
from app.shared.services import cloudinary_service
from app.workspaces.schemas import (
    WorkspaceBrandingUpdate,
    WorkspaceLogoUploadResponse,
    WorkspaceResponse,
    WorkspaceSetupClaimRequest,
)
from app.workspaces.context import WorkspaceContext, get_workspace_context
from app.workspaces.service import (
    assert_branding_access,
    can_complete_onboarding,
    claim_workspace_setup,
    update_branding,
)


router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

ALLOWED_LOGO_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_LOGO_BYTES = 2 * 1024 * 1024


def _serialize_workspace(membership_id: str, workspace, current_user_id: str) -> WorkspaceResponse:
    return WorkspaceResponse(
        id=workspace.id,
        membership_id=membership_id,
        name=workspace.name,
        logo_url=workspace.logo_url,
        logo_background=workspace.logo_background,
        primary_color=workspace.primary_color,
        secondary_color=workspace.secondary_color,
        status=workspace.status,
        is_configured=workspace.onboarding_completed_at is not None,
        can_complete_onboarding=can_complete_onboarding(current_user_id, workspace),
        onboarding_completed_at=workspace.onboarding_completed_at,
    )


@router.get("/current", response_model=WorkspaceResponse)
def read_current_workspace(
    context: WorkspaceContext = Depends(get_workspace_context),
):
    return _serialize_workspace(
        context.membership.id,
        context.workspace,
        context.user.id,
    )


@router.post("/current/claim-setup", response_model=WorkspaceResponse)
@limiter.limit("5/minute")
def claim_current_workspace_setup(
    request: Request,
    payload: WorkspaceSetupClaimRequest,
    context: WorkspaceContext = Depends(get_workspace_context),
    db: Session = Depends(get_db),
):
    claim_workspace_setup(context.user, context.workspace, payload, db)
    return _serialize_workspace(
        context.membership.id,
        context.workspace,
        context.user.id,
    )


@router.patch("/current/branding", response_model=WorkspaceResponse)
def update_current_workspace_branding(
    payload: WorkspaceBrandingUpdate,
    context: WorkspaceContext = Depends(get_workspace_context),
    db: Session = Depends(get_db),
):
    assert_branding_access(context.user.id, context.user.role.value, context.workspace)
    update_branding(context.workspace, payload, db)
    return _serialize_workspace(
        context.membership.id,
        context.workspace,
        context.user.id,
    )


@router.post("/current/logo", response_model=WorkspaceLogoUploadResponse)
async def upload_current_workspace_logo(
    file: UploadFile = File(...),
    context: WorkspaceContext = Depends(get_workspace_context),
):
    assert_branding_access(context.user.id, context.user.role.value, context.workspace)

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
        folder=f"workspaces/{context.workspace.id}/branding",
        resource_type="image",
        overwrite=False,
    )
    return WorkspaceLogoUploadResponse(logo_url=logo_url)
