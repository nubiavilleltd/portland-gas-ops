"""add other work category to safety work initiations

Revision ID: v6w7x8y9z0a1
Revises: u5v6w7x8y9z0
Create Date: 2026-07-15

"""
from alembic import op
import sqlalchemy as sa


revision = "v6w7x8y9z0a1"
down_revision = "u5v6w7x8y9z0"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "safety_work_initiations",
        sa.Column("other_work_category", sa.String(length=255), nullable=True),
    )


def downgrade():
    op.drop_column("safety_work_initiations", "other_work_category")
