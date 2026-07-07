"""add safety work closeouts

Revision ID: 0a1b2c3d4e5f
Revises: b1c2d3e4f5a6
Create Date: 2026-07-03

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql


revision: str = "0a1b2c3d4e5f"
down_revision: Union[str, None] = "b1c2d3e4f5a6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


work_closeout_status_enum = sa.Enum(
    "draft",
    "submitted",
    "pending",
    "returned",
    "denied",
    "approved",
    "acknowledged",
    name="workcloseoutstatus",
)
work_closeout_decision_enum = sa.Enum(
    "approve",
    "acknowledge",
    "return",
    "deny",
    name="workcloseoutdecision",
)
work_closeout_answer_enum = sa.Enum(
    "yes",
    "no",
    "not_applicable",
    name="workcloseoutanswer",
)


def upgrade() -> None:
    op.create_table(
        "safety_work_closeouts",
        sa.Column("id", mysql.CHAR(length=36), nullable=False),
        sa.Column("reference", sa.String(length=50), nullable=False),
        sa.Column("status", work_closeout_status_enum, nullable=False),
        sa.Column("requester_id", mysql.CHAR(length=36), nullable=False),
        sa.Column("work_authorization_id", mysql.CHAR(length=36), nullable=False),
        sa.Column("actual_start_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("actual_completion_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("work_completed", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("completed_as_approved", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("deviation_explanation", sa.Text(), nullable=True),
        sa.Column("completion_summary", sa.Text(), nullable=False),
        sa.Column("incident_observed", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("incident_note", sa.Text(), nullable=True),
        sa.Column("completion_notes", sa.Text(), nullable=True),
        sa.Column("monitored_during_execution", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("stayed_within_scope", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("ppe_and_controls_maintained", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("unsafe_condition_addressed", work_closeout_answer_enum, nullable=False),
        sa.Column("monitoring_comment", sa.Text(), nullable=True),
        sa.Column("work_area_cleaned", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("tools_removed", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("system_safe", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("remaining_hazard", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("remaining_hazard_details", sa.Text(), nullable=True),
        sa.Column("submitted_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["requester_id"], ["employees.id"]),
        sa.ForeignKeyConstraint(["work_authorization_id"], ["safety_work_authorizations.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_safety_work_closeouts_reference", "safety_work_closeouts", ["reference"], unique=True)
    op.create_index("ix_safety_work_closeouts_status", "safety_work_closeouts", ["status"], unique=False)
    op.create_index("ix_safety_work_closeouts_requester_id", "safety_work_closeouts", ["requester_id"], unique=False)
    op.create_index("ix_safety_work_closeouts_work_authorization_id", "safety_work_closeouts", ["work_authorization_id"], unique=False)
    op.create_index("ix_safety_work_closeouts_actual_start_at", "safety_work_closeouts", ["actual_start_at"], unique=False)
    op.create_index("ix_safety_work_closeouts_actual_completion_at", "safety_work_closeouts", ["actual_completion_at"], unique=False)
    op.create_index("ix_safety_work_closeouts_is_active", "safety_work_closeouts", ["is_active"], unique=False)

    op.create_table(
        "safety_closeout_reviews",
        sa.Column("id", mysql.CHAR(length=36), nullable=False),
        sa.Column("work_closeout_id", mysql.CHAR(length=36), nullable=False),
        sa.Column("reviewer_role", sa.String(length=100), nullable=False),
        sa.Column("reviewer_id", mysql.CHAR(length=36), nullable=False),
        sa.Column("decision", work_closeout_decision_enum, nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("verified_close_out", sa.Boolean(), nullable=True),
        sa.Column("area_safe_for_operations", sa.Boolean(), nullable=True),
        sa.Column("corrective_action_required", sa.Boolean(), nullable=True),
        sa.Column("corrective_action_details", sa.Text(), nullable=True),
        sa.Column("decided_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["reviewer_id"], ["employees.id"]),
        sa.ForeignKeyConstraint(["work_closeout_id"], ["safety_work_closeouts.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "work_closeout_id",
            "reviewer_role",
            name="uq_safety_closeout_reviews_closeout_role",
        ),
    )
    op.create_index("ix_safety_closeout_reviews_work_closeout_id", "safety_closeout_reviews", ["work_closeout_id"], unique=False)
    op.create_index("ix_safety_closeout_reviews_reviewer_role", "safety_closeout_reviews", ["reviewer_role"], unique=False)
    op.create_index("ix_safety_closeout_reviews_reviewer_id", "safety_closeout_reviews", ["reviewer_id"], unique=False)
    op.create_index("ix_safety_closeout_reviews_decision", "safety_closeout_reviews", ["decision"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_safety_closeout_reviews_decision", table_name="safety_closeout_reviews")
    op.drop_index("ix_safety_closeout_reviews_reviewer_id", table_name="safety_closeout_reviews")
    op.drop_index("ix_safety_closeout_reviews_reviewer_role", table_name="safety_closeout_reviews")
    op.drop_index("ix_safety_closeout_reviews_work_closeout_id", table_name="safety_closeout_reviews")
    op.drop_table("safety_closeout_reviews")
    op.drop_index("ix_safety_work_closeouts_is_active", table_name="safety_work_closeouts")
    op.drop_index("ix_safety_work_closeouts_actual_completion_at", table_name="safety_work_closeouts")
    op.drop_index("ix_safety_work_closeouts_actual_start_at", table_name="safety_work_closeouts")
    op.drop_index("ix_safety_work_closeouts_work_authorization_id", table_name="safety_work_closeouts")
    op.drop_index("ix_safety_work_closeouts_requester_id", table_name="safety_work_closeouts")
    op.drop_index("ix_safety_work_closeouts_status", table_name="safety_work_closeouts")
    op.drop_index("ix_safety_work_closeouts_reference", table_name="safety_work_closeouts")
    op.drop_table("safety_work_closeouts")
