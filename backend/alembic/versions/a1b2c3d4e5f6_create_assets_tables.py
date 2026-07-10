"""create_assets_tables

Revision ID: a1b2c3d4e5f6
Revises: 24ccead2af60
Create Date: 2026-05-18 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '24ccead2af60'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'asset_categories',
        sa.Column('id',         sa.String(36),  primary_key=True),
        sa.Column('name',       sa.String(255), nullable=False, unique=True),
        sa.Column('colour',     sa.String(7),   nullable=False, server_default='#6b7280'),
        sa.Column('is_active',  sa.Boolean(),   nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(),  server_default=sa.text('CURRENT_TIMESTAMP')),
    )

    op.create_table(
        'assets',
        sa.Column('id',                  sa.String(36),   primary_key=True),
        sa.Column('name',                sa.String(255),  nullable=False),
        sa.Column('category_id',         sa.String(36),   sa.ForeignKey('asset_categories.id'), nullable=True),
        sa.Column('serial_number',       sa.String(255),  nullable=True),
        sa.Column('purchase_date',       sa.Date(),       nullable=True),
        sa.Column('purchase_cost',       sa.Numeric(12,2),nullable=True),
        sa.Column('condition',           sa.Enum('new','good','fair','poor'), nullable=False, server_default='good'),
        sa.Column('status',              sa.Enum('available','in_use','under_maintenance','decommissioned'), nullable=False, server_default='available'),
        sa.Column('attachment_id',       sa.Integer(),    sa.ForeignKey('documents.id', ondelete='SET NULL'), nullable=True),
        sa.Column('description',         sa.Text(),       nullable=True),
        sa.Column('assigned_to',         sa.String(255),  nullable=True),
        sa.Column('total_quantity',      sa.Integer(),    nullable=False, server_default='1'),
        sa.Column('available_quantity',  sa.Integer(),    nullable=False, server_default='1'),
        sa.Column('low_stock_threshold', sa.Integer(),    nullable=False, server_default='1'),
        sa.Column('added_by',            sa.String(36),   sa.ForeignKey('users.id'), nullable=True),
        sa.Column('is_active',           sa.Boolean(),    nullable=False, server_default='1'),
        sa.Column('created_at',          sa.DateTime(),   server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at',          sa.DateTime(),   server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')),
    )

    op.create_table(
        'asset_requests',
        sa.Column('id',               sa.String(36),  primary_key=True),
        sa.Column('reference',        sa.String(50),  nullable=False, unique=True),
        sa.Column('request_type',     sa.Enum('loan','requisition'), nullable=False),
        sa.Column('purpose',          sa.Text(),      nullable=False),
        sa.Column('return_date',      sa.Date(),      nullable=True),
        sa.Column('status',           sa.Enum('pending','approved','rejected','returned'), nullable=False, server_default='pending'),
        sa.Column('rejection_reason', sa.Text(),      nullable=True),
        sa.Column('requested_by',     sa.String(36),  sa.ForeignKey('users.id'), nullable=False),
        sa.Column('approved_by',      sa.String(36),  sa.ForeignKey('users.id'), nullable=True),
        sa.Column('approved_at',      sa.DateTime(),  nullable=True),
        sa.Column('is_active',        sa.Boolean(),   nullable=False, server_default='1'),
        sa.Column('created_at',       sa.DateTime(),  server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at',       sa.DateTime(),  server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')),
    )

    op.create_table(
        'asset_request_items',
        sa.Column('id',         sa.String(36), primary_key=True),
        sa.Column('request_id', sa.String(36), sa.ForeignKey('asset_requests.id'), nullable=False),
        sa.Column('asset_id',   sa.String(36), sa.ForeignKey('assets.id'),         nullable=False),
        sa.Column('quantity',   sa.Integer(),  nullable=False, server_default='1'),
        sa.Column('notes',      sa.Text(),     nullable=True),
    )


def downgrade() -> None:
    op.drop_table('asset_request_items')
    op.drop_table('asset_requests')
    op.drop_table('assets')
    op.drop_table('asset_categories')
