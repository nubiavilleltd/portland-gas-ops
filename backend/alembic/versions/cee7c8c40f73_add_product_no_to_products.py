"""add product_no to products

Revision ID: cee7c8c40f73
Revises: 320ef5c09015
Create Date: 2026-06-26 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'cee7c8c40f73'
down_revision: Union[str, None] = '320ef5c09015'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('products', sa.Column('product_no', sa.String(length=50), nullable=True))
    op.create_index('ix_products_product_no', 'products', ['product_no'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_products_product_no', table_name='products')
    op.drop_column('products', 'product_no')