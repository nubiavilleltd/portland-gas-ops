"""add other work category to safety work initiations

Revision ID: q1r2s3t4u5v6
Revises: p0q1r2s3t4u5
Create Date: 2026-07-15

"""
from alembic import op
import sqlalchemy as sa


revision = "q1r2s3t4u5v6"
down_revision = "p0q1r2s3t4u5"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "safety_work_initiations",
        sa.Column("other_work_category", sa.String(length=255), nullable=True),
    )


def downgrade():
    op.drop_column("safety_work_initiations", "other_work_category")
