"""add payment to audit entity type enum

Revision ID: 9c7e2a4f18b3
Revises: 9f7c3d2b8e41
Create Date: 2026-07-11 08:15:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "9c7e2a4f18b3"
down_revision = "9f7c3d2b8e41"
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column(
        "audit_log",
        "entity_type",
        existing_type=sa.Enum("order", "trip", "invoice", "inventory_item", name="auditentitytype"),
        type_=sa.Enum("order", "trip", "invoice", "payment", "inventory_item", name="auditentitytype"),
        existing_nullable=False,
    )


def downgrade():
    op.alter_column(
        "audit_log",
        "entity_type",
        existing_type=sa.Enum("order", "trip", "invoice", "payment", "inventory_item", name="auditentitytype"),
        type_=sa.Enum("order", "trip", "invoice", "inventory_item", name="auditentitytype"),
        existing_nullable=False,
    )