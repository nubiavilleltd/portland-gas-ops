"""add notice_days to leave_type_setup

Revision ID: nd1c2e3f4a5b6
Revises: f4c8a1d7e2b9
Create Date: 2026-07-31

Adds a per-leave-type minimum-notice window (calendar days). A leave request of
this type cannot start within `notice_days` of today. 0 = no notice period.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "nd1c2e3f4a5b6"
down_revision: Union[str, None] = "f4c8a1d7e2b9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "leave_type_setup",
        sa.Column("notice_days", sa.Integer(), nullable=False, server_default="0"),
    )


def downgrade() -> None:
    op.drop_column("leave_type_setup", "notice_days")
