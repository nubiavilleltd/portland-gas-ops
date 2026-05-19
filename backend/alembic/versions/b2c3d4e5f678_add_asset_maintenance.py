"""add_asset_maintenance

Revision ID: b2c3d4e5f678
Revises: a1b2c3d4e5f6
Create Date: 2026-05-18 14:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'b2c3d4e5f678'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('assets', sa.Column('maintenance_type', sa.Enum('routine', 'inspection', 'calibration', 'repair', name='maintenancetype'), nullable=True))
    op.add_column('assets', sa.Column('maintenance_frequency_months', sa.Integer(), nullable=True))
    op.add_column('assets', sa.Column('next_maintenance_due', sa.Date(), nullable=True))

    op.create_table(
        'asset_maintenance_logs',
        sa.Column('id',               sa.String(36),   primary_key=True),
        sa.Column('asset_id',         sa.String(36),   sa.ForeignKey('assets.id'), nullable=False),
        sa.Column('performed_date',   sa.Date(),       nullable=False),
        sa.Column('maintenance_type', sa.Enum('routine', 'inspection', 'calibration', 'repair', name='maintenancetype'), nullable=False),
        sa.Column('technician',       sa.String(255),  nullable=True),
        sa.Column('cost',             sa.Numeric(12,2),nullable=True),
        sa.Column('notes',            sa.Text(),       nullable=True),
        sa.Column('logged_by',        sa.String(36),   sa.ForeignKey('users.id'), nullable=True),
        sa.Column('created_at',       sa.DateTime(),   server_default=sa.text('CURRENT_TIMESTAMP')),
    )


def downgrade() -> None:
    op.drop_table('asset_maintenance_logs')
    op.drop_column('assets', 'next_maintenance_due')
    op.drop_column('assets', 'maintenance_frequency_months')
    op.drop_column('assets', 'maintenance_type')
