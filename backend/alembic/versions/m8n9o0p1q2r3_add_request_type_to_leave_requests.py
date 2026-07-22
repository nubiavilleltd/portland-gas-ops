"""add request_type to leave_requests

Revision ID: m8n9o0p1q2r3
Revises: l6a7b8c9d0e1
Create Date: 2026-07-13 20:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = 'm8n9o0p1q2r3'
down_revision = 'x8y9z0a1b2c3'
branch_labels = None
depends_on = None

# Mark this as a head node in case there are multiple branches
branch_labels = None


def upgrade() -> None:
    # Add request_type column to leave_requests table
    op.add_column('leave_requests', sa.Column('request_type', mysql.ENUM('self', 'others'), nullable=False, server_default='self'))


def downgrade() -> None:
    # Remove request_type column
    op.drop_column('leave_requests', 'request_type')
