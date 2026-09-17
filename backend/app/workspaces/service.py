from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.workspaces.models import Workspace, WorkspaceMembership
from app.workspaces.schemas import WorkspaceBrandingUpdate


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
    workspace.primary_color = payload.primary_color
    workspace.secondary_color = payload.secondary_color
    workspace.onboarding_completed_at = workspace.onboarding_completed_at or datetime.now(timezone.utc)
    db.commit()
    db.refresh(workspace)
    return workspace
