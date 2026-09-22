import hmac
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.shared.models.user import User
from app.workspaces.models import Workspace, WorkspaceMembership
from app.workspaces.schemas import WorkspaceBrandingUpdate, WorkspaceSetupClaimRequest


def can_complete_onboarding(user_id: str, workspace: Workspace) -> bool:
    return workspace.status == "pending_setup" and workspace.setup_owner_user_id == user_id


def assert_branding_access(user_id: str, user_role: str, workspace: Workspace) -> None:
    if workspace.status == "pending_setup":
        if not can_complete_onboarding(user_id, workspace):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the workspace setup owner can complete workspace setup.",
            )
        return

    if user_role not in {"super_admin", "admin"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Workspace branding access required.",
        )


def claim_workspace_setup(
    user: User,
    workspace: Workspace,
    payload: WorkspaceSetupClaimRequest,
    db: Session,
) -> Workspace:
    if workspace.status != "pending_setup":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This workspace has already completed setup.",
        )

    email_matches = hmac.compare_digest(
        user.email.strip().casefold(),
        settings.WORKSPACE_SETUP_EMAIL.strip().casefold(),
    )
    code_matches = hmac.compare_digest(
        payload.code.strip().casefold(),
        settings.WORKSPACE_SETUP_CODE.strip().casefold(),
    )
    if not email_matches or not code_matches:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The setup code or account email is not valid for this workspace.",
        )

    workspace.setup_owner_user_id = user.id
    db.commit()
    db.refresh(workspace)
    return workspace


def get_workspace_membership(user_id: str, db: Session) -> WorkspaceMembership:
    membership = (
        db.query(WorkspaceMembership)
        .filter(
            WorkspaceMembership.user_id == user_id,
            WorkspaceMembership.status == "active",
        )
        .order_by(WorkspaceMembership.created_at.asc())
        .first()
    )
    if membership:
        return membership

    # Transitional single-workspace bootstrap: users created after the migration
    # join the only workspace on first access. This deliberately stops working as
    # soon as multiple workspaces exist, when explicit assignment is required.
    workspaces = db.query(Workspace.id).order_by(Workspace.created_at.asc()).limit(2).all()
    if len(workspaces) == 1:
        membership = WorkspaceMembership(
            workspace_id=workspaces[0][0],
            user_id=user_id,
            status="active",
        )
        db.add(membership)
        db.commit()
        db.refresh(membership)
        return membership

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="No active workspace membership was found for this account.",
    )


def get_current_workspace(user_id: str, db: Session) -> tuple[WorkspaceMembership, Workspace]:
    membership = get_workspace_membership(user_id, db)
    workspace = db.query(Workspace).filter(Workspace.id == membership.workspace_id).first()
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found.",
        )
    return membership, workspace


def update_branding(
    workspace: Workspace,
    payload: WorkspaceBrandingUpdate,
    db: Session,
) -> Workspace:
    logo_url = payload.logo_url or workspace.logo_url
    if not logo_url:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Upload a workspace logo before completing branding.",
        )

    workspace.name = payload.name
    workspace.logo_url = logo_url
    workspace.logo_background = payload.logo_background
    workspace.primary_color = payload.primary_color
    workspace.secondary_color = payload.secondary_color
    workspace.status = "active"
    workspace.onboarding_completed_at = workspace.onboarding_completed_at or datetime.now(timezone.utc)
    db.commit()
    db.refresh(workspace)
    return workspace
