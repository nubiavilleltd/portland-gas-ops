"""add loan context snapshot columns to payslips

Revision ID: z4d5e6f7a8b9
Revises: z3c4d5e6f7a8
Create Date: 2026-07-26

Snapshots the active loan's description, total, and outstanding-after-this-payment
onto each payslip at generation, so the payslip PDF can show loan context as a
self-contained historical record.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "z4d5e6f7a8b9"
down_revision: Union[str, None] = "z3c4d5e6f7a8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("payslips", sa.Column("loan_description", sa.String(255), nullable=True))
    op.add_column("payslips", sa.Column("loan_total", sa.Numeric(15, 2), nullable=True))
    op.add_column("payslips", sa.Column("loan_outstanding", sa.Numeric(15, 2), nullable=True))


def downgrade() -> None:
    op.drop_column("payslips", "loan_outstanding")
    op.drop_column("payslips", "loan_total")
    op.drop_column("payslips", "loan_description")
