"""use employee for checklist response answered_by

Revision ID: 0f3a2b1c9d8e
Revises: 9d1c2b3a4e5f
Create Date: 2026-06-27

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0f3a2b1c9d8e"
down_revision: Union[str, None] = "9d1c2b3a4e5f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


TABLE_NAME = "safety_checklist_responses"
COLUMN_NAME = "answered_by"


def drop_answered_by_fk() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    for fk in inspector.get_foreign_keys(TABLE_NAME):
        if fk.get("constrained_columns") == [COLUMN_NAME] and fk.get("name"):
            op.drop_constraint(fk["name"], TABLE_NAME, type_="foreignkey")
            return


def upgrade() -> None:
    drop_answered_by_fk()
    op.create_foreign_key(
        "fk_safety_checklist_responses_answered_by_employees",
        TABLE_NAME,
        "employees",
        [COLUMN_NAME],
        ["id"],
    )


def downgrade() -> None:
    drop_answered_by_fk()
    op.create_foreign_key(
        "fk_safety_checklist_responses_answered_by_users",
        TABLE_NAME,
        "users",
        [COLUMN_NAME],
        ["id"],
    )
