"""cleanup invalid reference counters

Revision ID: 2b3c4d5e6f71
Revises: 1a2b3c4d5e70
Create Date: 2026-06-27

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "2b3c4d5e6f71"
down_revision: Union[str, None] = "1a2b3c4d5e70"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        sa.text(
            """
            DELETE FROM reference_counters
            WHERE entity_type = 'incident_report'
            AND (year < 2000 OR year > 2099)
            """
        )
    )


def downgrade() -> None:
    pass
