"""snapshot the PAYE working onto each payslip

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-09-23

A payslip shows a PAYE figure but nothing to justify it. When someone queries
their tax, finance has no way to show how it was reached.

These columns record the working AT THE TIME PAYROLL RAN — annual gross, the
contributions and relief deducted, the taxable income the bands were applied
to, and the band-by-band charge. Snapshotted rather than recomputed for the
same reason the loan context already is: the payslip is a historical record,
and recomputing it later under different rules would show working that does
not match what was actually paid.

Existing payslips keep NULLs. They were produced before the calculator existed
and there is no honest working to backfill.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "f6a7b8c9d0e1"
down_revision: Union[str, None] = "e5f6a7b8c9d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


COLUMNS = [
    # Which rule set produced the figures — the name is kept even if the
    # configuration is later renamed or deleted.
    ("tax_config_name", sa.String(120)),
    ("annual_gross", sa.Numeric(15, 2)),
    ("annual_pension", sa.Numeric(15, 2)),
    ("annual_nhf", sa.Numeric(15, 2)),
    ("consolidated_relief", sa.Numeric(15, 2)),
    ("taxable_income", sa.Numeric(15, 2)),
    ("annual_tax", sa.Numeric(15, 2)),
]


def upgrade() -> None:
    for name, type_ in COLUMNS:
        op.add_column("payslips", sa.Column(name, type_, nullable=True))
    # Band-by-band charge, as recorded at the time.
    op.add_column("payslips", sa.Column("tax_bands", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("payslips", "tax_bands")
    for name, _ in reversed(COLUMNS):
        op.drop_column("payslips", name)
