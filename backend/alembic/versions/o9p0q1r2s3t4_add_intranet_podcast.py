"""add_intranet_podcast

Revision ID: o9p0q1r2s3t4
Revises: n8c9d0e1f2a3
Create Date: 2026-07-13

"""
from alembic import op
import sqlalchemy as sa

revision = "o9p0q1r2s3t4"
down_revision = "n8c9d0e1f2a3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "intranet_podcast",
        sa.Column("id",                sa.Integer(),     primary_key=True, autoincrement=True),
        sa.Column("episode_number",    sa.Integer(),     nullable=False),
        sa.Column("title",             sa.String(255),   nullable=False),
        sa.Column("guest_name",        sa.String(200),   nullable=True),
        sa.Column("duration",          sa.String(30),    nullable=True),
        sa.Column("cover_image_id",    sa.Integer(),     sa.ForeignKey("documents.id", ondelete="SET NULL"), nullable=True),
        sa.Column("audio_document_id", sa.Integer(),     sa.ForeignKey("documents.id", ondelete="SET NULL"), nullable=True),
        sa.Column("embed_url",         sa.Text(),        nullable=True),
        sa.Column("audio_url",         sa.Text(),        nullable=True),
        sa.Column("media_type",        sa.String(10),    nullable=False, server_default="audio"),
        sa.Column("is_published",      sa.Boolean(),     nullable=False, server_default=sa.false()),
        sa.Column("is_featured",       sa.Boolean(),     nullable=False, server_default=sa.false()),
        sa.Column("created_at",        sa.DateTime(),    nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at",        sa.DateTime(),    nullable=False, server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table("intranet_podcast")
