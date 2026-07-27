"""add employee_loans and loan_repayment_charges

Revision ID: z3c4d5e6f7a8
Revises: z2b3c4d5e6f7
Create Date: 2026-07-25

Structured loan / recurring-deduction model for payroll. ``employee_loans`` holds
the agreement (one_off / installment / standing); ``loan_repayment_charges`` is the
per-period ledger. The unique (loan_id, period, year) constraint makes payslip
regeneration idempotent, and installments auto-stop once total_amount is repaid.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "z3c4d5e6f7a8"
down_revision: Union[str, None] = "z2b3c4d5e6f7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "employee_loans",
        sa.Column("id",                  sa.String(36),   primary_key=True),
        sa.Column("employee_id",         sa.String(36),   sa.ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("description",         sa.String(255),  nullable=True),
        sa.Column("mode",                sa.Enum("one_off", "installment", "standing"), nullable=False),
        sa.Column("monthly_amount",      sa.Numeric(15, 2), nullable=False),
        sa.Column("total_amount",        sa.Numeric(15, 2), nullable=True),
        sa.Column("start_period_yyyymm", sa.Integer(),    nullable=True),
        sa.Column("status",              sa.Enum("active", "completed", "cancelled"), nullable=False, server_default="active", index=True),
        sa.Column("created_by",          sa.String(255),  nullable=True),
        sa.Column("created_at",          sa.DateTime(),   server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at",          sa.DateTime(),   server_default=sa.text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")),
    )

    op.create_table(
        "loan_repayment_charges",
        sa.Column("id",         sa.String(36),   primary_key=True),
        sa.Column("loan_id",    sa.String(36),   sa.ForeignKey("employee_loans.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("payslip_id", sa.String(36),   sa.ForeignKey("payslips.id", ondelete="CASCADE"), nullable=True, index=True),
        sa.Column("period",     sa.String(20),   nullable=False),
        sa.Column("year",       sa.Integer(),    nullable=False),
        sa.Column("amount",     sa.Numeric(15, 2), nullable=False),
        sa.Column("created_at", sa.DateTime(),   server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.UniqueConstraint("loan_id", "period", "year", name="uq_loan_charge_period"),
    )


def downgrade() -> None:
    op.drop_table("loan_repayment_charges")
    op.drop_table("employee_loans")
