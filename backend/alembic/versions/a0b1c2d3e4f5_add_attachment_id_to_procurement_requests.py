"""add attachment_id; drop title from procurement_requests

Revision ID: a0b1c2d3e4f5
Revises: 9b0c1d2e3f4a
Create Date: 2026-06-30
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "a0b1c2d3e4f5"
down_revision: Union[str, None] = "9b0c1d2e3f4a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "procurement_requests",
        sa.Column("attachment_id", sa.Integer(), sa.ForeignKey("documents.id", ondelete="SET NULL"), nullable=True),
    )
    op.drop_column("procurement_requests", "title")


def downgrade() -> None:
    op.drop_column("procurement_requests", "attachment_id")
    # Restore title as nullable so existing rows are not rejected
    op.add_column(
        "procurement_requests",
        sa.Column("title", sa.String(200), nullable=True),
    )
