"""use recommended incident status

Revision ID: 5e6f718293a4
Revises: 4d5e6f718293
Create Date: 2026-06-29

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "5e6f718293a4"
down_revision: Union[str, None] = "4d5e6f718293"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


incident_status_with_legacy = sa.Enum(
    "draft",
    "submitted",
    "action_recommended",
    "recommended",
    "resolved",
    "not_resolved",
    "closed",
    name="incidentreportstatus",
)
incident_status_current = sa.Enum(
    "draft",
    "submitted",
    "recommended",
    "resolved",
    "not_resolved",
    "closed",
    name="incidentreportstatus",
)
incident_status_legacy = sa.Enum(
    "draft",
    "submitted",
    "action_recommended",
    "resolved",
    "not_resolved",
    "closed",
    name="incidentreportstatus",
)

hse_decision_with_legacy = sa.Enum(
    "action_recommended",
    "recommended",
    "resolved",
    "not_resolved",
    name="incidenthsedecision",
)
hse_decision_current = sa.Enum(
    "recommended",
    "resolved",
    "not_resolved",
    name="incidenthsedecision",
)
hse_decision_legacy = sa.Enum(
    "action_recommended",
    "resolved",
    "not_resolved",
    name="incidenthsedecision",
)


def upgrade() -> None:
    op.alter_column(
        "safety_incident_reports",
        "status",
        existing_type=incident_status_legacy,
        type_=incident_status_with_legacy,
        existing_nullable=False,
    )
    op.alter_column(
        "safety_incident_hse_reviews",
        "decision",
        existing_type=hse_decision_legacy,
        type_=hse_decision_with_legacy,
        existing_nullable=False,
    )

    op.execute(
        "UPDATE safety_incident_reports "
        "SET status = 'recommended' "
        "WHERE status = 'action_recommended'"
    )
    op.execute(
        "UPDATE safety_incident_hse_reviews "
        "SET decision = 'recommended' "
        "WHERE decision = 'action_recommended'"
    )

    op.alter_column(
        "safety_incident_reports",
        "status",
        existing_type=incident_status_with_legacy,
        type_=incident_status_current,
        existing_nullable=False,
    )
    op.alter_column(
        "safety_incident_hse_reviews",
        "decision",
        existing_type=hse_decision_with_legacy,
        type_=hse_decision_current,
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "safety_incident_reports",
        "status",
        existing_type=incident_status_current,
        type_=incident_status_with_legacy,
        existing_nullable=False,
    )
    op.alter_column(
        "safety_incident_hse_reviews",
        "decision",
        existing_type=hse_decision_current,
        type_=hse_decision_with_legacy,
        existing_nullable=False,
    )

    op.execute(
        "UPDATE safety_incident_reports "
        "SET status = 'action_recommended' "
        "WHERE status = 'recommended'"
    )
    op.execute(
        "UPDATE safety_incident_hse_reviews "
        "SET decision = 'action_recommended' "
        "WHERE decision = 'recommended'"
    )

    op.alter_column(
        "safety_incident_reports",
        "status",
        existing_type=incident_status_with_legacy,
        type_=incident_status_legacy,
        existing_nullable=False,
    )
    op.alter_column(
        "safety_incident_hse_reviews",
        "decision",
        existing_type=hse_decision_with_legacy,
        type_=hse_decision_legacy,
        existing_nullable=False,
    )
