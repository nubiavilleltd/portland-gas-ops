"""add safety checklist templates

Revision ID: 8c9d0e1f2a3b
Revises: 7aa20a48e6a6
Create Date: 2026-06-26

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql


revision: str = "8c9d0e1f2a3b"
down_revision: Union[str, None] = "7aa20a48e6a6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


parent_type_enum = sa.Enum(
    "work_authorization",
    "work_closeout",
    "closeout_review",
    "incident_hse_review",
    "work_initiation",
    "incident_report",
    name="safetychecklistparenttype",
)
stage_enum = sa.Enum(
    "risk_assessment",
    "inspection",
    "monitoring",
    "hse_review",
    "completion",
    "closeout_review",
    name="safetycheckliststage",
)
input_type_enum = sa.Enum(
    "boolean",
    "text",
    "number",
    "date",
    "datetime",
    "enum",
    name="safetychecklistinputtype",
)


def upgrade() -> None:
    op.create_table(
        "safety_checklist_templates",
        sa.Column("id", mysql.CHAR(length=36), nullable=False),
        sa.Column("code", sa.String(length=100), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("parent_type", parent_type_enum, nullable=False),
        sa.Column("stage", stage_enum, nullable=False),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code", "version", name="uq_safety_checklist_templates_code_version"),
    )
    op.create_index(op.f("ix_safety_checklist_templates_code"), "safety_checklist_templates", ["code"], unique=False)
    op.create_index(op.f("ix_safety_checklist_templates_parent_type"), "safety_checklist_templates", ["parent_type"], unique=False)
    op.create_index(op.f("ix_safety_checklist_templates_stage"), "safety_checklist_templates", ["stage"], unique=False)
    op.create_index(op.f("ix_safety_checklist_templates_version"), "safety_checklist_templates", ["version"], unique=False)
    op.create_index(op.f("ix_safety_checklist_templates_is_active"), "safety_checklist_templates", ["is_active"], unique=False)

    op.create_table(
        "safety_checklist_items",
        sa.Column("id", mysql.CHAR(length=36), nullable=False),
        sa.Column("template_id", mysql.CHAR(length=36), nullable=False),
        sa.Column("item_key", sa.String(length=100), nullable=False),
        sa.Column("label", sa.String(length=255), nullable=False),
        sa.Column("input_type", input_type_enum, nullable=False),
        sa.Column("options_json", mysql.JSON(), nullable=True),
        sa.Column("default_value", sa.String(length=255), nullable=True),
        sa.Column("is_required", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("severity_weight", sa.Integer(), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["template_id"], ["safety_checklist_templates.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("template_id", "item_key", name="uq_safety_checklist_items_template_key"),
    )
    op.create_index(op.f("ix_safety_checklist_items_template_id"), "safety_checklist_items", ["template_id"], unique=False)

    op.create_table(
        "safety_checklist_responses",
        sa.Column("id", mysql.CHAR(length=36), nullable=False),
        sa.Column("template_id", mysql.CHAR(length=36), nullable=False),
        sa.Column("template_code_snapshot", sa.String(length=100), nullable=False),
        sa.Column("template_name_snapshot", sa.String(length=255), nullable=False),
        sa.Column("template_version", sa.Integer(), nullable=False),
        sa.Column("stage_snapshot", sa.String(length=100), nullable=False),
        sa.Column("item_id", mysql.CHAR(length=36), nullable=False),
        sa.Column("item_key_snapshot", sa.String(length=100), nullable=False),
        sa.Column("label_snapshot", sa.String(length=255), nullable=False),
        sa.Column("input_type_snapshot", sa.String(length=50), nullable=False),
        sa.Column("options_json_snapshot", mysql.JSON(), nullable=True),
        sa.Column("is_required_snapshot", sa.Boolean(), nullable=False),
        sa.Column("sort_order_snapshot", sa.Integer(), nullable=False),
        sa.Column("parent_type", parent_type_enum, nullable=False),
        sa.Column("parent_id", mysql.CHAR(length=36), nullable=False),
        sa.Column("response_group_id", mysql.CHAR(length=36), nullable=True),
        sa.Column("value_boolean", sa.Boolean(), nullable=True),
        sa.Column("value_text", sa.Text(), nullable=True),
        sa.Column("value_number", sa.Numeric(precision=18, scale=4), nullable=True),
        sa.Column("value_date", sa.Date(), nullable=True),
        sa.Column("value_datetime", sa.DateTime(timezone=True), nullable=True),
        sa.Column("selected_option", sa.String(length=100), nullable=True),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("answered_by", mysql.CHAR(length=36), nullable=False),
        sa.Column("answered_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["answered_by"], ["users.id"]),
        sa.ForeignKeyConstraint(["item_id"], ["safety_checklist_items.id"]),
        sa.ForeignKeyConstraint(["template_id"], ["safety_checklist_templates.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_safety_checklist_responses_template_id"), "safety_checklist_responses", ["template_id"], unique=False)
    op.create_index(op.f("ix_safety_checklist_responses_item_id"), "safety_checklist_responses", ["item_id"], unique=False)
    op.create_index(op.f("ix_safety_checklist_responses_parent_type"), "safety_checklist_responses", ["parent_type"], unique=False)
    op.create_index(op.f("ix_safety_checklist_responses_parent_id"), "safety_checklist_responses", ["parent_id"], unique=False)
    op.create_index(op.f("ix_safety_checklist_responses_response_group_id"), "safety_checklist_responses", ["response_group_id"], unique=False)
    op.create_index("ix_safety_checklist_responses_parent", "safety_checklist_responses", ["parent_type", "parent_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_safety_checklist_responses_parent", table_name="safety_checklist_responses")
    op.drop_index(op.f("ix_safety_checklist_responses_response_group_id"), table_name="safety_checklist_responses")
    op.drop_index(op.f("ix_safety_checklist_responses_parent_id"), table_name="safety_checklist_responses")
    op.drop_index(op.f("ix_safety_checklist_responses_parent_type"), table_name="safety_checklist_responses")
    op.drop_index(op.f("ix_safety_checklist_responses_item_id"), table_name="safety_checklist_responses")
    op.drop_index(op.f("ix_safety_checklist_responses_template_id"), table_name="safety_checklist_responses")
    op.drop_table("safety_checklist_responses")
    op.drop_index(op.f("ix_safety_checklist_items_template_id"), table_name="safety_checklist_items")
    op.drop_table("safety_checklist_items")
    op.drop_index(op.f("ix_safety_checklist_templates_is_active"), table_name="safety_checklist_templates")
    op.drop_index(op.f("ix_safety_checklist_templates_version"), table_name="safety_checklist_templates")
    op.drop_index(op.f("ix_safety_checklist_templates_stage"), table_name="safety_checklist_templates")
    op.drop_index(op.f("ix_safety_checklist_templates_parent_type"), table_name="safety_checklist_templates")
    op.drop_index(op.f("ix_safety_checklist_templates_code"), table_name="safety_checklist_templates")
    op.drop_table("safety_checklist_templates")
