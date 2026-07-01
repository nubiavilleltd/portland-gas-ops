"""merge safety and vendor heads

Revision ID: 7f8a9b0c1d2e
Revises: 6f718293a4b5, 7a773bc70322
Create Date: 2026-06-29

"""
from typing import Sequence, Union


revision: str = "7f8a9b0c1d2e"
down_revision: Union[str, tuple[str, str], None] = (
    "6f718293a4b5",
    "7a773bc70322",
)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
