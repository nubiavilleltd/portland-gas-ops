"""add settlement (paid / cancelled) fields to invoice_processing

Revision ID: a1f2b3c4d5e6
Revises: 152cf9f7bf70
Create Date: 2026-09-09

Invoice processing gains a settlement outcome at the FINAL workflow step:
the last approver either marks the invoice paid (which is also the final
approval) or cancels it. Both are terminal.

Scoped to invoice_processing only — no shared workflow table is touched.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.mysql import CHAR

revision: str = "a1f2b3c4d5e6"
down_revision: Union[str, None] = "152cf9f7bf70"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# "cancelled" is appended; every pre-existing value is preserved so no row
# needs rewriting and the old application code keeps working mid-deploy.
_NEW_STATUS = (
    "'draft','pending','in_progress','returned','approved',"
    "'denied','paid','partially_paid','cancelled'"
)
_OLD_STATUS = (
    "'draft','pending','in_progress','returned','approved',"
    "'denied','paid','partially_paid'"
)


def upgrade() -> None:
    op.execute(f"ALTER TABLE invoice_processing MODIFY status ENUM({_NEW_STATUS})")

    op.add_column("invoice_processing", sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("invoice_processing", sa.Column("paid_by", CHAR(36), nullable=True))
    op.add_column("invoice_processing", sa.Column("payment_reference", sa.String(100), nullable=True))
    op.add_column("invoice_processing", sa.Column("payment_notes", sa.Text(), nullable=True))
    op.add_column("invoice_processing", sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("invoice_processing", sa.Column("cancelled_by", CHAR(36), nullable=True))
    op.add_column("invoice_processing", sa.Column("cancellation_reason", sa.Text(), nullable=True))

    op.create_foreign_key(
        "fk_invoice_processing_paid_by", "invoice_processing", "employees",
        ["paid_by"], ["id"], ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_invoice_processing_cancelled_by", "invoice_processing", "employees",
        ["cancelled_by"], ["id"], ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_invoice_processing_cancelled_by", "invoice_processing", type_="foreignkey")
    op.drop_constraint("fk_invoice_processing_paid_by", "invoice_processing", type_="foreignkey")

    for col in (
        "cancellation_reason", "cancelled_by", "cancelled_at",
        "payment_notes", "payment_reference", "paid_by", "paid_at",
    ):
        op.drop_column("invoice_processing", col)

    # Any cancelled rows must land on a value that still exists in the old enum.
    op.execute("UPDATE invoice_processing SET status = 'denied' WHERE status = 'cancelled'")
    op.execute(f"ALTER TABLE invoice_processing MODIFY status ENUM({_OLD_STATUS})")
