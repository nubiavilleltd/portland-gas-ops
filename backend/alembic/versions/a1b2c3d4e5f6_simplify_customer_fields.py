"""simplify customer fields

Revision ID: b7c8d9e0f1a2
Revises: f6a7b8c9d0e1
Create Date: 2026-10-18 23:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql


# revision identifiers, used by Alembic.
revision: str = 'b7c8d9e0f1a2'
down_revision: Union[str, None] = 'f6a7b8c9d0e1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop the category column entirely
    op.drop_column('customers', 'category')

    # Collapse address fields into a single address_line1
    op.drop_column('customers', 'country')
    op.drop_column('customers', 'state')
    op.drop_column('customers', 'city')
    op.drop_column('customers', 'address_line2')

    # Widen address_line1 to hold a full address
    op.alter_column(
        'customers',
        'address_line1',
        existing_type=mysql.VARCHAR(length=255),
        type_=sa.String(length=500),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        'customers',
        'address_line1',
        existing_type=sa.String(length=500),
        type_=mysql.VARCHAR(length=255),
        existing_nullable=False,
    )

    op.add_column(
        'customers',
        sa.Column('address_line2', sa.String(length=255), nullable=True),
    )
    op.add_column(
        'customers',
        sa.Column('city', sa.String(length=100), nullable=True),
    )
    op.add_column(
        'customers',
        sa.Column('state', sa.String(length=100), nullable=True),
    )
    op.add_column(
        'customers',
        sa.Column('country', sa.String(length=100), nullable=False),
    )
    op.add_column(
        'customers',
        sa.Column(
            'category',
            sa.Enum('retail', 'industrial', 'government', 'distributor', name='customercategory'),
            nullable=False,
        ),
    )
