"""add other work type to safety work initiations

Revision ID: f4c8a1d7e2b9
Revises: eb28ed324965
Create Date: 2026-07-28

"""
from alembic import op
import sqlalchemy as sa


revision = "f4c8a1d7e2b9"
down_revision = "eb28ed324965"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "safety_work_initiations",
        sa.Column("other_work_type", sa.String(length=255), nullable=True),
    )


def downgrade():
    op.drop_column("safety_work_initiations", "other_work_type")
