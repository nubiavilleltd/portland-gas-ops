"""add business_size and compliance document columns to vendors

Revision ID: z5e6f7a8b9c0
Revises: z4d5e6f7a8b9
Create Date: 2026-08-04

Adds business size classification (small ≤ ₦25m turnover, medium_large > ₦25m)
and foreign keys for compliance documents: CAC, TIN, VAT certificates.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "z5e6f7a8b9c0"
down_revision: Union[str, None] = ("z4d5e6f7a8b9", "c3f8d9e1a7b2")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add business size enum column
    op.add_column(
        "vendors",
        sa.Column(
            "business_size",
            sa.Enum("small", "medium_large", name="vendorsize"),
            nullable=True,
        ),
    )

    # Add compliance document foreign keys
    op.add_column(
        "vendors",
        sa.Column("cac_certificate_document_id", sa.Integer(), nullable=True),
    )
    op.add_column(
        "vendors",
        sa.Column("tin_certificate_document_id", sa.Integer(), nullable=True),
    )
    op.add_column(
        "vendors",
        sa.Column("vat_certificate_document_id", sa.Integer(), nullable=True),
    )

    # Create foreign key constraints
    op.create_foreign_key(
        "fk_vendors_cac_document",
        "vendors",
        "documents",
        ["cac_certificate_document_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_vendors_tin_document",
        "vendors",
        "documents",
        ["tin_certificate_document_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_vendors_vat_document",
        "vendors",
        "documents",
        ["vat_certificate_document_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_vendors_vat_document", "vendors", type_="foreignkey")
    op.drop_constraint("fk_vendors_tin_document", "vendors", type_="foreignkey")
    op.drop_constraint("fk_vendors_cac_document", "vendors", type_="foreignkey")
    op.drop_column("vendors", "vat_certificate_document_id")
    op.drop_column("vendors", "tin_certificate_document_id")
    op.drop_column("vendors", "cac_certificate_document_id")
    op.drop_column("vendors", "business_size")
    op.execute("DROP TYPE IF EXISTS vendorsize")
