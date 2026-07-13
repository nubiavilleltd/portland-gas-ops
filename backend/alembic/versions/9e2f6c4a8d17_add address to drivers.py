"""add address to drivers

Revision ID: <run alembic heads to get current, use as down_revision>
Revises: 7b4d9f1a6e23
Create Date: 2026-07-12 10:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "9e2f6c4a8d17"
down_revision = "7b4d9f1a6e23"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "drivers",
        sa.Column("address", sa.String(500), nullable=True),
    )


def downgrade():
    op.drop_column("drivers", "address")