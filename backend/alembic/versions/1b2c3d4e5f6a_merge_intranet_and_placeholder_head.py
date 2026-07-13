"""merge intranet chain with safety closeouts head

Revision ID: 1b2c3d4e5f6a
Revises: 08b9c0d1e2f3, 0a1b2c3d4e5f
Create Date: 2026-07-10
"""

from typing import Union, Tuple
from alembic import op

revision: str = "1b2c3d4e5f6a"
down_revision: Union[str, Tuple[str, ...], None] = ("08b9c0d1e2f3", "0a1b2c3d4e5f")
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
