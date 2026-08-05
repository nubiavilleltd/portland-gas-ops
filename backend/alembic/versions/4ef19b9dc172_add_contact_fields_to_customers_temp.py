"""add contact fields to customers_temp

Revision ID: 4ef19b9dc172
Revises: z5e6f7a8b9c0
Create Date: 2026-08-05 14:11:34.851007

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4ef19b9dc172'
down_revision: Union[str, None] = 'z5e6f7a8b9c0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade():


    op.add_column(
        "customers_temp",
        sa.Column("position", sa.String(length=100), nullable=True),
    )

    op.add_column(
        "customers_temp",
        sa.Column("role", sa.String(length=100), nullable=True),
    )

    op.add_column(
        "customers_temp",
        sa.Column(
            "preferred_channel",
            sa.String(length=20),
            nullable=True,
        ),
    )


def downgrade():
    op.drop_column("customers_temp", "preferred_channel")
    op.drop_column("customers_temp", "role")
    op.drop_column("customers_temp", "position")
