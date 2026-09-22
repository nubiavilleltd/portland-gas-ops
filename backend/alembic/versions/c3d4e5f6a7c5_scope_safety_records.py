"""scope safety records to workspaces

Revision ID: c3d4e5f6a7c5
Revises: c3d4e5f6a7c4
Create Date: 2026-09-22 00:00:00.000000

Safety records already belong to an employee or another safety record.  This
migration materializes that ownership on the safety tables so every safety
query can enforce the workspace boundary directly and efficiently.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.mysql import CHAR


revision: str = "c3d4e5f6a7c5"
down_revision: Union[str, None] = "c3d4e5f6a7c4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


_TABLES = (
    "safety_incident_reports",
    "safety_incident_hse_reviews",
    "safety_work_initiations",
    "safety_work_initiation_workers",
    "safety_work_authorizations",
    "safety_work_closeouts",
    "safety_closeout_reviews",
    "safety_checklist_responses",
)


def upgrade() -> None:
    for table in _TABLES:
        op.add_column(table, sa.Column("workspace_id", CHAR(36), nullable=True))
        op.create_index(f"ix_{table}_workspace_id", table, ["workspace_id"], unique=False)
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
            "Cannot scope safety records: no workspace exists. "
            "Create the initial workspace before running this migration."
        )

    # Root records inherit their workspace from the employee who created them.
    connection.execute(
        sa.text(
            "UPDATE safety_incident_reports sir "
            "JOIN employees e ON e.id = sir.reported_by "
            "SET sir.workspace_id = e.workspace_id"
        )
    )
    connection.execute(
        sa.text(
            "UPDATE safety_work_initiations swi "
            "JOIN employees e ON e.id = swi.requester_id "
            "SET swi.workspace_id = e.workspace_id"
        )
    )
    connection.execute(
        sa.text(
            "UPDATE safety_work_authorizations swa "
            "JOIN employees e ON e.id = swa.requester_id "
            "SET swa.workspace_id = e.workspace_id"
        )
    )
    connection.execute(
        sa.text(
            "UPDATE safety_work_closeouts swc "
            "JOIN employees e ON e.id = swc.requester_id "
            "SET swc.workspace_id = e.workspace_id"
        )
    )

    # Child records inherit their workspace from their parent safety record.
    connection.execute(
        sa.text(
            "UPDATE safety_incident_hse_reviews sihr "
            "JOIN safety_incident_reports sir "
            "ON sir.id = sihr.incident_report_id "
            "SET sihr.workspace_id = sir.workspace_id"
        )
    )
    connection.execute(
        sa.text(
            "UPDATE safety_work_initiation_workers swi_worker "
            "JOIN safety_work_initiations swi "
            "ON swi.id = swi_worker.work_initiation_id "
            "SET swi_worker.workspace_id = swi.workspace_id"
        )
    )
    connection.execute(
        sa.text(
            "UPDATE safety_closeout_reviews scr "
            "JOIN safety_work_closeouts swc "
            "ON swc.id = scr.work_closeout_id "
            "SET scr.workspace_id = swc.workspace_id"
        )
    )
    connection.execute(
        sa.text(
            "UPDATE safety_checklist_responses scr "
            "JOIN employees e ON e.id = scr.answered_by "
            "SET scr.workspace_id = e.workspace_id"
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
