"""add vendor_type column to vendors

Revision ID: c0d1e2f3a4b5
Revises: b9c0d1e2f3a4
Create Date: 2026-06-26

Adds vendor_type VARCHAR(15) NOT NULL DEFAULT 'permanent' to the vendors table.
  permanent — vendors added by an admin (verified supplier list)
  temporary — vendors created inline during a procurement request by a regular user
"""

from alembic import op
import sqlalchemy as sa


revision = "c0d1e2f3a4b5"
down_revision = "b9c0d1e2f3a4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "vendors",
        sa.Column(
            "vendor_type",
            sa.String(15),
            nullable=False,
            server_default="permanent",
        ),
    )


def downgrade() -> None:
    op.drop_column("vendors", "vendor_type")
