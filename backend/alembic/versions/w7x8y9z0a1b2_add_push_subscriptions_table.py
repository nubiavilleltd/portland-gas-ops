"""add push_subscriptions table

Revision ID: w7x8y9z0a1b2
Revises: v6w7x8y9z0a1
Create Date: 2026-07-22

"""
from alembic import op
import sqlalchemy as sa

revision = "w7x8y9z0a1b2"
down_revision = "v6w7x8y9z0a1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "push_subscriptions",
        sa.Column("id",                sa.String(36),   primary_key=True),
        sa.Column("user_id",           sa.String(36),   sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_email",        sa.String(255),  nullable=False, index=True),
        sa.Column("endpoint",          sa.String(500),  nullable=False, unique=True),
        sa.Column("subscription_json", sa.Text(),       nullable=False),
        sa.Column("created_at",        sa.DateTime(),   nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
    )


def downgrade() -> None:
    op.drop_table("push_subscriptions")
