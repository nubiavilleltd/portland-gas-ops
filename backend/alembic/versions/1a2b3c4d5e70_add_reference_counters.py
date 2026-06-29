"""add reference counters

Revision ID: 1a2b3c4d5e70
Revises: 0f3a2b1c9d8e
Create Date: 2026-06-27

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "1a2b3c4d5e70"
down_revision: Union[str, None] = "0f3a2b1c9d8e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "reference_counters",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("entity_type", sa.String(length=100), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("next_number", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("entity_type", "year", name="uq_reference_counters_entity_year"),
    )
    op.create_index("ix_reference_counters_entity_type", "reference_counters", ["entity_type"], unique=False)
    op.create_index("ix_reference_counters_year", "reference_counters", ["year"], unique=False)

    bind = op.get_bind()
    rows = bind.execute(
        sa.text(
            """
            SELECT reference
            FROM safety_incident_reports
            WHERE reference LIKE 'IH-%'
            """
        )
    )
    highest_by_year: dict[int, int] = {}
    for (reference,) in rows:
        parts = str(reference).split("-")
        if len(parts) != 3 or parts[0] != "IH":
            continue
        year_text, sequence_text = parts[1], parts[2]
        if not (
            len(year_text) == 4
            and year_text.isdigit()
            and sequence_text.isdigit()
        ):
            continue
        year = int(year_text)
        highest_by_year[year] = max(highest_by_year.get(year, 0), int(sequence_text))

    for year, highest in highest_by_year.items():
        bind.execute(
            sa.text(
                """
                INSERT INTO reference_counters (entity_type, year, next_number, created_at)
                VALUES (:entity_type, :year, :next_number, NOW())
                """
            ),
            {
                "entity_type": "incident_report",
                "year": year,
                "next_number": highest + 1,
            },
        )


def downgrade() -> None:
    op.drop_index("ix_reference_counters_year", table_name="reference_counters")
    op.drop_index("ix_reference_counters_entity_type", table_name="reference_counters")
    op.drop_table("reference_counters")
