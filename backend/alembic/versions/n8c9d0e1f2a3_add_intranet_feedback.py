"""add intranet_feedback table

Revision ID: n8c9d0e1f2a3
Revises: m7b8c9d0e1f2
Create Date: 2026-07-13
"""
from alembic import op
import sqlalchemy as sa

revision = 'n8c9d0e1f2a3'
down_revision = 'm7b8c9d0e1f2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'intranet_feedback',
        sa.Column('id',                sa.Integer(),     nullable=False, autoincrement=True),
        sa.Column('submitted_by_id',   sa.String(36),    nullable=True),
        sa.Column('submitted_by_name', sa.String(200),   nullable=True),
        sa.Column('submitted_by_dept', sa.String(100),   nullable=True),
        sa.Column('category',          sa.String(80),    nullable=False),
        sa.Column('subject',           sa.String(200),   nullable=False),
        sa.Column('message',           sa.Text(),        nullable=False),
        sa.Column('is_anonymous',      sa.Boolean(),     nullable=False, server_default=sa.false()),
        sa.Column('status',            sa.String(20),    nullable=False, server_default='open'),
        sa.Column('resolved_by_id',    sa.String(36),    nullable=True),
        sa.Column('resolved_at',       sa.DateTime(),    nullable=True),
        sa.Column('created_at',        sa.DateTime(),    nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['submitted_by_id'], ['employees.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['resolved_by_id'],  ['employees.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('intranet_feedback')
