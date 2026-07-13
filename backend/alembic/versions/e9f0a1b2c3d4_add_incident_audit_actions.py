"""add incident-specific workflow audit actions

Revision ID: e9f0a1b2c3d4
Revises: d7e8f9a0b1c2
Create Date: 2026-07-10
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e9f0a1b2c3d4"
down_revision: Union[str, None] = "d7e8f9a0b1c2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


audit_action_current = sa.Enum(
    "submitted",
    "approved",
    "rejected",
    "returned",
    "escalated",
    "recalled",
    name="auditaction",
)

audit_action_with_incident_events = sa.Enum(
    "submitted",
    "approved",
    "rejected",
    "returned",
    "escalated",
    "recalled",
    "recommended",
    "resolved",
    "not_resolved",
    "closed",
    name="auditaction",
)


def upgrade() -> None:
    op.alter_column(
        "workflow_audit_trail",
        "action",
        existing_type=audit_action_current,
        type_=audit_action_with_incident_events,
        existing_nullable=False,
    )


def downgrade() -> None:
    op.execute(
        "UPDATE workflow_audit_trail "
        "SET action = 'approved' "
        "WHERE action IN ('recommended', 'resolved', 'closed')"
    )
    op.execute(
        "UPDATE workflow_audit_trail "
        "SET action = 'rejected' "
        "WHERE action = 'not_resolved'"
    )
    op.alter_column(
        "workflow_audit_trail",
        "action",
        existing_type=audit_action_with_incident_events,
        type_=audit_action_current,
        existing_nullable=False,
    )
