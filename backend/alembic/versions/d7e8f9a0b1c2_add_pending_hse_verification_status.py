"""add pending hse verification incident status

Revision ID: d7e8f9a0b1c2
Revises: f7a8b9c0d1e2
Create Date: 2026-07-09
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d7e8f9a0b1c2"
down_revision: Union[str, None] = "f7a8b9c0d1e2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


incident_status_current = sa.Enum(
    "draft",
    "submitted",
    "recommended",
    "resolved",
    "not_resolved",
    "closed",
    name="incidentreportstatus",
)

incident_status_with_pending_verification = sa.Enum(
    "draft",
    "submitted",
    "recommended",
    "pending_hse_verification",
    "resolved",
    "not_resolved",
    "closed",
    name="incidentreportstatus",
)


def upgrade() -> None:
    op.alter_column(
        "safety_incident_reports",
        "status",
        existing_type=incident_status_current,
        type_=incident_status_with_pending_verification,
        existing_nullable=False,
    )


def downgrade() -> None:
    op.execute(
        "UPDATE safety_incident_reports "
        "SET status = 'recommended' "
        "WHERE status = 'pending_hse_verification'"
    )
    op.alter_column(
        "safety_incident_reports",
        "status",
        existing_type=incident_status_with_pending_verification,
        type_=incident_status_current,
        existing_nullable=False,
    )
