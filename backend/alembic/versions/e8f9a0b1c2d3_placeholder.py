"""placeholder — migration applied to DB but file was missing from repo

Revision ID: e8f9a0b1c2d3
Revises: b2c3d4e5f678
Create Date: 2026-05-20 00:00:00.000000
"""
from typing import Sequence, Union

revision: str = "e8f9a0b1c2d3"
down_revision: Union[str, None] = "b2c3d4e5f678"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
