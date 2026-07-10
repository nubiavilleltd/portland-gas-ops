"""add intranet_news_categories table

Revision ID: f7a8b9c0d1e2
Revises: e6f7a8b9c0d1
Create Date: 2026-07-09

"""
from typing import Union
from alembic import op
import sqlalchemy as sa


revision: str = "f7a8b9c0d1e2"
down_revision: Union[str, None] = "e6f7a8b9c0d1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "intranet_news_categories",
        sa.Column("id",         sa.Integer(),    primary_key=True, autoincrement=True),
        sa.Column("name",       sa.String(60),   nullable=False, unique=True),
        sa.Column("color",      sa.String(20),   nullable=False, server_default="gray"),
        sa.Column("created_at", sa.DateTime(),   nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
    )


def downgrade() -> None:
    op.drop_table("intranet_news_categories")
