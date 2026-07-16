"""merge_departments_and_vendor_fields

Revision ID: u5v6w7x8y9z0
Revises: r2s3t4u5v6w7, t4u5v6w7x8y9
Create Date: 2026-07-16

Merge two heads:
  - r2s3t4u5v6w7: add_departments_table_migrate_employee_department
  - t4u5v6w7x8y9: make_vendor_contact_fields_required
"""

from alembic import op


revision = "u5v6w7x8y9z0"
down_revision = ("r2s3t4u5v6w7", "t4u5v6w7x8y9")
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
