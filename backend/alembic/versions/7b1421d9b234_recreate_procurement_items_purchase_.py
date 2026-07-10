"""recreate procurement_items; add category, required_by, unit

Revision ID: 7b1421d9b234
Revises: 7f8a9b0c1d2e
Create Date: 2026-06-30

Manually written — creates procurement_items with the current domain schema
and adds the missing category / required_by columns to procurement_requests.
Does NOT touch any other tables or indexes.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

revision: str = "7b1421d9b234"
down_revision: Union[str, None] = "7f8a9b0c1d2e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    from sqlalchemy import inspect
    from alembic import op as _op
    conn = _op.get_bind()
    inspector = inspect(conn)

    # ── Add missing columns to procurement_requests (skip if already exist) ───
    existing_cols = {col["name"] for col in inspector.get_columns("procurement_requests")}
    if "category" not in existing_cols:
        op.add_column("procurement_requests", sa.Column("category",    sa.String(50), nullable=True))
    if "required_by" not in existing_cols:
        op.add_column("procurement_requests", sa.Column("required_by", sa.Date(),     nullable=True))

    # ── Recreate procurement_items with unit column (skip if already exists) ──
    existing_tables = inspector.get_table_names()
    if "procurement_items" not in existing_tables:
        op.create_table(
            "procurement_items",
            sa.Column("id", mysql.CHAR(36), primary_key=True),
            sa.Column(
                "procurement_request_id",
                mysql.CHAR(36),
                sa.ForeignKey("procurement_requests.id"),
                nullable=False,
            ),
            sa.Column("description", sa.String(255), nullable=False),
            sa.Column("quantity",    sa.Integer,     nullable=False),
            sa.Column("unit",        sa.String(20),  nullable=True),
            sa.Column("unit_price",  sa.Numeric(15, 2), nullable=True),
            sa.Column("total_price", sa.Numeric(15, 2), nullable=True),
        )


def downgrade() -> None:
    op.drop_table("procurement_items")
    op.drop_column("procurement_requests", "required_by")
    op.drop_column("procurement_requests", "category")
