"""make_vendor_contact_fields_required

Revision ID: t4u5v6w7x8y9
Revises: s3t4u5v6w7x8
Create Date: 2026-07-16

Make contact_person, phone, email, address, bank_name, account_name, and
account_number NOT NULL on the vendors table.  These fields are now required
by the application layer (schema + form validation) so the DB should enforce
the same constraint.

Backfill any existing NULLs (from old temporary vendors created before this
rule existed) with an empty string before applying the constraint.
"""

from alembic import op
import sqlalchemy as sa


revision = "t4u5v6w7x8y9"
down_revision = "s3t4u5v6w7x8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Step 1: backfill NULLs so the NOT NULL constraint can be applied cleanly.
    # These rows are old temporary vendors created without full details.
    op.execute("UPDATE vendors SET contact_person = '' WHERE contact_person IS NULL")
    op.execute("UPDATE vendors SET phone         = '' WHERE phone         IS NULL")
    op.execute("UPDATE vendors SET email         = '' WHERE email         IS NULL")
    op.execute("UPDATE vendors SET address       = '' WHERE address       IS NULL")
    op.execute("UPDATE vendors SET bank_name     = '' WHERE bank_name     IS NULL")
    op.execute("UPDATE vendors SET account_name  = '' WHERE account_name  IS NULL")
    op.execute("UPDATE vendors SET account_number = '' WHERE account_number IS NULL")

    # Step 2: alter columns to NOT NULL.
    op.alter_column("vendors", "contact_person",  existing_type=sa.String(255), nullable=False)
    op.alter_column("vendors", "phone",           existing_type=sa.String(50),  nullable=False)
    op.alter_column("vendors", "email",           existing_type=sa.String(255), nullable=False)
    op.alter_column("vendors", "address",         existing_type=sa.Text(),      nullable=False)
    op.alter_column("vendors", "bank_name",       existing_type=sa.String(255), nullable=False)
    op.alter_column("vendors", "account_name",    existing_type=sa.String(255), nullable=False)
    op.alter_column("vendors", "account_number",  existing_type=sa.String(20),  nullable=False)


def downgrade() -> None:
    op.alter_column("vendors", "contact_person",  existing_type=sa.String(255), nullable=True)
    op.alter_column("vendors", "phone",           existing_type=sa.String(50),  nullable=True)
    op.alter_column("vendors", "email",           existing_type=sa.String(255), nullable=True)
    op.alter_column("vendors", "address",         existing_type=sa.Text(),      nullable=True)
    op.alter_column("vendors", "bank_name",       existing_type=sa.String(255), nullable=True)
    op.alter_column("vendors", "account_name",    existing_type=sa.String(255), nullable=True)
    op.alter_column("vendors", "account_number",  existing_type=sa.String(20),  nullable=True)
