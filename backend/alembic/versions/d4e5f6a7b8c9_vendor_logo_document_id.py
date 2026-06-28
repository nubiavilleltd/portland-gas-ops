"""replace vendor logo_url with logo_document_id FK to documents

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-06-24

Drops the plain logo_url string column and replaces it with logo_document_id
(FK → documents.id) so vendor logos are tracked in the documents table like
all other files in the system.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, None] = "c3d4e5f6a7b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("vendors", "logo_url")
    op.add_column("vendors", sa.Column("logo_document_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_vendors_logo_document_id",
        "vendors", "documents",
        ["logo_document_id"], ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_vendors_logo_document_id", "vendors", type_="foreignkey")
    op.drop_column("vendors", "logo_document_id")
    op.add_column("vendors", sa.Column("logo_url", sa.String(length=500), nullable=True))
