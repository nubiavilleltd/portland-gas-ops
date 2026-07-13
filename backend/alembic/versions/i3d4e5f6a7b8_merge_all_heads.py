"""merge all heads

Revision ID: i3d4e5f6a7b8
Revises: 7b4d9f1a6e23, h2c3d4e5f6a7
Create Date: 2026-07-13 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'i3d4e5f6a7b8'
down_revision = ('7b4d9f1a6e23', 'h2c3d4e5f6a7')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
