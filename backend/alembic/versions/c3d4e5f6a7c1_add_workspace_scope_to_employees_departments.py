"""scope employees and departments to workspaces

Revision ID: c3d4e5f6a7c1
Revises: c3d4e5f6a7c0
Create Date: 2026-09-20 00:30:00.000000

The existing application has one workspace today. Legacy employee and
department rows are therefore assigned to the oldest workspace during this
backfill. The migration does not delete or rewrite business data.

Employee ``user_id`` and ``employee_no`` remain globally unique for now. The
current User -> Employee ORM relationship is one-to-one, so relaxing those
constraints belongs with the later multi-workspace employee-profile refactor.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.mysql import CHAR


revision: str = "c3d4e5f6a7c1"
down_revision: Union[str, None] = "c3d4e5f6a7c0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "departments",
        sa.Column("workspace_id", CHAR(36), nullable=True),
    )
    op.add_column(
        "employees",
        sa.Column("workspace_id", CHAR(36), nullable=True),
    )

    op.create_index(
        "ix_departments_workspace_id",
        "departments",
        ["workspace_id"],
        unique=False,
    )
    op.create_index(
        "ix_employees_workspace_id",
        "employees",
        ["workspace_id"],
        unique=False,
    )
    op.create_foreign_key(
        "fk_departments_workspace_id_workspaces",
        "departments",
        "workspaces",
        ["workspace_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_employees_workspace_id_workspaces",
        "employees",
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
            "Cannot scope employees and departments: no workspace exists. "
            "Create the initial workspace before running this migration."
        )

    connection.execute(
        sa.text("UPDATE departments SET workspace_id = :workspace_id"),
        {"workspace_id": workspace_id},
    )
    connection.execute(
        sa.text("UPDATE employees SET workspace_id = :workspace_id"),
        {"workspace_id": workspace_id},
    )

    op.alter_column(
        "departments",
        "workspace_id",
        existing_type=CHAR(36),
        nullable=False,
    )
    op.alter_column(
        "employees",
        "workspace_id",
        existing_type=CHAR(36),
        nullable=False,
    )

    # Department names/codes are unique within a workspace, not globally.
    op.drop_constraint("name", "departments", type_="unique")
    op.drop_constraint("code", "departments", type_="unique")
    op.create_unique_constraint(
        "uq_departments_workspace_name",
        "departments",
        ["workspace_id", "name"],
    )
    op.create_unique_constraint(
        "uq_departments_workspace_code",
        "departments",
        ["workspace_id", "code"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_departments_workspace_code",
        "departments",
        type_="unique",
    )
    op.drop_constraint(
        "uq_departments_workspace_name",
        "departments",
        type_="unique",
    )
    op.create_unique_constraint("code", "departments", ["code"])
    op.create_unique_constraint("name", "departments", ["name"])
    op.drop_constraint(
        "fk_employees_workspace_id_workspaces",
        "employees",
        type_="foreignkey",
    )
    op.drop_constraint(
        "fk_departments_workspace_id_workspaces",
        "departments",
        type_="foreignkey",
    )
    op.drop_index("ix_employees_workspace_id", table_name="employees")
    op.drop_index("ix_departments_workspace_id", table_name="departments")
    op.drop_column("employees", "workspace_id")
    op.drop_column("departments", "workspace_id")
