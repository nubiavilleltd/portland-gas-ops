"""add_employees_and_documents_tables — also drops safety tables (confirmed by dev)

Revision ID: 03314566dcfe
Revises: e8f9a0b1c2d3
Create Date: 2026-06-19 12:44:29.069491

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

revision: str = '03314566dcfe'
down_revision: Union[str, None] = 'e8f9a0b1c2d3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop partial state from a previous failed run (DDL is non-transactional in MySQL)
    op.execute("DROP TABLE IF EXISTS documents")
    op.execute("DROP TABLE IF EXISTS employees")

    # ── Create employees ──────────────────────────────────────────────────────
    op.create_table('employees',
    sa.Column('id', mysql.CHAR(length=36), nullable=False),
    sa.Column('user_id', mysql.CHAR(length=36), nullable=False),
    sa.Column('employee_no', sa.String(length=20), nullable=False),
    sa.Column('job_title', sa.String(length=150), nullable=True),
    sa.Column('department', sa.Enum('operations', 'finance', 'safety', 'hr', 'it', 'logistics',
                                    'executive', 'engineering', 'procurement', 'admin',
                                    name='department'), nullable=True),
    sa.Column('phone', sa.String(length=20), nullable=True),
    sa.Column('birthday', sa.Date(), nullable=True),
    sa.Column('employment_type', sa.Enum('full_time', 'part_time', 'contract', 'intern',
                                         name='employmenttype'), nullable=True),
    sa.Column('hire_date', sa.Date(), nullable=True),
    sa.Column('line_manager_id', mysql.CHAR(length=36), nullable=True),
    sa.Column('basic_salary', sa.Numeric(precision=15, scale=2), nullable=True),
    sa.Column('housing_allowance', sa.Numeric(precision=15, scale=2), nullable=True),
    sa.Column('transport_allowance', sa.Numeric(precision=15, scale=2), nullable=True),
    sa.Column('meal_allowance', sa.Numeric(precision=15, scale=2), nullable=True),
    sa.Column('paye', sa.Numeric(precision=15, scale=2), nullable=True),
    sa.Column('pension', sa.Numeric(precision=15, scale=2), nullable=True),
    sa.Column('nhf', sa.Numeric(precision=15, scale=2), nullable=True),
    sa.Column('loan_repayment', sa.Numeric(precision=15, scale=2), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['line_manager_id'], ['employees.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id'),
    )
    op.create_index(op.f('ix_employees_employee_no'), 'employees', ['employee_no'], unique=True)

    # ── Create documents ──────────────────────────────────────────────────────
    op.create_table('documents',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('parent_id', sa.Integer(), nullable=True),
    sa.Column('type', sa.String(length=10), nullable=False),
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('category', sa.String(length=80), nullable=True),
    sa.Column('file_path', sa.Text(), nullable=True),
    sa.Column('file_size', sa.BigInteger(), nullable=True),
    sa.Column('mime_type', sa.String(length=100), nullable=True),
    sa.Column('uploaded_by', mysql.CHAR(length=36), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['parent_id'], ['documents.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['uploaded_by'], ['employees.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id'),
    )

    # ── Alter users ───────────────────────────────────────────────────────────
    op.add_column('users', sa.Column('first_name', sa.String(length=100), nullable=True))
    op.add_column('users', sa.Column('last_name', sa.String(length=100), nullable=True))
    op.add_column('users', sa.Column('account_status',
                                     sa.Enum('pending', 'active', 'deactivated', name='accountstatus'),
                                     nullable=False, server_default='active'))
    op.add_column('users', sa.Column('profile_picture', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('last_login', sa.DateTime(timezone=True), nullable=True))
    op.alter_column('users', 'name', existing_type=mysql.VARCHAR(length=255), nullable=True)
    op.alter_column('users', 'department',
                    existing_type=mysql.ENUM('operations', 'finance', 'safety', 'hr', 'it',
                                             'logistics', 'executive', 'engineering'),
                    type_=sa.String(length=80),
                    existing_nullable=True)

    # ── Drop safety tables (child tables first to satisfy FK constraints) ─────
    # Children of safety_work_initiations
    op.execute("DROP TABLE IF EXISTS safety_work_initiation_workers")
    op.execute("DROP TABLE IF EXISTS safety_work_closeouts")
    op.execute("DROP TABLE IF EXISTS safety_work_authorizations")
    op.execute("DROP TABLE IF EXISTS safety_work_initiations")
    # Children of safety_incident_reports
    op.execute("DROP TABLE IF EXISTS safety_incident_hse_reviews")
    op.execute("DROP TABLE IF EXISTS safety_incident_reports")
    # Children of safety_checklist_templates
    op.execute("DROP TABLE IF EXISTS safety_checklist_responses")
    op.execute("DROP TABLE IF EXISTS safety_checklist_items")
    op.execute("DROP TABLE IF EXISTS safety_checklist_templates")


def downgrade() -> None:
    op.alter_column('users', 'department',
                    existing_type=sa.String(length=80),
                    type_=mysql.ENUM('operations', 'finance', 'safety', 'hr', 'it',
                                     'logistics', 'executive', 'engineering'),
                    existing_nullable=True)
    op.alter_column('users', 'name', existing_type=mysql.VARCHAR(length=255), nullable=False)
    op.drop_column('users', 'last_login')
    op.drop_column('users', 'profile_picture')
    op.drop_column('users', 'account_status')
    op.drop_column('users', 'last_name')
    op.drop_column('users', 'first_name')
    op.drop_table('documents')
    op.drop_index(op.f('ix_employees_employee_no'), table_name='employees')
    op.drop_table('employees')
    # Note: safety tables are not restored in downgrade — drop is permanent
