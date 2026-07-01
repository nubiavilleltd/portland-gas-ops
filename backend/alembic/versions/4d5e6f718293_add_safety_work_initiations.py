"""add safety work initiations

Revision ID: 4d5e6f718293
Revises: 3c4d5e6f7182
Create Date: 2026-06-29

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql


revision: str = "4d5e6f718293"
down_revision: Union[str, None] = "3c4d5e6f7182"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


work_initiation_status_enum = sa.Enum(
    "draft",
    "submitted",
    "pending",
    "returned",
    "denied",
    "approved",
    name="workinitiationstatus",
)
work_initiation_category_enum = sa.Enum(
    "routine_work",
    "maintenance",
    "incident_hazard",
    "customer_work",
    "project_work",
    "emergency_work",
    "other",
    name="workinitiationcategory",
)
work_initiation_decision_enum = sa.Enum(
    "approve",
    "return",
    "deny",
    name="workinitiationdecision",
)


def upgrade() -> None:
    op.create_table(
        "safety_work_initiations",
        sa.Column("id", mysql.CHAR(length=36), nullable=False),
        sa.Column("reference", sa.String(length=50), nullable=False),
        sa.Column("status", work_initiation_status_enum, nullable=False),
        sa.Column("requester_id", mysql.CHAR(length=36), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("work_category", work_initiation_category_enum, nullable=False),
        sa.Column("related_incident_report_id", mysql.CHAR(length=36), nullable=True),
        sa.Column("work_type", sa.String(length=255), nullable=False),
        sa.Column("location", sa.String(length=255), nullable=False),
        sa.Column("exact_work_area", sa.String(length=255), nullable=True),
        sa.Column("work_description", sa.Text(), nullable=False),
        sa.Column("reason_for_work", sa.Text(), nullable=False),
        sa.Column("assigned_department", sa.String(length=100), nullable=False),
        sa.Column("assigned_supervisor_id", mysql.CHAR(length=36), nullable=False),
        sa.Column("contractors_needed", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("selected_contractor_name", sa.String(length=255), nullable=True),
        sa.Column("contractor_contact_email", sa.String(length=255), nullable=True),
        sa.Column("planned_start_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("planned_end_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("materials_required", sa.Text(), nullable=True),
        sa.Column("supervisor_decision", work_initiation_decision_enum, nullable=True),
        sa.Column("supervisor_id", mysql.CHAR(length=36), nullable=True),
        sa.Column("supervisor_comment", sa.Text(), nullable=True),
        sa.Column("supervisor_decided_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("operations_hod_decision", work_initiation_decision_enum, nullable=True),
        sa.Column("operations_hod_id", mysql.CHAR(length=36), nullable=True),
        sa.Column("operations_hod_comment", sa.Text(), nullable=True),
        sa.Column("operations_hod_decided_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["assigned_supervisor_id"], ["employees.id"]),
        sa.ForeignKeyConstraint(["operations_hod_id"], ["employees.id"]),
        sa.ForeignKeyConstraint(["related_incident_report_id"], ["safety_incident_reports.id"]),
        sa.ForeignKeyConstraint(["requester_id"], ["employees.id"]),
        sa.ForeignKeyConstraint(["supervisor_id"], ["employees.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_safety_work_initiations_reference", "safety_work_initiations", ["reference"], unique=True)
    op.create_index("ix_safety_work_initiations_status", "safety_work_initiations", ["status"], unique=False)
    op.create_index("ix_safety_work_initiations_requester_id", "safety_work_initiations", ["requester_id"], unique=False)
    op.create_index("ix_safety_work_initiations_work_category", "safety_work_initiations", ["work_category"], unique=False)
    op.create_index("ix_safety_work_initiations_related_incident_report_id", "safety_work_initiations", ["related_incident_report_id"], unique=False)
    op.create_index("ix_safety_work_initiations_location", "safety_work_initiations", ["location"], unique=False)
    op.create_index("ix_safety_work_initiations_assigned_department", "safety_work_initiations", ["assigned_department"], unique=False)
    op.create_index("ix_safety_work_initiations_assigned_supervisor_id", "safety_work_initiations", ["assigned_supervisor_id"], unique=False)
    op.create_index("ix_safety_work_initiations_planned_start_at", "safety_work_initiations", ["planned_start_at"], unique=False)
    op.create_index("ix_safety_work_initiations_planned_end_at", "safety_work_initiations", ["planned_end_at"], unique=False)

    op.create_table(
        "safety_work_initiation_workers",
        sa.Column("id", mysql.CHAR(length=36), nullable=False),
        sa.Column("work_initiation_id", mysql.CHAR(length=36), nullable=False),
        sa.Column("worker_id", mysql.CHAR(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["work_initiation_id"], ["safety_work_initiations.id"]),
        sa.ForeignKeyConstraint(["worker_id"], ["employees.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "work_initiation_id",
            "worker_id",
            name="uq_safety_work_initiation_workers_pair",
        ),
    )
    op.create_index("ix_safety_work_initiation_workers_work_initiation_id", "safety_work_initiation_workers", ["work_initiation_id"], unique=False)
    op.create_index("ix_safety_work_initiation_workers_worker_id", "safety_work_initiation_workers", ["worker_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_safety_work_initiation_workers_worker_id", table_name="safety_work_initiation_workers")
    op.drop_index("ix_safety_work_initiation_workers_work_initiation_id", table_name="safety_work_initiation_workers")
    op.drop_table("safety_work_initiation_workers")
    op.drop_index("ix_safety_work_initiations_planned_end_at", table_name="safety_work_initiations")
    op.drop_index("ix_safety_work_initiations_planned_start_at", table_name="safety_work_initiations")
    op.drop_index("ix_safety_work_initiations_assigned_supervisor_id", table_name="safety_work_initiations")
    op.drop_index("ix_safety_work_initiations_assigned_department", table_name="safety_work_initiations")
    op.drop_index("ix_safety_work_initiations_location", table_name="safety_work_initiations")
    op.drop_index("ix_safety_work_initiations_related_incident_report_id", table_name="safety_work_initiations")
    op.drop_index("ix_safety_work_initiations_work_category", table_name="safety_work_initiations")
    op.drop_index("ix_safety_work_initiations_requester_id", table_name="safety_work_initiations")
    op.drop_index("ix_safety_work_initiations_status", table_name="safety_work_initiations")
    op.drop_index("ix_safety_work_initiations_reference", table_name="safety_work_initiations")
    op.drop_table("safety_work_initiations")
