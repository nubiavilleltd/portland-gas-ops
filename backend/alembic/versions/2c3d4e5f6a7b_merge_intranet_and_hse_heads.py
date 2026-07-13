"""merge intranet chain and hse incident workflow head

Revision ID: 2c3d4e5f6a7b
Revises: 1b2c3d4e5f6a, e9f0a1b2c3d4
Create Date: 2026-07-10
"""

from typing import Union, Tuple
from alembic import op

revision: str = "2c3d4e5f6a7b"
down_revision: Union[str, Tuple[str, ...], None] = ("1b2c3d4e5f6a", "e9f0a1b2c3d4")
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
