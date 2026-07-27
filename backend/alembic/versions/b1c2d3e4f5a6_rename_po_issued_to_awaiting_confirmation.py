"""rename procurement status po_issued to awaiting_confirmation

Revision ID: b1c2d3e4f5a6
Revises: a0b1c2d3e4f5
Create Date: 2026-07-06
"""
from typing import Sequence, Tuple, Union
from alembic import op
import sqlalchemy as sa

revision: str = "b1c2d3e4f5a6"
down_revision: Union[str, Tuple[str, ...], None] = ("7863f1e40518", "a0b1c2d3e4f5")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "UPDATE procurement_requests SET status = 'awaiting_confirmation' WHERE status = 'po_issued'"
    )


def downgrade() -> None:
    op.execute(
        "UPDATE procurement_requests SET status = 'po_issued' WHERE status = 'awaiting_confirmation'"
    )
