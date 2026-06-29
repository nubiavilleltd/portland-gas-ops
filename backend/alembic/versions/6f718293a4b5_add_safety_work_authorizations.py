"""add safety work authorizations

Revision ID: 6f718293a4b5
Revises: 5e6f718293a4
Create Date: 2026-06-29

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql


revision: str = "6f718293a4b5"
down_revision: Union[str, None] = "5e6f718293a4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


work_authorization_status_enum = sa.Enum(
    "draft",
    "submitted",
    "approved",
    "returned",
    "denied",
    name="workauthorizationstatus",
)
work_authorization_decision_enum = sa.Enum(
    "approve",
    "return",
    "deny",
    name="workauthorizationdecision",
)
inspection_check_enum = sa.Enum(
    "pass",
    "fail",
    "not_applicable",
    name="workauthorizationinspectioncheck",
)
inspection_result_enum = sa.Enum(
    "passed",
    "returned",
    "failed",
    name="workauthorizationinspectionresult",
)


def upgrade() -> None:
    op.create_table(
        "safety_work_authorizations",
        sa.Column("id", mysql.CHAR(length=36), nullable=False),
        sa.Column("reference", sa.String(length=50), nullable=False),
        sa.Column("status", work_authorization_status_enum, nullable=False),
        sa.Column("requester_id", mysql.CHAR(length=36), nullable=False),
        sa.Column("work_initiation_id", mysql.CHAR(length=36), nullable=False),
        sa.Column("gas_involved", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("pressurized_system", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("heat_or_sparks", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("electrical_isolation", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("lifting_equipment", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("ppe_available", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("additional_safety_note", sa.Text(), nullable=True),
        sa.Column("attachment_notes", sa.Text(), nullable=True),
        sa.Column("attachments_json", mysql.JSON(), nullable=True),
        sa.Column("hse_inspector_id", mysql.CHAR(length=36), nullable=True),
        sa.Column("work_area_safe", inspection_check_enum, nullable=True),
        sa.Column("emergency_equipment_available", inspection_check_enum, nullable=True),
        sa.Column("gas_pressure_check_completed", inspection_check_enum, nullable=True),
        sa.Column("ppe_and_safety_kits_available", inspection_check_enum, nullable=True),
        sa.Column("safety_controls_in_place", inspection_check_enum, nullable=True),
        sa.Column("hse_inspection_result", inspection_result_enum, nullable=True),
        sa.Column("hse_inspection_comment", sa.Text(), nullable=True),
        sa.Column("hse_evidence_json", mysql.JSON(), nullable=True),
        sa.Column("hse_decision", work_authorization_decision_enum, nullable=True),
        sa.Column("hse_decision_comment", sa.Text(), nullable=True),
        sa.Column("hse_decided_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("requested_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["hse_inspector_id"], ["employees.id"]),
        sa.ForeignKeyConstraint(["requester_id"], ["employees.id"]),
        sa.ForeignKeyConstraint(["work_initiation_id"], ["safety_work_initiations.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_safety_work_authorizations_reference", "safety_work_authorizations", ["reference"], unique=True)
    op.create_index("ix_safety_work_authorizations_status", "safety_work_authorizations", ["status"], unique=False)
    op.create_index("ix_safety_work_authorizations_requester_id", "safety_work_authorizations", ["requester_id"], unique=False)
    op.create_index("ix_safety_work_authorizations_work_initiation_id", "safety_work_authorizations", ["work_initiation_id"], unique=False)
    op.create_index("ix_safety_work_authorizations_hse_inspector_id", "safety_work_authorizations", ["hse_inspector_id"], unique=False)
    op.create_index("ix_safety_work_authorizations_gas_involved", "safety_work_authorizations", ["gas_involved"], unique=False)
    op.create_index("ix_safety_work_authorizations_is_active", "safety_work_authorizations", ["is_active"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_safety_work_authorizations_is_active", table_name="safety_work_authorizations")
    op.drop_index("ix_safety_work_authorizations_gas_involved", table_name="safety_work_authorizations")
    op.drop_index("ix_safety_work_authorizations_hse_inspector_id", table_name="safety_work_authorizations")
    op.drop_index("ix_safety_work_authorizations_work_initiation_id", table_name="safety_work_authorizations")
    op.drop_index("ix_safety_work_authorizations_requester_id", table_name="safety_work_authorizations")
    op.drop_index("ix_safety_work_authorizations_status", table_name="safety_work_authorizations")
    op.drop_index("ix_safety_work_authorizations_reference", table_name="safety_work_authorizations")
    op.drop_table("safety_work_authorizations")
