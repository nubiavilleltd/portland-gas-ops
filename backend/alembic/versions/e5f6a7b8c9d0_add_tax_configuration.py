"""add tax configuration (PAYE bands, pension, NHF, consolidated relief)

Revision ID: e5f6a7b8c9d0
Revises: c3d4e5f6a7c5
Create Date: 2026-09-22

Statutory deduction rules move out of shipped JavaScript and into data.

Until now the rates lived in two copies of calcDeductions() on the employee
forms, were applied only when someone saved through those forms, and were
stored as flat figures on the employee row. Any other write path left them
unset, which is how four employees ended up with PAYE of zero.

Configs are versioned by effective_from so payroll can resolve the rules that
applied to the period being run, and a historical payslip stays reproducible
after the rates change.

Not workspace-scoped, matching payslips and employee_loans, which are not
scoped yet either. Scope this alongside the rest of payroll when that happens.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.mysql import CHAR

revision: str = "e5f6a7b8c9d0"
down_revision: Union[str, None] = "c3d4e5f6a7c5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "tax_configs",
        sa.Column("id", CHAR(36), primary_key=True),
        sa.Column("name", sa.String(120), nullable=False),
        # Inclusive. Payroll picks the newest config on or before the period.
        sa.Column("effective_from", sa.Date(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("notes", sa.Text(), nullable=True),

        # Employee pension contribution
        sa.Column("pension_rate", sa.Numeric(7, 4), nullable=False, server_default="0.0800"),
        sa.Column("pension_includes_basic", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("pension_includes_housing", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("pension_includes_transport", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("pension_includes_meal", sa.Boolean(), nullable=False, server_default=sa.false()),

        # National Housing Fund
        sa.Column("nhf_rate", sa.Numeric(7, 4), nullable=False, server_default="0.0250"),
        sa.Column("nhf_includes_basic", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("nhf_includes_housing", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("nhf_includes_transport", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("nhf_includes_meal", sa.Boolean(), nullable=False, server_default=sa.false()),

        # Consolidated relief allowance:
        #   max(cra_minimum, gross * cra_gross_percent) + gross * cra_additional_percent
        sa.Column("cra_minimum", sa.Numeric(15, 2), nullable=False, server_default="200000.00"),
        sa.Column("cra_gross_percent", sa.Numeric(7, 4), nullable=False, server_default="0.0100"),
        sa.Column("cra_additional_percent", sa.Numeric(7, 4), nullable=False, server_default="0.2000"),

        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_tax_configs_effective_from", "tax_configs", ["effective_from"])

    op.create_table(
        "tax_bands",
        sa.Column("id", CHAR(36), primary_key=True),
        sa.Column("tax_config_id", CHAR(36), nullable=False),
        sa.Column("sequence", sa.Integer(), nullable=False),
        # Band WIDTH, matching how PAYE is published ("next 300,000 at 11%").
        # NULL means the remainder — the top band.
        sa.Column("width", sa.Numeric(15, 2), nullable=True),
        sa.Column("rate", sa.Numeric(7, 4), nullable=False),
        sa.ForeignKeyConstraint(["tax_config_id"], ["tax_configs.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_tax_bands_config", "tax_bands", ["tax_config_id", "sequence"])


def downgrade() -> None:
    op.drop_index("ix_tax_bands_config", table_name="tax_bands")
    op.drop_table("tax_bands")
    op.drop_index("ix_tax_configs_effective_from", table_name="tax_configs")
    op.drop_table("tax_configs")
