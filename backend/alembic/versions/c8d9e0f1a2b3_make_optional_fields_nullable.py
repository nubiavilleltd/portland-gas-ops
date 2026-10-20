"""make optional customer and contact fields nullable

Revision ID: c8d9e0f1a2b3
Revises: b7c8d9e0f1a2
Create Date: 2026-10-20 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c8d9e0f1a2b3'
down_revision: Union[str, None] = 'b7c8d9e0f1a2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Account management is no longer compulsory: customer_type must accept NULL.
    op.alter_column(
        'customers',
        'customer_type',
        existing_type=sa.Enum('potential', 'purchasing', name='customertype'),
        nullable=True,
    )

    # Preferred contact channel is no longer compulsory on contacts.
    # Keep DEFAULT 'email' so inserts that omit the column still get a value.
    op.alter_column(
        'customer_contacts',
        'preferred_channel',
        existing_type=sa.Enum('email', 'phone', 'whatsapp', name='preferredchannel'),
        existing_nullable=False,
        nullable=True,
        server_default=sa.text("'email'"),
    )

    # Align customers.preferred_channel (VARCHAR in DB) with the model's ENUM.
    # All existing values are 'email' / 'phone' / 'whatsapp', so the cast is safe.
    op.alter_column(
        'customers',
        'preferred_channel',
        existing_type=sa.String(length=20),
        type_=sa.Enum('email', 'phone', 'whatsapp', name='preferredchannel'),
        existing_nullable=True,
        nullable=True,
    )


def downgrade() -> None:
    # Backfill NULLs first so NOT NULL can be restored.
    op.execute(
        "UPDATE customers SET customer_type = 'potential' WHERE customer_type IS NULL"
    )
    op.execute(
        "UPDATE customer_contacts SET preferred_channel = 'email' WHERE preferred_channel IS NULL"
    )

    op.alter_column(
        'customers',
        'preferred_channel',
        existing_type=sa.Enum('email', 'phone', 'whatsapp', name='preferredchannel'),
        type_=sa.String(length=20),
        existing_nullable=True,
        nullable=True,
    )

    op.alter_column(
        'customer_contacts',
        'preferred_channel',
        existing_type=sa.Enum('email', 'phone', 'whatsapp', name='preferredchannel'),
        nullable=False,
        server_default=sa.text("'email'"),
    )

    op.alter_column(
        'customers',
        'customer_type',
        existing_type=sa.Enum('potential', 'purchasing', name='customertype'),
        nullable=False,
    )
