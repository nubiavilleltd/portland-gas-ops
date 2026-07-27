"""create crm tables

Revision ID: eb28ed324965
Revises: z4d5e6f7a8b9
Create Date: 2026-07-27 13:17:57.108724

"""
from typing import Sequence, Union
from sqlalchemy import inspect

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql


# revision identifiers, used by Alembic.
revision: str = 'eb28ed324965'
down_revision: Union[str, None] = 'z4d5e6f7a8b9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    op.create_table(
        "customers_temp",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("customer_no", sa.String(20), nullable=False, unique=True),

        sa.Column("customer_name", sa.String(200), nullable=False),

        sa.Column(
            "entity_type",
            sa.Enum("company", "individual", name="customerentitytype"),
            nullable=False,
        ),

        sa.Column(
            "category",
            sa.Enum(
                "retail",
                "industrial",
                "government",
                "distributor",
                name="customercategory",
            ),
            nullable=False,
        ),

        sa.Column("company_email", sa.String(150)),

        sa.Column("rc_number", sa.String(50)),
        sa.Column("tin", sa.String(50)),
        sa.Column("vat_number", sa.String(50)),
        sa.Column("industry", sa.String(100)),

        sa.Column(
            "customer_type",
            sa.Enum(
                "potential",
                "purchasing",
                name="customertype",
            ),
            nullable=False,
        ),

        sa.Column(
            "sales_contact",
            mysql.CHAR(36),
            sa.ForeignKey("employees.id"),
        ),

        sa.Column(
            "referrer_type",
            sa.Enum(
                "employee",
                "customer",
                "partner",
                "consultant",
                "marketing",
                name="referrertype",
            ),
        ),

        sa.Column("referrer_id", sa.String(150)),

        sa.Column("contact_person", sa.String(150), nullable=False),
        sa.Column("department", sa.String(100)),

        sa.Column("email", sa.String(150), nullable=False),
        sa.Column("phone", sa.String(30), nullable=False),
        sa.Column("alternate_phone", sa.String(30)),

        sa.Column("country", sa.String(100), nullable=False),
        sa.Column("state", sa.String(100)),
        sa.Column("city", sa.String(100)),

        sa.Column("address_line1", sa.String(255), nullable=False),
        sa.Column("address_line2", sa.String(255)),

        sa.Column("postal_code", sa.String(20)),

        sa.Column("preferred_products", sa.JSON()),

        sa.Column("supply_method", sa.String(100)),
        sa.Column("estimated_monthly_demand", sa.String(100)),

        sa.Column("internal_notes", sa.Text()),

        sa.Column(
            "status",
            sa.Enum(
                "draft",
                "active",
                "inactive",
                name="customerstatus",
            ),
            nullable=False,
            server_default="draft",
        ),

        sa.Column(
            "created_by",
            mysql.CHAR(36),
            sa.ForeignKey("employees.id"),
            nullable=False,
        ),

        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),

        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    op.create_index("ix_customers_temp_id","customers_temp",["id"])    
    pass
    op.create_table(
        "customer_contacts",

        sa.Column("id", sa.String(36), primary_key=True),

        sa.Column(
            "contact_no",
            sa.String(20),
            nullable=False,
            unique=True,
        ),

        sa.Column(
            "customer_id",
            sa.String(36),
            sa.ForeignKey("customers_temp.id"),
            nullable=False,
        ),

        sa.Column(
            "created_by",
            mysql.CHAR(36),
            sa.ForeignKey("employees.id"),
            nullable=False,
        ),

        sa.Column(
            "first_name",
            sa.String(100),
            nullable=False,
        ),

        sa.Column(
            "last_name",
            sa.String(100),
            nullable=False,
        ),

        sa.Column("position", sa.String(100)),
        sa.Column("role", sa.String(100)),
        sa.Column("department", sa.String(100)),

        sa.Column(
            "email",
            sa.String(150),
            nullable=False,
        ),

        sa.Column(
            "phone",
            sa.String(30),
            nullable=False,
        ),

        sa.Column(
            "alternate_phone",
            sa.String(30),
        ),

        sa.Column(
            "preferred_channel",
            sa.Enum(
                "email",
                "phone",
                "whatsapp",
                name="preferredchannel",
            ),
            nullable=False,
            server_default="email",
        ),

        sa.Column(
            "is_primary",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),

        sa.Column(
            "status",
            sa.Enum(
                "active",
                "inactive",
                name="contactstatus",
            ),
            nullable=False,
            server_default="active",
        ),

        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),

        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    op.create_index(
        "ix_customer_contacts_id",
        "customer_contacts",
        ["id"],
    )

def downgrade():
    bind = op.get_bind()
    inspector = inspect(bind)

    tables = inspector.get_table_names()

    if "customer_contacts" in tables:
        op.drop_table("customer_contacts")

    if "customers_temp" in tables:
        op.drop_table("customers_temp")
