"""add intranet spotlight tags

Revision ID: k5f6a7b8c9d0
Revises: j4e5f6a7b8c9
Create Date: 2026-07-13 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime

revision = 'k5f6a7b8c9d0'
down_revision = 'j4e5f6a7b8c9'
branch_labels = None
depends_on = None

SEED_TAGS = [
    ("Safety Champion",   "#166534", "#F0FDF4"),
    ("Process Innovator", "#1E40AF", "#EFF6FF"),
    ("Top Performer",     "#7234BD", "#F3EEFF"),
    ("Team Player",       "#B45309", "#FFFBEB"),
    ("Innovation Award",  "#C2410C", "#FFF7ED"),
]


def upgrade() -> None:
    tags_table = op.create_table(
        "intranet_spotlight_tags",
        sa.Column("id",         sa.Integer(),     primary_key=True, autoincrement=True),
        sa.Column("label",      sa.String(80),    nullable=False, unique=True),
        sa.Column("color",      sa.String(20),    nullable=False),
        sa.Column("bg",         sa.String(20),    nullable=False),
        sa.Column("created_at", sa.DateTime(),    nullable=False, server_default=sa.func.now()),
    )
    op.bulk_insert(
        tags_table,
        [{"label": label, "color": color, "bg": bg} for label, color, bg in SEED_TAGS],
    )


def downgrade() -> None:
    op.drop_table("intranet_spotlight_tags")
