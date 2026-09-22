from dataclasses import dataclass
import logging
from typing import Optional

from fastapi import Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.shared.dependencies import get_current_user
from app.shared.models.user import User
from app.workspaces.models import Workspace, WorkspaceMembership
from app.workspaces.service import get_workspace_membership

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class WorkspaceContext:
    user: User
    membership: WorkspaceMembership
    workspace: Workspace


def get_workspace_context(
    request: Request,
    workspace_id: Optional[str] = Header(default=None, alias="X-Workspace-ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> WorkspaceContext:
    resolution_source = "explicit_workspace_header" if workspace_id else "active_membership"
    membership_query = db.query(WorkspaceMembership).filter(
        WorkspaceMembership.user_id == current_user.id,
        WorkspaceMembership.status == "active",
    )

    if workspace_id:
        membership = membership_query.filter(
            WorkspaceMembership.workspace_id == workspace_id,
        ).first()
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this workspace.",
            )
    else:
        memberships = membership_query.order_by(WorkspaceMembership.created_at.asc()).limit(2).all()
        if len(memberships) > 1:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Select a workspace before continuing.",
            )
        if memberships:
            membership = memberships[0]
        else:
            membership = get_workspace_membership(current_user.id, db)
            resolution_source = "transitional_single_workspace_bootstrap"

    workspace = db.query(Workspace).filter(Workspace.id == membership.workspace_id).first()
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found.",
        )

    if workspace.status in {"suspended", "closed"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This workspace is not available.",
        )

    resource = "other"
    if request.url.path.startswith("/api/employees"):
        resource = "employees"
    elif request.url.path.startswith("/api/setups/departments"):
        resource = "departments"

    logger.info(
        "Workspace resolved: user_id=%s workspace_id=%s membership_id=%s "
        "source=%s resource=%s path=%s",
        current_user.id,
        workspace.id,
        membership.id,
        resolution_source,
        resource,
        request.url.path,
    )

    return WorkspaceContext(
        user=current_user,
        membership=membership,
        workspace=workspace,
    )
