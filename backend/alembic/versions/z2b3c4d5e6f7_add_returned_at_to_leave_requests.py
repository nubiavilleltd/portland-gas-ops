"""add returned_at to leave_requests

Revision ID: z2b3c4d5e6f7
Revises: z1a2b3c4d5e6
Create Date: 2026-07-23

Open-ended leave (e.g. Sick Leave) is submitted without a fixed end date.
returned_at is stamped when the employee marks that they are back, which
finalizes the actual end date and the number of days.
"""
from alembic import op
import sqlalchemy as sa


revision = "z2b3c4d5e6f7"
down_revision = "z1a2b3c4d5e6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "leave_requests",
        sa.Column("returned_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("leave_requests", "returned_at")
