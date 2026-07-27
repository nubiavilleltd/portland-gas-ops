"""add intranet leadership messages

Revision ID: l6a7b8c9d0e1
Revises: k5f6a7b8c9d0
Create Date: 2026-07-13 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'l6a7b8c9d0e1'
down_revision = 'k5f6a7b8c9d0'
branch_labels = None
depends_on = None

# Real employee IDs from the database
SEED_MESSAGES = [
    {
        "author_id":   "2b9413fe-e308-4412-bf2f-51888d55787b",
        "author_name": "John Obe",
        "author_role": "System Manager",
        "author_dept": "Operations",
        "avatar_url":  None,
        "title":       "Message from Operations — July 2026",
        "body":        "Our operations team continues to deliver at the highest standard. As we push forward into the second half of the year, I want to recognise the commitment every individual brings to the field each day. Portland Gas succeeds because of the people behind the work.",
        "is_published": True,
        "published_at": "2026-07-01 08:00:00",
        "sort_order":   0,
    },
    {
        "author_id":   "0787d267-94fa-4230-9b08-3b8132d36fea",
        "author_name": "Felix Ohemu",
        "author_role": "HSE Inspector",
        "author_dept": "Safety",
        "avatar_url":  None,
        "title":       "Safety First — Always",
        "body":        "Safety is not a checkbox — it is a culture. Every near-miss reported, every toolbox talk held, and every PPE check completed is an investment in the people we care about. Thank you for making safety a personal priority.",
        "is_published": True,
        "published_at": "2026-07-03 08:00:00",
        "sort_order":   1,
    },
    {
        "author_id":   "32023ba2-856b-4b75-834c-af4cc970af28",
        "author_name": "Ebuka Ezeanya",
        "author_role": "System Administrator",
        "author_dept": "IT",
        "avatar_url":  None,
        "title":       "Digital Infrastructure Update",
        "body":        "We have completed the rollout of the new intranet platform across all departments. This is a milestone for how we communicate and collaborate internally. The IT team is committed to continuously improving the digital tools that support your daily work.",
        "is_published": True,
        "published_at": "2026-07-05 08:00:00",
        "sort_order":   2,
    },
]


def upgrade() -> None:
    msg_table = op.create_table(
        "intranet_leadership_messages",
        sa.Column("id",           sa.Integer(),     primary_key=True, autoincrement=True),
        sa.Column("author_id",    sa.String(36),    sa.ForeignKey("employees.id", ondelete="SET NULL"), nullable=True),
        sa.Column("author_name",  sa.String(200),   nullable=False),
        sa.Column("author_role",  sa.String(200),   nullable=True),
        sa.Column("author_dept",  sa.String(200),   nullable=True),
        sa.Column("avatar_url",   sa.Text(),        nullable=True),
        sa.Column("title",        sa.String(200),   nullable=False),
        sa.Column("body",         sa.Text(),        nullable=False),
        sa.Column("is_published", sa.Boolean(),     nullable=False, server_default=sa.false()),
        sa.Column("published_at", sa.DateTime(),    nullable=True),
        sa.Column("sort_order",   sa.Integer(),     nullable=False, server_default="0"),
        sa.Column("created_at",   sa.DateTime(),    nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at",   sa.DateTime(),    nullable=False, server_default=sa.func.now()),
    )
    op.bulk_insert(msg_table, SEED_MESSAGES)


def downgrade() -> None:
    op.drop_table("intranet_leadership_messages")
