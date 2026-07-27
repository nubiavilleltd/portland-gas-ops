"""merge all final heads

Revision ID: j4e5f6a7b8c9
Revises: 9e2f6c4a8d17, i3d4e5f6a7b8
Create Date: 2026-07-13 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'j4e5f6a7b8c9'
down_revision = ('9e2f6c4a8d17', 'i3d4e5f6a7b8')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
