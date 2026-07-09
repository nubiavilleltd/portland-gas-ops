"""merge dev and workflow heads

Revision ID: 7863f1e40518
Revises: 39ab6d6c37f0, f4a5b6c7d8e9
Create Date: 2026-07-03 08:35:35.197001

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7863f1e40518'
down_revision: Union[str, None] = ('39ab6d6c37f0', 'f4a5b6c7d8e9')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
