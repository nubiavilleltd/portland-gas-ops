"""add is_uncapped and open_ended flags to leave_type_setup

Revision ID: z1a2b3c4d5e6
Revises: m8n9o0p1q2r3
Create Date: 2026-07-23

Adds two per-leave-type flags:
  - is_uncapped: no entitlement cap (e.g. Sick Leave)
  - open_ended:  no fixed End Date required (Start + optional Expected Return)
"""
from alembic import op
import sqlalchemy as sa


revision = "z1a2b3c4d5e6"
down_revision = "m8n9o0p1q2r3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "leave_type_setup",
        sa.Column("is_uncapped", sa.Boolean(), nullable=False, server_default="0"),
    )
    op.add_column(
        "leave_type_setup",
        sa.Column("open_ended", sa.Boolean(), nullable=False, server_default="0"),
    )


def downgrade() -> None:
    op.drop_column("leave_type_setup", "open_ended")
    op.drop_column("leave_type_setup", "is_uncapped")
