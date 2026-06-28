"""add_products_table

Revision ID: 320ef5c09015
Revises: c0d1e2f3a4b5
Create Date: 2026-06-26 19:55:15.953798

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

revision: str = '320ef5c09015'
down_revision: Union[str, None] = 'c0d1e2f3a4b5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('products',
    sa.Column('id', mysql.CHAR(length=36), nullable=False),
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('code', sa.String(length=50), nullable=True),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('product_type', sa.Enum('consumable', 'tracked', name='producttype'), nullable=False),
    sa.Column('unit', sa.Enum('kg', 'litre', 'm3', 'tonne', 'unit', name='productunit'), nullable=False),
    sa.Column('default_unit_price', sa.Numeric(precision=15, scale=2), nullable=False),
    sa.Column('minimum_stock', sa.Numeric(precision=15, scale=2), nullable=True),
    sa.Column('primary_document_id', sa.Integer(), nullable=True),
    sa.Column('status', sa.Enum('active', 'inactive', name='productstatus'), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['primary_document_id'], ['documents.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_products_code'), 'products', ['code'], unique=True)
    op.create_index(op.f('ix_products_name'), 'products', ['name'], unique=False)
    op.create_index(op.f('ix_products_status'), 'products', ['status'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_products_status'), table_name='products')
    op.drop_index(op.f('ix_products_name'), table_name='products')
    op.drop_index(op.f('ix_products_code'), table_name='products')
    op.drop_table('products')