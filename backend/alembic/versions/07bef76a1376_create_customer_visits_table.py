"""create customer visits table

Revision ID: 07bef76a1376
Revises: 4ef19b9dc172
Create Date: 2026-08-06 11:34:12.109562

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "07bef76a1376"
down_revision: Union[str, None] = "4ef19b9dc172"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


visit_type_enum = sa.Enum(
    "Sales",
    "Courtesy",
    "Follow-up",
    "Complaint",
    "Collection",
    name="visit_type_enum",
)

visit_status_enum = sa.Enum(
    "Scheduled",
    "Completed",
    "Follow-up Required",
    "Cancelled",
    name="visit_status_enum",
)


def upgrade() -> None:

    bind = op.get_bind()

    visit_type_enum.create(bind, checkfirst=True)
    visit_status_enum.create(bind, checkfirst=True)

    op.create_table(
        "customer_visits",

        sa.Column(
            "id",
            sa.String(length=36),
            nullable=False,
        ),

        sa.Column(
            "visit_number",
            sa.String(length=20),
            nullable=False,
        ),

        sa.Column(
            "customer_id",
            sa.String(length=36),
            nullable=False,
        ),

        sa.Column(
            "contact_person",
            sa.String(length=36),
            nullable=False,
        ),

        sa.Column(
            "visit_type",
            visit_type_enum,
            nullable=False,
        ),

        sa.Column(
            "related_visit_id",
            sa.String(length=36),
            nullable=True,
        ),

        sa.Column(
            "visit_date",
            sa.DateTime(timezone=True),
            nullable=False,
        ),

        sa.Column(
            "location",
            sa.String(length=255),
            nullable=False,
        ),

        sa.Column(
            "purpose",
            sa.Text(),
            nullable=False,
        ),

        sa.Column(
            "participants",
            sa.Text(),
            nullable=True,
        ),

        sa.Column(
            "reminder_date",
            sa.Date(),
            nullable=True,
        ),

        sa.Column(
            "follow_up_required",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),

        sa.Column(
            "follow_up_date",
            sa.Date(),
            nullable=True,
        ),

        sa.Column(
            "outcome",
            sa.Text(),
            nullable=True,
        ),

        sa.Column(
            "next_action",
            sa.Text(),
            nullable=True,
        ),

        sa.Column(
            "comment",
            sa.Text(),
            nullable=True,
        ),

        sa.Column(
            "customer_feedback",
            sa.Text(),
            nullable=True,
        ),

        sa.Column(
            "customer_comments",
            sa.Text(),
            nullable=True,
        ),

        sa.Column(
            "recommendation",
            sa.Text(),
            nullable=True,
        ),

        sa.Column(
            "opportunity_identified",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),

        sa.Column(
            "opportunity_value",
            sa.Numeric(18, 2),
            nullable=True,
        ),

        sa.Column(
            "opportunity_notes",
            sa.Text(),
            nullable=True,
        ),

        sa.Column(
            "status",
            visit_status_enum,
            nullable=False,
            server_default="Scheduled",
        ),

        sa.Column(
            "created_by",
            sa.String(length=36),
            nullable=False,
        ),

        sa.Column(
            "completed_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),

        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),

        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),

        sa.PrimaryKeyConstraint("id"),

        sa.UniqueConstraint("visit_number"),

        sa.ForeignKeyConstraint(
            ["customer_id"],
            ["customers_temp.id"],
        ),

        sa.ForeignKeyConstraint(
            ["contact_person"],
            ["customer_contacts.id"],
        ),

        sa.ForeignKeyConstraint(
            ["created_by"],
            ["employees.id"],
        ),

        sa.ForeignKeyConstraint(
            ["related_visit_id"],
            ["customer_visits.id"],
        ),
    )

    op.create_index(
        "ix_customer_visits_customer_id",
        "customer_visits",
        ["customer_id"],
    )

    op.create_index(
        "ix_customer_visits_contact_person",
        "customer_visits",
        ["contact_person"],
    )

    op.create_index(
        "ix_customer_visits_created_by",
        "customer_visits",
        ["created_by"],
    )

    op.create_index(
        "ix_customer_visits_status",
        "customer_visits",
        ["status"],
    )

    op.create_index(
        "ix_customer_visits_visit_type",
        "customer_visits",
        ["visit_type"],
    )

    op.create_index(
        "ix_customer_visits_visit_date",
        "customer_visits",
        ["visit_date"],
    )

    op.create_index(
        "ix_customer_visits_related_visit",
        "customer_visits",
        ["related_visit_id"],
    )


def downgrade() -> None:

    op.drop_index(
        "ix_customer_visits_related_visit",
        table_name="customer_visits",
    )

    op.drop_index(
        "ix_customer_visits_visit_date",
        table_name="customer_visits",
    )

    op.drop_index(
        "ix_customer_visits_visit_type",
        table_name="customer_visits",
    )

    op.drop_index(
        "ix_customer_visits_status",
        table_name="customer_visits",
    )

    op.drop_index(
        "ix_customer_visits_created_by",
        table_name="customer_visits",
    )

    op.drop_index(
        "ix_customer_visits_contact_person",
        table_name="customer_visits",
    )

    op.drop_index(
        "ix_customer_visits_customer_id",
        table_name="customer_visits",
    )

    op.drop_table("customer_visits")

    bind = op.get_bind()

    visit_status_enum.drop(bind, checkfirst=True)
    visit_type_enum.drop(bind, checkfirst=True)