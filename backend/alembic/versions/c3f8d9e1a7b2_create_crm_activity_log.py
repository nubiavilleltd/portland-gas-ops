"""create crm activity log

Revision ID: c3f8d9e1a7b2
Revises: nd1c2e3f4a5b6
Create Date: 2026-07-31

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql


# revision identifiers, used by Alembic.
revision = "c3f8d9e1a7b2"
down_revision = "nd1c2e3f4a5b6"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "crm_activity_log",

        sa.Column(
            "id",
            mysql.CHAR(36),
            nullable=False,
        ),

        sa.Column(
            "customer_id",
            mysql.CHAR(36),
            nullable=False,
        ),

        sa.Column(
            "entity_type",
            sa.Enum(
                "customer",
                "contact",
                name="crmactivityentitytype",
            ),
            nullable=False,
        ),

        sa.Column(
            "entity_id",
            mysql.CHAR(36),
            nullable=False,
        ),

        sa.Column(
            "action",
            sa.String(100),
            nullable=False,
        ),

        sa.Column(
            "description",
            sa.Text(),
            nullable=False,
        ),

        sa.Column(
            "actor_type",
            sa.Enum(
                "employee",
                "system",
                name="crmactivityactortype",
            ),
            nullable=False,
        ),

        sa.Column(
            "actor_employee_id",
            mysql.CHAR(36),
            nullable=True,
        ),

        sa.Column(
            "actor_name",
            sa.String(255),
            nullable=True,
        ),

        sa.Column(
            "metadata",
            sa.JSON(),
            nullable=True,
        ),

        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.func.now(),
            nullable=False,
        ),

        sa.PrimaryKeyConstraint("id"),

        sa.ForeignKeyConstraint(
            ["customer_id"],
            ["customers_temp.id"],
            ondelete="CASCADE",
        ),
    )

    op.create_index(
        "ix_crm_activity_customer_id",
        "crm_activity_log",
        ["customer_id"],
    )

    op.create_index(
        "ix_crm_activity_entity",
        "crm_activity_log",
        ["entity_type", "entity_id"],
    )

    op.create_index(
        "ix_crm_activity_created_at",
        "crm_activity_log",
        ["created_at"],
    )


def downgrade():
    op.drop_index(
        "ix_crm_activity_created_at",
        table_name="crm_activity_log",
    )

    op.drop_index(
        "ix_crm_activity_entity",
        table_name="crm_activity_log",
    )

    op.drop_index(
        "ix_crm_activity_customer_id",
        table_name="crm_activity_log",
    )

    op.drop_table("crm_activity_log")