"""create customers table

Revision ID: 152cf9f7bf70
Revises: b2adc4f96605
Create Date: 2026-08-12 14:54:13.411789
"""

from typing import Sequence, Union

from alembic import op


revision: str = "152cf9f7bf70"
down_revision: Union[str, None] = "b2adc4f96605"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.rename_table("customers_temp", "customers")


def downgrade() -> None:
    op.rename_table("customers", "customers_temp")