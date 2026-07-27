"""add incident hse reviews

Revision ID: 3c4d5e6f7182
Revises: 2b3c4d5e6f71
Create Date: 2026-06-27

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql


revision: str = "3c4d5e6f7182"
down_revision: Union[str, None] = "2b3c4d5e6f71"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


incident_type_enum = sa.Enum(
    "incident",
    "hazard",
    "near_miss",
    "unsafe_act",
    "unsafe_condition",
    "environmental_concern",
    "other",
    name="incidentreporttype",
)
severity_enum = sa.Enum(
    "low",
    "medium",
    "high",
    "critical",
    name="incidentseverityestimate",
)
hse_decision_enum = sa.Enum(
    "recommended",
    "resolved",
    "not_resolved",
    name="incidenthsedecision",
)


def upgrade() -> None:
    op.create_table(
        "safety_incident_hse_reviews",
        sa.Column("id", mysql.CHAR(length=36), nullable=False),
        sa.Column("incident_report_id", mysql.CHAR(length=36), nullable=False),
        sa.Column("inspector_id", mysql.CHAR(length=36), nullable=False),
        sa.Column("confirmed_report_type", incident_type_enum, nullable=False),
        sa.Column("confirmed_severity", severity_enum, nullable=False),
        sa.Column("findings", sa.Text(), nullable=False),
        sa.Column("root_cause", sa.Text(), nullable=True),
        sa.Column("corrective_action_required", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("corrective_action_details", sa.Text(), nullable=True),
        sa.Column("action_owner_id", mysql.CHAR(length=36), nullable=True),
        sa.Column("assigned_department", sa.String(length=100), nullable=True),
        sa.Column("target_completion_date", sa.Date(), nullable=True),
        sa.Column("decision", hse_decision_enum, nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["action_owner_id"], ["employees.id"]),
        sa.ForeignKeyConstraint(["incident_report_id"], ["safety_incident_reports.id"]),
        sa.ForeignKeyConstraint(["inspector_id"], ["employees.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("incident_report_id", name="uq_safety_incident_hse_reviews_incident_report_id"),
    )
    op.create_index("ix_safety_incident_hse_reviews_incident_report_id", "safety_incident_hse_reviews", ["incident_report_id"], unique=False)
    op.create_index("ix_safety_incident_hse_reviews_inspector_id", "safety_incident_hse_reviews", ["inspector_id"], unique=False)
    op.create_index("ix_safety_incident_hse_reviews_confirmed_severity", "safety_incident_hse_reviews", ["confirmed_severity"], unique=False)
    op.create_index("ix_safety_incident_hse_reviews_corrective_action_required", "safety_incident_hse_reviews", ["corrective_action_required"], unique=False)
    op.create_index("ix_safety_incident_hse_reviews_action_owner_id", "safety_incident_hse_reviews", ["action_owner_id"], unique=False)
    op.create_index("ix_safety_incident_hse_reviews_assigned_department", "safety_incident_hse_reviews", ["assigned_department"], unique=False)
    op.create_index("ix_safety_incident_hse_reviews_target_completion_date", "safety_incident_hse_reviews", ["target_completion_date"], unique=False)
    op.create_index("ix_safety_incident_hse_reviews_decision", "safety_incident_hse_reviews", ["decision"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_safety_incident_hse_reviews_decision", table_name="safety_incident_hse_reviews")
    op.drop_index("ix_safety_incident_hse_reviews_target_completion_date", table_name="safety_incident_hse_reviews")
    op.drop_index("ix_safety_incident_hse_reviews_assigned_department", table_name="safety_incident_hse_reviews")
    op.drop_index("ix_safety_incident_hse_reviews_action_owner_id", table_name="safety_incident_hse_reviews")
    op.drop_index("ix_safety_incident_hse_reviews_corrective_action_required", table_name="safety_incident_hse_reviews")
    op.drop_index("ix_safety_incident_hse_reviews_confirmed_severity", table_name="safety_incident_hse_reviews")
    op.drop_index("ix_safety_incident_hse_reviews_inspector_id", table_name="safety_incident_hse_reviews")
    op.drop_index("ix_safety_incident_hse_reviews_incident_report_id", table_name="safety_incident_hse_reviews")
    op.drop_table("safety_incident_hse_reviews")
