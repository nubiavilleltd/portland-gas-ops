"""add roadworthiness_expiry_date to vehicles

Revision ID: <run alembic heads to get current, use as down_revision>
Revises: 3f8a1c9e2b57
Create Date: 2026-07-11 09:30:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "7b4d9f1a6e23"
down_revision = "3f8a1c9e2b57"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "vehicles",
        sa.Column("roadworthiness_expiry_date", sa.Date(), nullable=True),
    )


def downgrade():
    op.drop_column("vehicles", "roadworthiness_expiry_date")