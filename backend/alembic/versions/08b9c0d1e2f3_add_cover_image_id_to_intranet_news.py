"""add cover_image_id to intranet_news (replace cover_image_url with FK to documents)

Revision ID: 08b9c0d1e2f3
Revises: f7a8b9c0d1e2
Create Date: 2026-07-09
"""

from alembic import op
import sqlalchemy as sa

revision = "08b9c0d1e2f3"
down_revision = "f7a8b9c0d1e2"
branch_labels = None
depends_on = None


def upgrade():
    # Add cover_image_id FK → documents.id
    op.add_column(
        "intranet_news",
        sa.Column("cover_image_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_intranet_news_cover_image_id",
        "intranet_news", "documents",
        ["cover_image_id"], ["id"],
        ondelete="SET NULL",
    )
    # Drop the old plain-text URL column
    op.drop_column("intranet_news", "cover_image_url")


def downgrade():
    op.drop_constraint("fk_intranet_news_cover_image_id", "intranet_news", type_="foreignkey")
    op.drop_column("intranet_news", "cover_image_id")
    op.add_column(
        "intranet_news",
        sa.Column("cover_image_url", sa.String(1000), nullable=True),
    )
