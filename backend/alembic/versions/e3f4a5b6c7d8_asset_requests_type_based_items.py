"""asset requests: type-based items, allocated status, allocated_by/at

Revision ID: e3f4a5b6c7d8
Revises: d2e3f4a5b6c7
Create Date: 2026-07-01
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

revision: str = "e3f4a5b6c7d8"
down_revision: Union[str, None] = "d2e3f4a5b6c7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_exists(table: str, column: str) -> bool:
    conn = op.get_bind()
    result = conn.execute(text(
        "SELECT COUNT(*) FROM information_schema.COLUMNS "
        "WHERE TABLE_SCHEMA = DATABASE() "
        "AND TABLE_NAME = :t AND COLUMN_NAME = :c"
    ), {"t": table, "c": column})
    return result.scalar() > 0


def upgrade() -> None:
    # 1. asset_request_items: add asset_type_id (may already exist from partial run)
    if not _column_exists("asset_request_items", "asset_type_id"):
        op.add_column(
            "asset_request_items",
            sa.Column("asset_type_id", sa.String(36), sa.ForeignKey("asset_types.id", ondelete="SET NULL"), nullable=True),
        )

    # 2. Make asset_id nullable (requires existing_type for MySQL)
    op.alter_column(
        "asset_request_items", "asset_id",
        existing_type=sa.String(36),
        nullable=True,
    )

    # 3. asset_requests: add allocated_by, allocated_at
    if not _column_exists("asset_requests", "allocated_by"):
        op.add_column("asset_requests", sa.Column("allocated_by", sa.String(36), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True))
    if not _column_exists("asset_requests", "allocated_at"):
        op.add_column("asset_requests", sa.Column("allocated_at", sa.DateTime(), nullable=True))

    # 4. Add 'allocated' to asset_request_status enum
    op.execute(
        "ALTER TABLE asset_requests MODIFY COLUMN status "
        "ENUM('pending','approved','rejected','returned','allocated') "
        "NOT NULL DEFAULT 'pending'"
    )


def downgrade() -> None:
    op.execute(
        "ALTER TABLE asset_requests MODIFY COLUMN status "
        "ENUM('pending','approved','rejected','returned') "
        "NOT NULL DEFAULT 'pending'"
    )
    op.drop_column("asset_requests", "allocated_at")
    op.drop_column("asset_requests", "allocated_by")
    op.alter_column(
        "asset_request_items", "asset_id",
        existing_type=sa.String(36),
        nullable=False,
    )
    op.drop_column("asset_request_items", "asset_type_id")
