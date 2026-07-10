"""add order discount fields

Revision ID: 9f7c3d2b8e41
Revises: 2c3d4e5f6a7b
Create Date: 2026-07-09
"""

from alembic import op
import sqlalchemy as sa

from app.orders.enums import DiscountType


# revision identifiers
revision = "9f7c3d2b8e41"
down_revision = "2c3d4e5f6a7b"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "orders",
        sa.Column(
            "discount_type",
            sa.Enum(DiscountType),
            nullable=False,
            server_default="none",
        ),
    )

    op.add_column(
        "orders",
        sa.Column(
            "discount_value",
            sa.Numeric(15, 2),
            nullable=False,
            server_default="0.00",
        ),
    )

    op.add_column(
        "orders",
        sa.Column(
            "discount_amount",
            sa.Numeric(15, 2),
            nullable=False,
            server_default="0.00",
        ),
    )

    op.alter_column("orders", "discount_type", server_default=None)
    op.alter_column("orders", "discount_value", server_default=None)
    op.alter_column("orders", "discount_amount", server_default=None)


def downgrade():
    op.drop_column("orders", "discount_amount")
    op.drop_column("orders", "discount_value")
    op.drop_column("orders", "discount_type")