"""add_departments_table_migrate_employee_department

Revision ID: r2s3t4u5v6w7
Revises: q1r2s3t4u5v6
Create Date: 2026-07-14

Phase 2 — Departments:
- Creates `departments` table (id, name, code, is_active, hod_id, parent_dept_id, timestamps)
- Seeds 10 departments from the old enum (operations/finance/safety/hr/it/logistics/executive/engineering/procurement/admin)
- Adds `department_id` nullable FK to `employees`
- Backfills `department_id` from the old `department` enum column (matches on code = enum value)
- Drops the old `department` enum column from `employees`
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.mysql import CHAR


revision = 'r2s3t4u5v6w7'
down_revision = 'q1r2s3t4u5v6'
branch_labels = None
depends_on = None

# Fixed UUIDs for seed rows so the backfill SQL is deterministic
DEPARTMENTS = [
    ("d0000001-0000-0000-0000-000000000001", "operations",   "Operations"),
    ("d0000001-0000-0000-0000-000000000002", "finance",      "Finance"),
    ("d0000001-0000-0000-0000-000000000003", "safety",       "HSE"),
    ("d0000001-0000-0000-0000-000000000004", "hr",           "HR"),
    ("d0000001-0000-0000-0000-000000000005", "it",           "IT"),
    ("d0000001-0000-0000-0000-000000000006", "logistics",    "Logistics"),
    ("d0000001-0000-0000-0000-000000000007", "executive",    "Executive"),
    ("d0000001-0000-0000-0000-000000000008", "engineering",  "Engineering"),
    ("d0000001-0000-0000-0000-000000000009", "procurement",  "Procurement"),
    ("d0000001-0000-0000-0000-000000000010", "admin",        "Admin"),
]


def upgrade() -> None:
    conn = op.get_bind()

    # ── 1. Create `departments` table ─────────────────────────────────────────
    op.create_table(
        'departments',
        sa.Column('id',             CHAR(36),       nullable=False),
        sa.Column('name',           sa.String(150), nullable=False),
        sa.Column('code',           sa.String(50),  nullable=False),
        sa.Column('is_active',      sa.Boolean,     nullable=False, server_default=sa.true()),
        sa.Column('hod_id',         CHAR(36),       sa.ForeignKey('employees.id', ondelete='SET NULL'), nullable=True),
        sa.Column('parent_dept_id', CHAR(36),       sa.ForeignKey('departments.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at',     sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at',     sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
        sa.UniqueConstraint('code'),
    )

    # ── 2. Seed the 10 departments ────────────────────────────────────────────
    for dept_id, code, name in DEPARTMENTS:
        conn.execute(
            sa.text(
                "INSERT INTO departments (id, name, code, is_active) "
                "VALUES (:id, :name, :code, 1)"
            ),
            {"id": dept_id, "name": name, "code": code},
        )

    # ── 3. Add `department_id` FK column to employees ──────────────────────────
    op.add_column(
        'employees',
        sa.Column('department_id', CHAR(36), nullable=True),
    )
    op.create_foreign_key(
        'fk_employees_department_id',
        'employees', 'departments',
        ['department_id'], ['id'],
        ondelete='SET NULL',
    )

    # ── 4. Backfill: match old enum value → departments.code ──────────────────
    conn.execute(sa.text("""
        UPDATE employees e
        JOIN departments d ON d.code = e.department
        SET e.department_id = d.id
        WHERE e.department IS NOT NULL
    """))

    # ── 5. Drop old `department` enum column ──────────────────────────────────
    op.drop_column('employees', 'department')


def downgrade() -> None:
    conn = op.get_bind()

    # Re-add old enum column
    op.add_column(
        'employees',
        sa.Column(
            'department',
            sa.Enum(
                'operations', 'finance', 'safety', 'hr', 'it',
                'logistics', 'executive', 'engineering', 'procurement', 'admin',
                name='department',
            ),
            nullable=True,
        ),
    )

    # Backfill in reverse: department name → enum value via code
    conn.execute(sa.text("""
        UPDATE employees e
        JOIN departments d ON d.id = e.department_id
        SET e.department = d.code
        WHERE e.department_id IS NOT NULL
    """))

    # Drop FK and new column
    op.drop_constraint('fk_employees_department_id', 'employees', type_='foreignkey')
    op.drop_column('employees', 'department_id')

    # Drop seeded rows then the table
    conn.execute(sa.text("DELETE FROM departments WHERE id LIKE 'd0000001-%'"))
    op.drop_table('departments')
