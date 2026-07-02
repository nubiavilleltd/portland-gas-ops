"""add unit column to procurement_items

Revision ID: 9b0c1d2e3f4a
Revises: 8a9b0c1d2e3f
Create Date: 2026-06-30

Adds the unit column (e.g. 'units', 'litres', 'kg') to procurement_items.
The old table was created without this column; this migration adds it safely.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "9b0c1d2e3f4a"
down_revision: Union[str, None] = "8a9b0c1d2e3f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    from sqlalchemy import inspect
    conn = op.get_bind()
    existing_cols = {col["name"] for col in inspect(conn).get_columns("procurement_items")}
    if "unit" not in existing_cols:
        op.add_column(
            "procurement_items",
            sa.Column("unit", sa.String(20), nullable=True),
        )


def downgrade() -> None:
    op.drop_column("procurement_items", "unit")
