"""add intranet_news table

Revision ID: e6f7a8b9c0d1
Revises: d5e6f7a8b9c0
Create Date: 2026-07-09

"""
from typing import Union
from alembic import op
import sqlalchemy as sa


revision: str = "e6f7a8b9c0d1"
down_revision: Union[str, None] = "d5e6f7a8b9c0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "intranet_news",
        sa.Column("id",               sa.Integer(),      primary_key=True, autoincrement=True),
        sa.Column("title",            sa.String(255),    nullable=False),
        sa.Column("body",             sa.Text(),         nullable=False),
        sa.Column("category",         sa.String(60),     nullable=False),
        sa.Column("cover_image_url",  sa.String(1000),   nullable=True),
        sa.Column("author_name",      sa.String(200),    nullable=False),
        sa.Column("created_by",       sa.String(36),     sa.ForeignKey("employees.id", ondelete="SET NULL"), nullable=True),
        sa.Column("is_published",     sa.Boolean(),      nullable=False, server_default=sa.text("0")),
        sa.Column("published_at",     sa.DateTime(),     nullable=True),
        sa.Column("created_at",       sa.DateTime(),     nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at",       sa.DateTime(),     nullable=False, server_default=sa.text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")),
    )


def downgrade() -> None:
    op.drop_table("intranet_news")
