"""create all asset tables: categories, assets, requests, maintenance, types, assignment logs

Revision ID: c1d2e3f4a5b6
Revises: a0b1c2d3e4f5
Create Date: 2026-07-01

Creates all asset-related tables from scratch (asset migrations were never applied
to this DB).  The older migration files a1b2c3d4e5f6 and b2c3d4e5f678 are
superseded by this one — they will remain as dead branches and never run.

Tables created:
  - asset_categories
  - assets          (includes asset_tag, asset_type_id, location, attachment_id)
  - asset_requests
  - asset_request_items
  - asset_maintenance_logs
  - asset_types
  - asset_assignment_logs
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "c1d2e3f4a5b6"
down_revision: Union[str, None] = "a0b1c2d3e4f5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── 1. asset_categories ───────────────────────────────────────────────────
    op.create_table(
        "asset_categories",
        sa.Column("id",         sa.String(36),  primary_key=True),
        sa.Column("name",       sa.String(255), nullable=False, unique=True),
        sa.Column("colour",     sa.String(7),   nullable=False, server_default="#6b7280"),
        sa.Column("is_active",  sa.Boolean(),   nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(),  server_default=sa.text("CURRENT_TIMESTAMP")),
    )

    # ── 2. asset_types ────────────────────────────────────────────────────────
    op.create_table(
        "asset_types",
        sa.Column("id",          sa.String(36),  primary_key=True),
        sa.Column("category_id", sa.String(36),  sa.ForeignKey("asset_categories.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name",        sa.String(255), nullable=False),
        sa.Column("prefix",      sa.String(10),  nullable=False),
        sa.Column("is_active",   sa.Boolean(),   nullable=False, server_default="1"),
        sa.Column("created_at",  sa.DateTime(),  server_default=sa.text("CURRENT_TIMESTAMP")),
    )

    # ── 3. assets ─────────────────────────────────────────────────────────────
    op.create_table(
        "assets",
        sa.Column("id",                          sa.String(36),    primary_key=True),
        sa.Column("name",                        sa.String(255),   nullable=False),
        sa.Column("category_id",                 sa.String(36),    sa.ForeignKey("asset_categories.id"), nullable=True),
        sa.Column("asset_type_id",               sa.String(36),    sa.ForeignKey("asset_types.id", ondelete="SET NULL"), nullable=True),
        sa.Column("asset_tag",                   sa.String(50),    nullable=True, unique=True),
        sa.Column("serial_number",               sa.String(255),   nullable=True),
        sa.Column("purchase_date",               sa.Date(),        nullable=True),
        sa.Column("purchase_cost",               sa.Numeric(12,2), nullable=True),
        sa.Column("condition",                   sa.Enum("new","good","fair","poor", name="assetcondition"), nullable=False, server_default="good"),
        sa.Column("status",                      sa.Enum("available","in_use","under_maintenance","decommissioned", name="assetstatus"), nullable=False, server_default="available"),
        sa.Column("attachment_id",               sa.Integer(),     sa.ForeignKey("documents.id", ondelete="SET NULL"), nullable=True),
        sa.Column("description",                 sa.Text(),        nullable=True),
        sa.Column("assigned_to",                 sa.String(36),    nullable=True),   # employee ID
        sa.Column("location",                    sa.String(255),   nullable=True),
        sa.Column("total_quantity",              sa.Integer(),     nullable=False, server_default="1"),
        sa.Column("available_quantity",          sa.Integer(),     nullable=False, server_default="1"),
        sa.Column("low_stock_threshold",         sa.Integer(),     nullable=False, server_default="1"),
        sa.Column("maintenance_type",            sa.Enum("routine","inspection","calibration","repair", name="maintenancetype"), nullable=True),
        sa.Column("maintenance_frequency_months",sa.Integer(),     nullable=True),
        sa.Column("next_maintenance_due",        sa.Date(),        nullable=True),
        sa.Column("added_by",                    sa.String(36),    sa.ForeignKey("users.id"), nullable=True),
        sa.Column("is_active",                   sa.Boolean(),     nullable=False, server_default="1"),
        sa.Column("created_at",                  sa.DateTime(),    server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at",                  sa.DateTime(),    server_default=sa.text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")),
    )

    # ── 4. asset_requests ─────────────────────────────────────────────────────
    op.create_table(
        "asset_requests",
        sa.Column("id",               sa.String(36),  primary_key=True),
        sa.Column("reference",        sa.String(50),  nullable=False, unique=True),
        sa.Column("request_type",     sa.Enum("loan","requisition"), nullable=False),
        sa.Column("purpose",          sa.Text(),      nullable=False),
        sa.Column("return_date",      sa.Date(),      nullable=True),
        sa.Column("status",           sa.Enum("pending","approved","rejected","returned"), nullable=False, server_default="pending"),
        sa.Column("rejection_reason", sa.Text(),      nullable=True),
        sa.Column("requested_by",     sa.String(36),  sa.ForeignKey("users.id"), nullable=False),
        sa.Column("approved_by",      sa.String(36),  sa.ForeignKey("users.id"), nullable=True),
        sa.Column("approved_at",      sa.DateTime(),  nullable=True),
        sa.Column("is_active",        sa.Boolean(),   nullable=False, server_default="1"),
        sa.Column("created_at",       sa.DateTime(),  server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at",       sa.DateTime(),  server_default=sa.text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")),
    )

    # ── 5. asset_request_items ────────────────────────────────────────────────
    op.create_table(
        "asset_request_items",
        sa.Column("id",         sa.String(36), primary_key=True),
        sa.Column("request_id", sa.String(36), sa.ForeignKey("asset_requests.id"), nullable=False),
        sa.Column("asset_id",   sa.String(36), sa.ForeignKey("assets.id"),         nullable=False),
        sa.Column("quantity",   sa.Integer(),  nullable=False, server_default="1"),
        sa.Column("notes",      sa.Text(),     nullable=True),
    )

    # ── 6. asset_maintenance_logs ─────────────────────────────────────────────
    op.create_table(
        "asset_maintenance_logs",
        sa.Column("id",               sa.String(36),    primary_key=True),
        sa.Column("asset_id",         sa.String(36),    sa.ForeignKey("assets.id"), nullable=False),
        sa.Column("performed_date",   sa.Date(),        nullable=False),
        sa.Column("maintenance_type", sa.Enum("routine","inspection","calibration","repair", name="maintenancetype"), nullable=False),
        sa.Column("technician",       sa.String(255),   nullable=True),
        sa.Column("cost",             sa.Numeric(12,2), nullable=True),
        sa.Column("notes",            sa.Text(),        nullable=True),
        sa.Column("logged_by",        sa.String(36),    sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at",       sa.DateTime(),    server_default=sa.text("CURRENT_TIMESTAMP")),
    )

    # ── 7. asset_assignment_logs ──────────────────────────────────────────────
    op.create_table(
        "asset_assignment_logs",
        sa.Column("id",                 sa.String(36),  primary_key=True),
        sa.Column("asset_id",           sa.String(36),  sa.ForeignKey("assets.id", ondelete="CASCADE"), nullable=False),
        sa.Column("asset_tag",          sa.String(50),  nullable=True),
        sa.Column("event_type",         sa.Enum(
            "registered","assigned","transferred","returned","status_changed",
            name="assetassignmenteventtype",
        ), nullable=False),
        sa.Column("from_employee_id",   sa.String(36),  nullable=True),
        sa.Column("from_employee_name", sa.String(255), nullable=True),
        sa.Column("from_location",      sa.String(255), nullable=True),
        sa.Column("to_employee_id",     sa.String(36),  nullable=True),
        sa.Column("to_employee_name",   sa.String(255), nullable=True),
        sa.Column("to_location",        sa.String(255), nullable=True),
        sa.Column("notes",              sa.Text(),      nullable=True),
        sa.Column("performed_by",       sa.String(36),  sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("performed_at",       sa.DateTime(),  server_default=sa.text("CURRENT_TIMESTAMP")),
    )


def downgrade() -> None:
    op.drop_table("asset_assignment_logs")
    op.drop_table("asset_maintenance_logs")
    op.drop_table("asset_request_items")
    op.drop_table("asset_requests")
    op.drop_table("assets")
    op.drop_table("asset_types")
    op.drop_table("asset_categories")
