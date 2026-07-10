"""revamp procurement tables — new schema with purchase_orders

Revision ID: b9c0d1e2f3a4
Revises: 7aa20a48e6a6
Create Date: 2026-06-26

Drops the old procurement_items and procurement_requests tables (old schema
had wrong FK targets, wrong status values, and no purchase_orders table).
Recreates all three tables aligned with the new domain design:
  - procurement_requests  (raised_by → employees, status as VARCHAR)
  - procurement_items     (unit_price / total_price, no unit enum)
  - purchase_orders       (new — links PO PDF via document_id)
"""

from alembic import op
import sqlalchemy as sa


revision = "b9c0d1e2f3a4"
down_revision = "7aa20a48e6a6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop old tables if they exist (child first to respect FK constraints)
    op.execute("DROP TABLE IF EXISTS procurement_items")
    op.execute("DROP TABLE IF EXISTS procurement_requests")

    # procurement_requests
    op.create_table(
        "procurement_requests",
        sa.Column("id", sa.CHAR(36), primary_key=True),
        sa.Column("reference", sa.String(20), nullable=False, unique=True),
        sa.Column("raised_by", sa.CHAR(36), sa.ForeignKey("employees.id"), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("estimated_amount", sa.Numeric(15, 2), nullable=True),
        sa.Column("currency", sa.String(5), nullable=False, server_default="NGN"),
        sa.Column("vendor_id", sa.CHAR(36), sa.ForeignKey("vendors.id"), nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default="draft"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(),
                  onupdate=sa.func.now()),
    )

    # procurement_items
    op.create_table(
        "procurement_items",
        sa.Column("id", sa.CHAR(36), primary_key=True),
        sa.Column("procurement_request_id", sa.CHAR(36),
                  sa.ForeignKey("procurement_requests.id"), nullable=False),
        sa.Column("description", sa.String(255), nullable=False),
        sa.Column("quantity", sa.Integer, nullable=False),
        sa.Column("unit_price", sa.Numeric(15, 2), nullable=True),
        sa.Column("total_price", sa.Numeric(15, 2), nullable=True),
    )

    # purchase_orders (new)
    op.create_table(
        "purchase_orders",
        sa.Column("id", sa.CHAR(36), primary_key=True),
        sa.Column("po_number", sa.String(20), nullable=False, unique=True),
        sa.Column("procurement_request_id", sa.CHAR(36),
                  sa.ForeignKey("procurement_requests.id"), nullable=False),
        sa.Column("vendor_id", sa.CHAR(36), sa.ForeignKey("vendors.id"), nullable=False),
        sa.Column("total_amount", sa.Numeric(15, 2), nullable=False),
        sa.Column("currency", sa.String(5), nullable=False, server_default="NGN"),
        sa.Column("issued_by", sa.CHAR(36), sa.ForeignKey("employees.id"), nullable=False),
        sa.Column("issued_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("status", sa.String(20), nullable=False, server_default="issued"),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("document_id", sa.Integer, sa.ForeignKey("documents.id"), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("purchase_orders")
    op.drop_table("procurement_items")
    op.drop_table("procurement_requests")

    # Restore old tables (minimal — enough to not break Alembic history)
    op.create_table(
        "procurement_requests",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("reference", sa.String(50), nullable=False, unique=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("created_by", sa.String(36), nullable=False),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now()),
    )
    op.create_table(
        "procurement_items",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("request_id", sa.String(36),
                  sa.ForeignKey("procurement_requests.id"), nullable=False),
        sa.Column("description", sa.String(500), nullable=False),
        sa.Column("quantity", sa.Numeric(12, 2), nullable=False),
        sa.Column("unit_cost", sa.Numeric(15, 2), nullable=False),
        sa.Column("total_cost", sa.Numeric(15, 2), nullable=False),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )
