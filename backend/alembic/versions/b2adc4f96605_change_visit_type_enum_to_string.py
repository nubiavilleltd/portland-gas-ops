"""change visit_type enum to string

Revision ID: b2adc4f96605
Revises: 60edc628c98a
Create Date: 2026-08-07 15:55:30.538908

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2adc4f96605'
down_revision: Union[str, None] = '60edc628c98a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.alter_column(
        "customer_visits",
        "visit_type",
        existing_type=sa.Enum(
            "Sales",
            "Courtesy",
            "Follow-up",
            "Complaint",
            "Collection",
            name="visittype",
        ),
        type_=sa.String(length=50),
        existing_nullable=False,
    )


def downgrade():
    op.alter_column(
        "customer_visits",
        "visit_type",
        existing_type=sa.String(length=50),
        type_=sa.Enum(
            "Sales",
            "Courtesy",
            "Follow-up",
            "Complaint",
            "Collection",
            name="visittype",
        ),
        existing_nullable=False,
    )
