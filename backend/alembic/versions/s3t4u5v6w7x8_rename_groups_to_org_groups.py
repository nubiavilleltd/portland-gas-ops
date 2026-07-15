"""rename_groups_to_org_groups

Revision ID: s3t4u5v6w7x8
Revises: q1r2s3t4u5v6
Create Date: 2026-07-14

`groups` is a reserved word in MySQL 8.0 (window functions), causing SQLAlchemy
to emit double-quoted identifiers which MySQL rejects in default sql_mode.
Rename to `org_groups` to avoid the conflict.

Changes:
- Rename table `groups` → `org_groups`
- Update FK on `group_members.group_id` to reference `org_groups`
- Update FK on `workflow_steps.group_id` to reference `org_groups`
"""
from alembic import op
import sqlalchemy as sa


revision = 's3t4u5v6w7x8'
down_revision = 'q1r2s3t4u5v6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("SET FOREIGN_KEY_CHECKS = 0"))

    # ── 1. Drop FKs that reference `groups` ───────────────────────────────────
    with op.batch_alter_table('group_members') as batch_op:
        batch_op.drop_constraint('group_members_ibfk_1', type_='foreignkey')

    with op.batch_alter_table('workflow_steps') as batch_op:
        batch_op.drop_constraint('fk_workflow_steps_group_id', type_='foreignkey')

    # ── 2. Rename the table ───────────────────────────────────────────────────
    op.rename_table('groups', 'org_groups')

    # ── 3. Re-add FKs pointing to `org_groups` ────────────────────────────────
    with op.batch_alter_table('group_members') as batch_op:
        batch_op.create_foreign_key(
            'fk_group_members_group_id',
            'org_groups',
            ['group_id'], ['id'],
            ondelete='CASCADE',
        )

    with op.batch_alter_table('workflow_steps') as batch_op:
        batch_op.create_foreign_key(
            'fk_workflow_steps_group_id',
            'org_groups',
            ['group_id'], ['id'],
            ondelete='SET NULL',
        )

    conn.execute(sa.text("SET FOREIGN_KEY_CHECKS = 1"))


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("SET FOREIGN_KEY_CHECKS = 0"))

    with op.batch_alter_table('group_members') as batch_op:
        batch_op.drop_constraint('fk_group_members_group_id', type_='foreignkey')

    with op.batch_alter_table('workflow_steps') as batch_op:
        batch_op.drop_constraint('fk_workflow_steps_group_id', type_='foreignkey')

    op.rename_table('org_groups', 'groups')

    with op.batch_alter_table('group_members') as batch_op:
        batch_op.create_foreign_key(
            'group_members_ibfk_1',
            'groups',
            ['group_id'], ['id'],
            ondelete='CASCADE',
        )

    with op.batch_alter_table('workflow_steps') as batch_op:
        batch_op.create_foreign_key(
            'fk_workflow_steps_group_id',
            'groups',
            ['group_id'], ['id'],
            ondelete='SET NULL',
        )

    conn.execute(sa.text("SET FOREIGN_KEY_CHECKS = 1"))
