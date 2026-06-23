"""rename line_manager_id to operating_manager_id on employees

Revision ID: f1a2b3c4d5e6
Revises: eaf95fb8a51a
Create Date: 2026-06-19

"""
from alembic import op

revision = "f1a2b3c4d5e6"
down_revision = "eaf95fb8a51a"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        "ALTER TABLE employees RENAME COLUMN line_manager_id TO operating_manager_id"
    )


def downgrade():
    op.execute(
        "ALTER TABLE employees RENAME COLUMN operating_manager_id TO line_manager_id"
    )
