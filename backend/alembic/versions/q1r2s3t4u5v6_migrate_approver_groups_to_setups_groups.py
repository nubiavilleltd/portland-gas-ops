"""migrate_approver_groups_to_setups_groups

Revision ID: q1r2s3t4u5v6
Revises: p0q1r2s3t4u5
Create Date: 2026-07-14

Phase 1 of Groups migration:
- Creates new `groups` table (replaces `approver_groups`)
- Creates new `group_members` table (replaces `approver_group_members`)
- Copies all existing data from old tables to new ones
- Updates `workflow_steps.group_id` FK to point to `groups`
- Drops old `approver_group_members` and `approver_groups` tables
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'q1r2s3t4u5v6'
down_revision = 'p0q1r2s3t4u5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── 1. Create new `groups` table ─────────────────────────────────────────
    op.create_table(
        'groups',
        sa.Column('id',          sa.CHAR(36),    primary_key=True),
        sa.Column('name',        sa.String(100), nullable=False),
        sa.Column('description', sa.Text,        nullable=True),
        sa.Column('group_type',  sa.String(50),  nullable=False, server_default='general'),
        sa.Column('is_active',   sa.Boolean,     nullable=False, server_default=sa.true()),
        sa.Column('created_by',  sa.CHAR(36),    sa.ForeignKey('employees.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at',  sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at',  sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )

    # ── 2. Create new `group_members` table ──────────────────────────────────
    op.create_table(
        'group_members',
        sa.Column('id',          sa.CHAR(36), primary_key=True),
        sa.Column('group_id',    sa.CHAR(36), sa.ForeignKey('groups.id',     ondelete='CASCADE'), nullable=False),
        sa.Column('employee_id', sa.CHAR(36), sa.ForeignKey('employees.id',  ondelete='CASCADE'), nullable=False),
        sa.Column('added_at',    sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # ── 3. Copy data from approver_groups → groups ───────────────────────────
    op.execute("""
        INSERT INTO `groups` (id, name, description, group_type, is_active, created_by, created_at, updated_at)
        SELECT id, name, description, 'general', is_active, created_by, created_at, updated_at
        FROM approver_groups
    """)

    # ── 4. Copy data from approver_group_members → group_members ─────────────
    op.execute("""
        INSERT INTO group_members (id, group_id, employee_id, added_at)
        SELECT id, group_id, employee_id, added_at
        FROM approver_group_members
    """)

    # ── 5. Update workflow_steps.group_id FK: drop old, add new ──────────────
    # Drop the old FK constraint on workflow_steps → approver_groups
    # MySQL constraint names are auto-generated; use batch_alter_table for safety
    with op.batch_alter_table('workflow_steps') as batch_op:
        # Drop old FK (constraint name may vary — use referent table approach)
        batch_op.drop_constraint('workflow_steps_ibfk_3', type_='foreignkey')
        batch_op.create_foreign_key(
            'fk_workflow_steps_group_id',
            'groups',
            ['group_id'],
            ['id'],
            ondelete='SET NULL',
        )

    # ── 6. Drop old tables ────────────────────────────────────────────────────
    op.drop_table('approver_group_members')
    op.drop_table('approver_groups')


def downgrade() -> None:
    # Recreate old tables
    op.create_table(
        'approver_groups',
        sa.Column('id',          sa.CHAR(36),    primary_key=True),
        sa.Column('name',        sa.String(100), nullable=False),
        sa.Column('description', sa.Text,        nullable=True),
        sa.Column('is_active',   sa.Boolean,     nullable=False, server_default=sa.true()),
        sa.Column('created_by',  sa.CHAR(36),    sa.ForeignKey('employees.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at',  sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at',  sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_table(
        'approver_group_members',
        sa.Column('id',          sa.CHAR(36), primary_key=True),
        sa.Column('group_id',    sa.CHAR(36), sa.ForeignKey('approver_groups.id', ondelete='CASCADE'), nullable=False),
        sa.Column('employee_id', sa.CHAR(36), sa.ForeignKey('employees.id',       ondelete='CASCADE'), nullable=False),
        sa.Column('added_at',    sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.execute("""
        INSERT INTO approver_groups (id, name, description, is_active, created_by, created_at, updated_at)
        SELECT id, name, description, is_active, created_by, created_at, updated_at
        FROM `groups`
    """)
    op.execute("""
        INSERT INTO approver_group_members (id, group_id, employee_id, added_at)
        SELECT id, group_id, employee_id, added_at
        FROM group_members
    """)

    with op.batch_alter_table('workflow_steps') as batch_op:
        batch_op.drop_constraint('fk_workflow_steps_group_id', type_='foreignkey')
        batch_op.create_foreign_key(
            'workflow_steps_ibfk_3',
            'approver_groups',
            ['group_id'],
            ['id'],
            ondelete='SET NULL',
        )

    op.drop_table('group_members')
    op.drop_table('groups')
