"""scope workflow configuration to workspaces

Revision ID: c3d4e5f6a7c3
Revises: c3d4e5f6a7c2
Create Date: 2026-09-21 00:30:00.000000

Workflow steps continue to derive their workspace through their parent
workflow.  Live approval/request tables are intentionally left for a later
slice so this migration only changes workflow configuration ownership.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.mysql import CHAR


revision: str = "c3d4e5f6a7c3"
down_revision: Union[str, None] = "c3d4e5f6a7c2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "approval_workflows",
        sa.Column("workspace_id", CHAR(36), nullable=True),
    )
    op.add_column(
        "workflow_assignments",
        sa.Column("workspace_id", CHAR(36), nullable=True),
    )

    op.create_index(
        "ix_approval_workflows_workspace_id",
        "approval_workflows",
        ["workspace_id"],
        unique=False,
    )
    op.create_index(
        "ix_workflow_assignments_workspace_id",
        "workflow_assignments",
        ["workspace_id"],
        unique=False,
    )
    op.create_foreign_key(
        "fk_approval_workflows_workspace_id_workspaces",
        "approval_workflows",
        "workspaces",
        ["workspace_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_workflow_assignments_workspace_id_workspaces",
        "workflow_assignments",
        "workspaces",
        ["workspace_id"],
        ["id"],
        ondelete="CASCADE",
    )

    connection = op.get_bind()
    workspace_id = connection.execute(
        sa.text(
            "SELECT id FROM workspaces "
            "ORDER BY created_at ASC, id ASC LIMIT 1"
        )
    ).scalar()
    if not workspace_id:
        raise RuntimeError(
            "Cannot scope workflow configuration: no workspace exists. "
            "Create the initial workspace before running this migration."
        )

    connection.execute(
        sa.text("UPDATE approval_workflows SET workspace_id = :workspace_id"),
        {"workspace_id": workspace_id},
    )
    # Use each workflow's backfilled workspace rather than assuming that every
    # assignment points to the oldest workspace.
    connection.execute(
        sa.text(
            "UPDATE workflow_assignments wa "
            "JOIN approval_workflows aw ON aw.id = wa.workflow_id "
            "SET wa.workspace_id = aw.workspace_id"
        )
    )

    op.alter_column(
        "approval_workflows",
        "workspace_id",
        existing_type=CHAR(36),
        nullable=False,
    )
    op.alter_column(
        "workflow_assignments",
        "workspace_id",
        existing_type=CHAR(36),
        nullable=False,
    )

    # The old schema allowed only one assignment per request type globally.
    # Assignments are now unique within a workspace instead.
    op.drop_constraint("request_type", "workflow_assignments", type_="unique")
    op.create_unique_constraint(
        "uq_workflow_assignments_workspace_request_type",
        "workflow_assignments",
        ["workspace_id", "request_type"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_workflow_assignments_workspace_request_type",
        "workflow_assignments",
        type_="unique",
    )
    op.create_unique_constraint(
        "request_type",
        "workflow_assignments",
        ["request_type"],
    )
    op.drop_constraint(
        "fk_workflow_assignments_workspace_id_workspaces",
        "workflow_assignments",
        type_="foreignkey",
    )
    op.drop_constraint(
        "fk_approval_workflows_workspace_id_workspaces",
        "approval_workflows",
        type_="foreignkey",
    )
    op.drop_index(
        "ix_workflow_assignments_workspace_id",
        table_name="workflow_assignments",
    )
    op.drop_index(
        "ix_approval_workflows_workspace_id",
        table_name="approval_workflows",
    )
    op.drop_column("workflow_assignments", "workspace_id")
    op.drop_column("approval_workflows", "workspace_id")
