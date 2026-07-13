"""add intranet events and spotlight tables

Revision ID: g1b2c3d4e5f6
Revises: f7a8b9c0d1e2
Create Date: 2026-07-10

"""
from alembic import op
import sqlalchemy as sa

revision = 'g1b2c3d4e5f6'
down_revision = 'f7a8b9c0d1e2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'intranet_events',
        sa.Column('id',           sa.Integer(),     nullable=False, autoincrement=True),
        sa.Column('title',        sa.String(255),   nullable=False),
        sa.Column('description',  sa.Text(),        nullable=True),
        sa.Column('event_type',   sa.String(40),    nullable=False),
        sa.Column('location',     sa.String(200),   nullable=True),
        sa.Column('virtual_link', sa.String(500),   nullable=True),
        sa.Column('event_date',   sa.String(10),    nullable=False),
        sa.Column('color',        sa.String(10),    nullable=False, server_default='#7234BD'),
        sa.Column('is_published', sa.Boolean(),     nullable=False, server_default=sa.text('false')),
        sa.Column('created_at',   sa.DateTime(),    nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at',   sa.DateTime(),    nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'intranet_spotlight',
        sa.Column('id',            sa.Integer(),     nullable=False, autoincrement=True),
        sa.Column('employee_id',   sa.String(36),    nullable=True),
        sa.Column('employee_name', sa.String(200),   nullable=False),
        sa.Column('employee_role', sa.String(200),   nullable=True),
        sa.Column('employee_dept', sa.String(200),   nullable=True),
        sa.Column('avatar_url',    sa.Text(),        nullable=True),
        sa.Column('title',         sa.String(150),   nullable=False),
        sa.Column('message',       sa.Text(),        nullable=False),
        sa.Column('category',      sa.String(40),    nullable=False),
        sa.Column('month',         sa.Integer(),     nullable=True),
        sa.Column('year',          sa.Integer(),     nullable=True),
        sa.Column('tag',           sa.String(80),    nullable=True),
        sa.Column('tag_color',     sa.String(20),    nullable=True),
        sa.Column('tag_bg',        sa.String(20),    nullable=True),
        sa.Column('is_published',  sa.Boolean(),     nullable=False, server_default=sa.text('false')),
        sa.Column('published_at',  sa.DateTime(),    nullable=True),
        sa.Column('created_at',    sa.DateTime(),    nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at',    sa.DateTime(),    nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('intranet_spotlight')
    op.drop_table('intranet_events')
