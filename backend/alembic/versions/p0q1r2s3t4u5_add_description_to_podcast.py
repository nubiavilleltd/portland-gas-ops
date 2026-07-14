"""add_description_to_podcast

Revision ID: p0q1r2s3t4u5
Revises: o9p0q1r2s3t4
Create Date: 2026-07-13

"""
from alembic import op
import sqlalchemy as sa

revision = "p0q1r2s3t4u5"
down_revision = "o9p0q1r2s3t4"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("intranet_podcast", sa.Column("description", sa.Text(), nullable=True))


def downgrade():
    op.drop_column("intranet_podcast", "description")
