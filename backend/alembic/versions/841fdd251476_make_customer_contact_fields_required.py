"""make customer contact fields required

Revision ID: 841fdd251476
Revises: 0a1b2c3d4e5f
Create Date: 2026-07-07 15:09:38.000066

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '841fdd251476'
down_revision: Union[str, None] = '0a1b2c3d4e5f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "customers",
        "email",
        existing_type=sa.String(length=255),
        existing_nullable=True,
        nullable=False,
    )

    op.alter_column(
        "customers",
        "phone",
        existing_type=sa.String(length=50),
        existing_nullable=True,
        nullable=False,
    )

    op.alter_column(
        "customers",
        "address",
        existing_type=sa.String(length=500),
        existing_nullable=True,
        nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "customers",
        "address",
        existing_type=sa.String(length=500),
        existing_nullable=False,
        nullable=True,
    )

    op.alter_column(
        "customers",
        "phone",
        existing_type=sa.String(length=50),
        existing_nullable=False,
        nullable=True,
    )

    op.alter_column(
        "customers",
        "email",
        existing_type=sa.String(length=255),
        existing_nullable=False,
        nullable=True,
    )