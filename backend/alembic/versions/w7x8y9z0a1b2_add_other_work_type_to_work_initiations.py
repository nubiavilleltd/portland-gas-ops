"""add other work type to safety work initiations

Revision ID: w7x8y9z0a1b2
Revises: v6w7x8y9z0a1
Create Date: 2026-07-28

"""
from alembic import op
import sqlalchemy as sa


revision = "w7x8y9z0a1b2"
down_revision = "v6w7x8y9z0a1"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "safety_work_initiations",
        sa.Column("other_work_type", sa.String(length=255), nullable=True),
    )


def downgrade():
    op.drop_column("safety_work_initiations", "other_work_type")
