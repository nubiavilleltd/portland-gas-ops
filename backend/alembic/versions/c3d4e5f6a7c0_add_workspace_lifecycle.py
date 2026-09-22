"""add workspace lifecycle and setup owner

Revision ID: c3d4e5f6a7c0
Revises: c3d4e5f6a7b9
Create Date: 2026-09-20 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c3d4e5f6a7c0"
down_revision: Union[str, None] = "c3d4e5f6a7b9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "workspaces",
        sa.Column("status", sa.String(20), nullable=False, server_default="pending_setup"),
    )
    op.add_column(
        "workspaces",
        sa.Column("setup_owner_user_id", sa.CHAR(36), nullable=True),
    )
    op.create_index(
        "ix_workspaces_setup_owner_user_id",
        "workspaces",
        ["setup_owner_user_id"],
        unique=False,
    )
    op.create_foreign_key(
        "fk_workspaces_setup_owner_user_id_users",
        "workspaces",
        "users",
        ["setup_owner_user_id"],
        ["id"],
        ondelete="SET NULL",
    )

    connection = op.get_bind()
    workspaces = sa.table(
        "workspaces",
        sa.column("id", sa.CHAR(36)),
        sa.column("status", sa.String(20)),
        sa.column("setup_owner_user_id", sa.CHAR(36)),
        sa.column("onboarding_completed_at", sa.DateTime()),
    )
    memberships = sa.table(
        "workspace_memberships",
        sa.column("workspace_id", sa.CHAR(36)),
        sa.column("user_id", sa.CHAR(36)),
        sa.column("status", sa.String(20)),
        sa.column("created_at", sa.DateTime()),
    )
    users = sa.table(
        "users",
        sa.column("id", sa.CHAR(36)),
        sa.column("role", sa.String(50)),
    )

    workspace_rows = connection.execute(
        sa.select(
            workspaces.c.id,
            workspaces.c.onboarding_completed_at,
        )
    ).all()
    for workspace_id, completed_at in workspace_rows:
        owner = connection.execute(
            sa.select(memberships.c.user_id)
            .select_from(memberships.join(users, memberships.c.user_id == users.c.id))
            .where(
                memberships.c.workspace_id == workspace_id,
                memberships.c.status == "active",
                users.c.role.in_(["super_admin", "admin"]),
            )
            .order_by(memberships.c.created_at.asc())
            .limit(1)
        ).first()
        if owner is None:
            owner = connection.execute(
                sa.select(memberships.c.user_id)
                .where(
                    memberships.c.workspace_id == workspace_id,
                    memberships.c.status == "active",
                )
                .order_by(memberships.c.created_at.asc())
                .limit(1)
            ).first()

        connection.execute(
            workspaces.update()
            .where(workspaces.c.id == workspace_id)
            .values(
                # A pending workspace is claimed with the setup code. Do not
                # silently assign its owner during migration.
                setup_owner_user_id=owner[0] if owner and completed_at else None,
                status="active" if completed_at else "pending_setup",
            )
        )


def downgrade() -> None:
    op.drop_constraint(
        "fk_workspaces_setup_owner_user_id_users",
        "workspaces",
        type_="foreignkey",
    )
    op.drop_index("ix_workspaces_setup_owner_user_id", table_name="workspaces")
    op.drop_column("workspaces", "setup_owner_user_id")
    op.drop_column("workspaces", "status")
