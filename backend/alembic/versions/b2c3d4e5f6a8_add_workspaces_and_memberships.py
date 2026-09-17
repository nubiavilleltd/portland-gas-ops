"""add workspaces and workspace memberships

Revision ID: b2c3d4e5f6a8
Revises: a1f2b3c4d5e6
Create Date: 2026-09-17 00:00:00.000000

"""
import uuid
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b2c3d4e5f6a8"
down_revision: Union[str, None] = "a1f2b3c4d5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    workspace_id = str(uuid.uuid4())

    op.create_table(
        "workspaces",
        sa.Column("id", sa.CHAR(36), nullable=False),
        sa.Column("name", sa.String(255), nullable=False, server_default="Your Company"),
        sa.Column("logo_url", sa.String(1000), nullable=True),
        sa.Column("primary_color", sa.String(7), nullable=False, server_default="#7234BD"),
        sa.Column("secondary_color", sa.String(7), nullable=False, server_default="#1C043B"),
        sa.Column("onboarding_completed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "workspace_memberships",
        sa.Column("id", sa.CHAR(36), nullable=False),
        sa.Column("workspace_id", sa.CHAR(36), nullable=False),
        sa.Column("user_id", sa.CHAR(36), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "workspace_id",
            "user_id",
            name="uq_workspace_memberships_workspace_user",
        ),
    )
    op.create_index(
        "ix_workspace_memberships_workspace_id",
        "workspace_memberships",
        ["workspace_id"],
        unique=False,
    )
    op.create_index(
        "ix_workspace_memberships_user_id",
        "workspace_memberships",
        ["user_id"],
        unique=False,
    )

    workspaces = sa.table(
        "workspaces",
        sa.column("id", sa.CHAR(36)),
        sa.column("name", sa.String(255)),
        sa.column("primary_color", sa.String(7)),
        sa.column("secondary_color", sa.String(7)),
    )
    op.bulk_insert(
        workspaces,
        [
            {
                "id": workspace_id,
                "name": "Your Company",
                "primary_color": "#7234BD",
                "secondary_color": "#1C043B",
            }
        ],
    )

    connection = op.get_bind()
    users = sa.table("users", sa.column("id", sa.CHAR(36)))
    memberships = sa.table(
        "workspace_memberships",
        sa.column("id", sa.CHAR(36)),
        sa.column("workspace_id", sa.CHAR(36)),
        sa.column("user_id", sa.CHAR(36)),
        sa.column("status", sa.String(20)),
    )
    membership_rows = [
        {
            "id": str(uuid.uuid4()),
            "workspace_id": workspace_id,
            "user_id": user_id,
            "status": "active",
        }
        for user_id in connection.execute(sa.select(users.c.id)).scalars()
    ]
    if membership_rows:
        op.bulk_insert(memberships, membership_rows)


def downgrade() -> None:
    op.drop_index("ix_workspace_memberships_user_id", table_name="workspace_memberships")
    op.drop_index("ix_workspace_memberships_workspace_id", table_name="workspace_memberships")
    op.drop_table("workspace_memberships")
    op.drop_table("workspaces")
