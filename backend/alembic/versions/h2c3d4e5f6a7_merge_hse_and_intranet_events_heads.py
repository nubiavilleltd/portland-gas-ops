"""merge hse and intranet events heads

Revision ID: h2c3d4e5f6a7
Revises: 2c3d4e5f6a7b, g1b2c3d4e5f6
Create Date: 2026-07-13 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'h2c3d4e5f6a7'
down_revision = ('2c3d4e5f6a7b', 'g1b2c3d4e5f6')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
