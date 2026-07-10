"""add customer_name snapshot to orders

Revision ID: 1f2a3b4c5d6e
Revises: 841fdd251476
Create Date: 2026-07-07

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "1f2a3b4c5d6e"
down_revision: Union[str, None] = "841fdd251476"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ---------------------------------------------------------------------
    # 1. Add column as nullable first
    # ---------------------------------------------------------------------
    op.add_column(
        "orders",
        sa.Column(
            "customer_name",
            sa.String(length=255),
            nullable=True,
        ),
    )

    # ---------------------------------------------------------------------
    # 2. Backfill existing orders
    # ---------------------------------------------------------------------
    op.execute(
        """
        UPDATE orders o
        INNER JOIN customers c
            ON o.customer_id = c.id
        SET o.customer_name = c.name
        """
    )

    # ---------------------------------------------------------------------
    # 3. Make NOT NULL
    # ---------------------------------------------------------------------
    op.alter_column(
        "orders",
        "customer_name",
        existing_type=sa.String(length=255),
        nullable=False,
    )

    # ---------------------------------------------------------------------
    # 4. Index for searching
    # ---------------------------------------------------------------------
    op.create_index(
        "idx_orders_customer_name",
        "orders",
        ["customer_name"],
    )


def downgrade() -> None:
    op.drop_index(
        "idx_orders_customer_name",
        table_name="orders",
    )

    op.drop_column(
        "orders",
        "customer_name",
    )