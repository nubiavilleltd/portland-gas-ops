"""update_procurement_status_enum

Revision ID: 24ccead2af60
Revises: 2144ff5b9113
Create Date: 2026-05-15 12:41:16.023792

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '24ccead2af60'
down_revision: Union[str, None] = '2144ff5b9113'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # MySQL ENUM changes require an explicit ALTER COLUMN.
    # Old values: draft, pending, in_progress, approved, rejected, completed, cancelled
    # New values: draft, submitted, ordered, delivered, cancelled
    # We first migrate any existing rows to map old statuses to new ones,
    # then alter the column type.
    op.execute("""
        UPDATE procurement_requests SET status = 'draft'
        WHERE status IN ('pending', 'in_progress', 'approved', 'rejected', 'completed')
    """)
    op.execute("""
        ALTER TABLE procurement_requests
        MODIFY COLUMN status ENUM('draft','submitted','ordered','delivered','cancelled')
        NOT NULL DEFAULT 'draft'
    """)


def downgrade() -> None:
    op.execute("""
        ALTER TABLE procurement_requests
        MODIFY COLUMN status ENUM('draft','pending','in_progress','approved','rejected','completed','cancelled')
        NOT NULL DEFAULT 'draft'
    """)
