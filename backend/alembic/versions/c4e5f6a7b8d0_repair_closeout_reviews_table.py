"""repair missing safety closeout reviews table

Revision ID: c4e5f6a7b8d0
Revises: aa516aafb9b8, b1c2d3e4f5a6
Create Date: 2026-07-09
"""
from typing import Sequence, Tuple, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql


revision: str = "c4e5f6a7b8d0"
down_revision: Union[str, Tuple[str, ...], None] = (
    "aa516aafb9b8",
    "b1c2d3e4f5a6",
)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


work_closeout_decision_enum = sa.Enum(
    "approve",
    "acknowledge",
    "return",
    "deny",
    name="workcloseoutdecision",
)


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "safety_closeout_reviews" in inspector.get_table_names():
        return

    op.create_table(
        "safety_closeout_reviews",
        sa.Column("id", mysql.CHAR(length=36), nullable=False),
        sa.Column("work_closeout_id", mysql.CHAR(length=36), nullable=False),
        sa.Column("reviewer_role", sa.String(length=100), nullable=False),
        sa.Column("reviewer_id", mysql.CHAR(length=36), nullable=False),
        sa.Column("decision", work_closeout_decision_enum, nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("verified_close_out", sa.Boolean(), nullable=True),
        sa.Column("area_safe_for_operations", sa.Boolean(), nullable=True),
        sa.Column("corrective_action_required", sa.Boolean(), nullable=True),
        sa.Column("corrective_action_details", sa.Text(), nullable=True),
        sa.Column(
            "decided_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["reviewer_id"], ["employees.id"]),
        sa.ForeignKeyConstraint(["work_closeout_id"], ["safety_work_closeouts.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "work_closeout_id",
            "reviewer_role",
            name="uq_safety_closeout_reviews_closeout_role",
        ),
    )
    op.create_index(
        "ix_safety_closeout_reviews_work_closeout_id",
        "safety_closeout_reviews",
        ["work_closeout_id"],
        unique=False,
    )
    op.create_index(
        "ix_safety_closeout_reviews_reviewer_role",
        "safety_closeout_reviews",
        ["reviewer_role"],
        unique=False,
    )
    op.create_index(
        "ix_safety_closeout_reviews_reviewer_id",
        "safety_closeout_reviews",
        ["reviewer_id"],
        unique=False,
    )
    op.create_index(
        "ix_safety_closeout_reviews_decision",
        "safety_closeout_reviews",
        ["decision"],
        unique=False,
    )


def downgrade() -> None:
    pass
