"""scope organization groups to workspaces

Revision ID: c3d4e5f6a7c2
Revises: c3d4e5f6a7c1
Create Date: 2026-09-21 00:00:00.000000

Group members remain a join table. Their workspace is derived from the group
and employee foreign keys, and the service layer verifies both belong to the
active workspace before a membership is created or returned.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.mysql import CHAR


revision: str = "c3d4e5f6a7c2"
down_revision: Union[str, None] = "c3d4e5f6a7c1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "org_groups",
        sa.Column("workspace_id", CHAR(36), nullable=True),
    )
    op.create_index(
        "ix_org_groups_workspace_id",
        "org_groups",
        ["workspace_id"],
        unique=False,
    )
    op.create_foreign_key(
        "fk_org_groups_workspace_id_workspaces",
        "org_groups",
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
            "Cannot scope organization groups: no workspace exists. "
            "Create the initial workspace before running this migration."
        )

    connection.execute(
        sa.text("UPDATE org_groups SET workspace_id = :workspace_id"),
        {"workspace_id": workspace_id},
    )
    op.alter_column(
        "org_groups",
        "workspace_id",
        existing_type=CHAR(36),
        nullable=False,
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_org_groups_workspace_id_workspaces",
        "org_groups",
        type_="foreignkey",
    )
    op.drop_index("ix_org_groups_workspace_id", table_name="org_groups")
    op.drop_column("org_groups", "workspace_id")
