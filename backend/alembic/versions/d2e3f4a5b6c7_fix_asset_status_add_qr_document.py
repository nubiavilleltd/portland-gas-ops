"""fix asset status enum in->assigned, add qr_document_id to assets

Revision ID: d2e3f4a5b6c7
Revises: c1d2e3f4a5b6
Create Date: 2026-07-01
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "d2e3f4a5b6c7"
down_revision: Union[str, None] = "c1d2e3f4a5b6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Fix status enum: in_use → assigned
    op.execute(
        "ALTER TABLE assets MODIFY COLUMN status "
        "ENUM('available','assigned','under_maintenance','decommissioned') "
        "NOT NULL DEFAULT 'available'"
    )
    # Add qr_document_id
    op.add_column(
        "assets",
        sa.Column("qr_document_id", sa.Integer(), sa.ForeignKey("documents.id", ondelete="SET NULL"), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("assets", "qr_document_id")
    op.execute(
        "ALTER TABLE assets MODIFY COLUMN status "
        "ENUM('available','in_use','under_maintenance','decommissioned') "
        "NOT NULL DEFAULT 'available'"
    )
