"""add ON DELETE CASCADE to procurement_items FK

Revision ID: 8a9b0c1d2e3f
Revises: 7b1421d9b234
Create Date: 2026-06-30

Drops and recreates the FK on procurement_items.procurement_request_id
with ON DELETE CASCADE so that deleting a procurement_request also
removes its line items automatically.
"""
from typing import Sequence, Union

from alembic import op

revision: str = "8a9b0c1d2e3f"
down_revision: Union[str, None] = "7b1421d9b234"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop existing FK (MySQL requires dropping before recreating)
    op.drop_constraint(
        "procurement_items_ibfk_1",
        "procurement_items",
        type_="foreignkey",
    )
    op.create_foreign_key(
        "procurement_items_ibfk_1",
        "procurement_items",
        "procurement_requests",
        ["procurement_request_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint(
        "procurement_items_ibfk_1",
        "procurement_items",
        type_="foreignkey",
    )
    op.create_foreign_key(
        "procurement_items_ibfk_1",
        "procurement_items",
        "procurement_requests",
        ["procurement_request_id"],
        ["id"],
    )
