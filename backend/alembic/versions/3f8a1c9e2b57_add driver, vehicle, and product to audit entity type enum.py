"""add driver, vehicle, and product to audit entity type enum

Revision ID: 3f8a1c9e2b57
Revises: 9c7e2a4f18b3
Create Date: 2026-07-11 09:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "3f8a1c9e2b57"
down_revision = "9c7e2a4f18b3"
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column(
        "audit_log",
        "entity_type",
        existing_type=sa.Enum("order", "trip", "invoice", "payment", "inventory_item", name="auditentitytype"),
        type_=sa.Enum("order", "trip", "invoice", "payment", "driver", "vehicle", "product", "inventory_item", name="auditentitytype"),
        existing_nullable=False,
    )


def downgrade():
    op.alter_column(
        "audit_log",
        "entity_type",
        existing_type=sa.Enum("order", "trip", "invoice", "payment", "driver", "vehicle", "product", "inventory_item", name="auditentitytype"),
        type_=sa.Enum("order", "trip", "invoice", "payment", "inventory_item", name="auditentitytype"),
        existing_nullable=False,
    )