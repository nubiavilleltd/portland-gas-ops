"""add safety incident reports

Revision ID: 9d1c2b3a4e5f
Revises: 8c9d0e1f2a3b
Create Date: 2026-06-26

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql


revision: str = "9d1c2b3a4e5f"
down_revision: Union[str, None] = "8c9d0e1f2a3b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


incident_status_enum = sa.Enum(
    "draft",
    "submitted",
    "recommended",
    "resolved",
    "not_resolved",
    "closed",
    name="incidentreportstatus",
)
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


def upgrade() -> None:
    op.create_table(
        "safety_incident_reports",
        sa.Column("id", mysql.CHAR(length=36), nullable=False),
        sa.Column("reference", sa.String(length=50), nullable=False),
        sa.Column("status", incident_status_enum, nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("report_type", incident_type_enum, nullable=False),
        sa.Column("location", sa.String(length=255), nullable=False),
        sa.Column("exact_location", sa.String(length=255), nullable=True),
        sa.Column("observed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("related_work_authorization_id", mysql.CHAR(length=36), nullable=True),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("severity_estimate", severity_enum, nullable=True),
        sa.Column("anyone_injured", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("property_damaged", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("gas_fire_environmental_concern", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("immediate_action_taken", sa.Text(), nullable=True),
        sa.Column("people_involved", sa.Text(), nullable=True),
        sa.Column("additional_notes", sa.Text(), nullable=True),
        sa.Column("reported_by", mysql.CHAR(length=36), nullable=False),
        sa.Column("reported_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("resolution_work_closeout_id", mysql.CHAR(length=36), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["reported_by"], ["employees.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_safety_incident_reports_reference", "safety_incident_reports", ["reference"], unique=True)
    op.create_index("ix_safety_incident_reports_status", "safety_incident_reports", ["status"], unique=False)
    op.create_index("ix_safety_incident_reports_report_type", "safety_incident_reports", ["report_type"], unique=False)
    op.create_index("ix_safety_incident_reports_location", "safety_incident_reports", ["location"], unique=False)
    op.create_index("ix_safety_incident_reports_observed_at", "safety_incident_reports", ["observed_at"], unique=False)
    op.create_index(
        "ix_safety_incident_reports_gas_fire_environmental_concern",
        "safety_incident_reports",
        ["gas_fire_environmental_concern"],
        unique=False,
    )
    op.create_index("ix_safety_incident_reports_reported_by", "safety_incident_reports", ["reported_by"], unique=False)
    op.create_index("ix_safety_incident_reports_reported_at", "safety_incident_reports", ["reported_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_safety_incident_reports_reported_at", table_name="safety_incident_reports")
    op.drop_index("ix_safety_incident_reports_reported_by", table_name="safety_incident_reports")
    op.drop_index("ix_safety_incident_reports_gas_fire_environmental_concern", table_name="safety_incident_reports")
    op.drop_index("ix_safety_incident_reports_observed_at", table_name="safety_incident_reports")
    op.drop_index("ix_safety_incident_reports_location", table_name="safety_incident_reports")
    op.drop_index("ix_safety_incident_reports_report_type", table_name="safety_incident_reports")
    op.drop_index("ix_safety_incident_reports_status", table_name="safety_incident_reports")
    op.drop_index("ix_safety_incident_reports_reference", table_name="safety_incident_reports")
    op.drop_table("safety_incident_reports")
