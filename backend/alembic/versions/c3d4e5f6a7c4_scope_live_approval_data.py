"""scope live approval data to workspaces

Revision ID: c3d4e5f6a7c4
Revises: c3d4e5f6a7c3
Create Date: 2026-09-21 01:30:00.000000

The workspace is stored directly on live approval rows so dashboard,
notification, history, and audit queries can enforce the tenant boundary
without relying on a caller to reconstruct it through several joins.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.mysql import CHAR


revision: str = "c3d4e5f6a7c4"
down_revision: Union[str, None] = "c3d4e5f6a7c3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


_TABLES = (
    "approval_requests",
    "approval_step_assignments",
    "approval_history",
    "workflow_audit_trail",
    "all_requests",
    "notifications",
)


def upgrade() -> None:
    for table in _TABLES:
        op.add_column(table, sa.Column("workspace_id", CHAR(36), nullable=True))
        op.create_index(
            f"ix_{table}_workspace_id",
            table,
            ["workspace_id"],
            unique=False,
        )
        op.create_foreign_key(
            f"fk_{table}_workspace_id_workspaces",
            table,
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
            "Cannot scope live approval data: no workspace exists. "
            "Create the initial workspace before running this migration."
        )

    # Requests inherit their workspace from the already-scoped workflow.
    connection.execute(
        sa.text(
            "UPDATE approval_requests ar "
            "JOIN approval_workflows aw ON aw.id = ar.workflow_id "
            "SET ar.workspace_id = aw.workspace_id"
        )
    )
    connection.execute(
        sa.text(
            "UPDATE approval_step_assignments asa "
            "JOIN approval_requests ar ON ar.id = asa.approval_request_id "
            "SET asa.workspace_id = ar.workspace_id"
        )
    )
    connection.execute(
        sa.text(
            "UPDATE approval_history ah "
            "JOIN approval_requests ar ON ar.id = ah.approval_request_id "
            "SET ah.workspace_id = ar.workspace_id"
        )
    )

    # Audit rows can represent source-module actions with no workflow_id, so
    # use the actor's scoped employee record as a second, explicit backfill.
    connection.execute(
        sa.text(
            "UPDATE workflow_audit_trail wat "
            "JOIN approval_workflows aw ON aw.id = wat.workflow_id "
            "SET wat.workspace_id = aw.workspace_id"
        )
    )
    connection.execute(
        sa.text(
            "UPDATE workflow_audit_trail wat "
            "JOIN employees e ON e.id = wat.actor_id "
            "SET wat.workspace_id = e.workspace_id "
            "WHERE wat.workspace_id IS NULL"
        )
    )

    # Dashboard rows and notifications have an employee owner from which the
    # existing workspace can be recovered without changing business data.
    connection.execute(
        sa.text(
            "UPDATE all_requests ar "
            "JOIN employees e ON e.id = ar.raised_by "
            "SET ar.workspace_id = e.workspace_id"
        )
    )
    connection.execute(
        sa.text(
            "UPDATE notifications n "
            "JOIN employees e ON e.id = n.recipient_id "
            "SET n.workspace_id = e.workspace_id"
        )
    )

    for table in _TABLES:
        remaining = connection.execute(
            sa.text(f"SELECT COUNT(*) FROM {table} WHERE workspace_id IS NULL")
        ).scalar()
        if remaining:
            raise RuntimeError(
                f"Cannot scope {table}: {remaining} row(s) could not be assigned "
                "to a workspace. No rows were made non-null."
            )
        op.alter_column(
            table,
            "workspace_id",
            existing_type=CHAR(36),
            nullable=False,
        )


def downgrade() -> None:
    for table in reversed(_TABLES):
        op.drop_constraint(
            f"fk_{table}_workspace_id_workspaces",
            table,
            type_="foreignkey",
        )
        op.drop_index(f"ix_{table}_workspace_id", table_name=table)
        op.drop_column(table, "workspace_id")
