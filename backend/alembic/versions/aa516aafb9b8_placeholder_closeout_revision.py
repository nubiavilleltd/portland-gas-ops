"""placeholder for previously applied closeout revision

Revision ID: aa516aafb9b8
Revises: 0a1b2c3d4e5f
Create Date: 2026-07-09
"""
from typing import Sequence, Union


revision: str = "aa516aafb9b8"
down_revision: Union[str, None] = "0a1b2c3d4e5f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
