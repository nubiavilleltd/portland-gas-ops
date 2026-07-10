"""placeholder closeout revision from dev database

Revision ID: f7a8b9c0d1e2
Revises: c4e5f6a7b8d0
Create Date: 2026-07-10
"""
from typing import Sequence, Union


revision: str = "f7a8b9c0d1e2"
down_revision: Union[str, None] = "c4e5f6a7b8d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
