"""add vendor_code and logo_url to vendors

Revision ID: c3d4e5f6a7b8
Revises: a2b3c4d5e6f7
Create Date: 2026-06-24

vendor_code: auto-generated unique code per vendor (e.g. AT-K7M2)
logo_url:    Cloudinary URL for the vendor logo
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, None] = "a2b3c4d5e6f7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("vendors", sa.Column("vendor_code", sa.String(length=20), nullable=True))
    op.add_column("vendors", sa.Column("logo_url", sa.String(length=500), nullable=True))
    op.create_unique_constraint("uq_vendors_vendor_code", "vendors", ["vendor_code"])
    op.create_index("ix_vendors_vendor_code", "vendors", ["vendor_code"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_vendors_vendor_code", table_name="vendors")
    op.drop_constraint("uq_vendors_vendor_code", "vendors", type_="unique")
    op.drop_column("vendors", "logo_url")
    op.drop_column("vendors", "vendor_code")
