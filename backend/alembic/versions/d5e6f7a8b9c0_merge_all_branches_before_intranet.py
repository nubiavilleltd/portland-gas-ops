"""merge all branches before intranet

Revision ID: d5e6f7a8b9c0
Revises: aa516aafb9b8, 7863f1e40518, c4e5f6a7b8d0, 7a773bc70322, 6f718293a4b5
Create Date: 2026-07-09

"""
from typing import Union, Tuple
from alembic import op


revision: str = "d5e6f7a8b9c0"
down_revision: Union[str, Tuple[str, ...], None] = (
    "aa516aafb9b8",
    "7863f1e40518",
    "c4e5f6a7b8d0",
    "7a773bc70322",
    "6f718293a4b5",
)
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
