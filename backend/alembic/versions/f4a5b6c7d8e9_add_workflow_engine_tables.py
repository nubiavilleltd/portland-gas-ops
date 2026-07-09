"""Add workflow engine tables

Drops the old stub approval tables (approval_requests, approval_steps,
step_assignees, approval_history) and replaces them with the full
workflow engine schema:

  approval_workflows, workflow_steps, approver_groups,
  approver_group_members, workflow_assignments, approval_requests (new),
  approval_step_assignments, approval_history (new), workflow_audit_trail,
  all_requests, notifications

Revision ID: f4a5b6c7d8e9
Revises: e3f4a5b6c7d8
Create Date: 2026-07-02
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.mysql import CHAR

revision: str = "f4a5b6c7d8e9"
down_revision: Union[str, None] = "e3f4a5b6c7d8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _table_exists(table_name: str) -> bool:
    from sqlalchemy import text, inspect
    conn = op.get_bind()
    return inspect(conn).has_table(table_name)


def upgrade() -> None:
    conn = op.get_bind()

    # ── 1. Drop old stub approval tables ──────────────────────────────────────
    # Disable FK checks so we can drop in any order (MySQL requirement)
    conn.execute(sa.text("SET FOREIGN_KEY_CHECKS = 0"))

    for tbl in ("step_assignees", "approval_steps", "approval_history", "approval_requests"):
        if _table_exists(tbl):
            op.drop_table(tbl)

    conn.execute(sa.text("SET FOREIGN_KEY_CHECKS = 1"))

    # ── 2. approval_workflows ─────────────────────────────────────────────────
    op.create_table(
        "approval_workflows",
        sa.Column("id",              CHAR(36),      primary_key=True),
        sa.Column("name",            sa.String(100), nullable=False),
        sa.Column("description",     sa.Text,        nullable=True),
        sa.Column("is_active",       sa.Boolean,     nullable=False, server_default="1"),
        sa.Column("reset_on_return", sa.Boolean,     nullable=False, server_default="1"),
        sa.Column("created_at",      sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    # ── 3. approver_groups ────────────────────────────────────────────────────
    op.create_table(
        "approver_groups",
        sa.Column("id",          CHAR(36),       primary_key=True),
        sa.Column("name",        sa.String(100), nullable=False),
        sa.Column("description", sa.Text,        nullable=True),
        sa.Column("is_active",   sa.Boolean,     nullable=False, server_default="1"),
        sa.Column("created_by",  CHAR(36),       sa.ForeignKey("employees.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at",  sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("updated_at",  sa.DateTime(timezone=True), nullable=True),
    )

    # ── 4. approver_group_members ─────────────────────────────────────────────
    op.create_table(
        "approver_group_members",
        sa.Column("id",          CHAR(36), primary_key=True),
        sa.Column("group_id",    CHAR(36), sa.ForeignKey("approver_groups.id",  ondelete="CASCADE"),  nullable=False),
        sa.Column("employee_id", CHAR(36), sa.ForeignKey("employees.id",        ondelete="CASCADE"),  nullable=False),
        sa.Column("added_at",    sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    # ── 5. workflow_steps ─────────────────────────────────────────────────────
    op.create_table(
        "workflow_steps",
        sa.Column("id",            CHAR(36),       primary_key=True),
        sa.Column("workflow_id",   CHAR(36),       sa.ForeignKey("approval_workflows.id", ondelete="CASCADE"), nullable=False),
        sa.Column("step_number",   sa.Integer,     nullable=False),
        sa.Column("step_name",     sa.String(100), nullable=False),
        sa.Column("assignee_type", sa.Enum(
            "role",
            "specific",
            "requester_pick",
            "requester_operations_manager",
            "requester_hod",
            "requester_skip_level",
            name="assigneetype",
        ), nullable=False),
        sa.Column("role",        sa.String(80), nullable=True),
        sa.Column("employee_id", CHAR(36),      sa.ForeignKey("employees.id",      ondelete="SET NULL"), nullable=True),
        sa.Column("group_id",    CHAR(36),      sa.ForeignKey("approver_groups.id", ondelete="SET NULL"), nullable=True),
        sa.Column("can_approve", sa.Boolean, nullable=False, server_default="1"),
        sa.Column("can_reject",  sa.Boolean, nullable=False, server_default="1"),
        sa.Column("can_return",  sa.Boolean, nullable=False, server_default="0"),
        sa.Column("created_at",  sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    # ── 6. workflow_assignments ───────────────────────────────────────────────
    op.create_table(
        "workflow_assignments",
        sa.Column("id",           CHAR(36),      primary_key=True),
        sa.Column("request_type", sa.String(50), nullable=False, unique=True),
        sa.Column("workflow_id",  CHAR(36),      sa.ForeignKey("approval_workflows.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("is_active",    sa.Boolean,    nullable=False, server_default="1"),
        sa.Column("updated_by",   CHAR(36),      sa.ForeignKey("employees.id", ondelete="SET NULL"), nullable=True),
        sa.Column("updated_at",   sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    # ── 7. approval_requests (new) ────────────────────────────────────────────
    op.create_table(
        "approval_requests",
        sa.Column("id",                  CHAR(36),      primary_key=True),
        sa.Column("workflow_id",         CHAR(36),      sa.ForeignKey("approval_workflows.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("request_type",        sa.String(50), nullable=False),
        sa.Column("request_id",          sa.String(36), nullable=False),   # UUID of source row
        sa.Column("submitted_by",        CHAR(36),      sa.ForeignKey("employees.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("current_step_number", sa.Integer,    nullable=False, server_default="1"),
        sa.Column("overall_status",      sa.Enum(
            "pending", "approved", "rejected", "returned",
            name="approvaloverallstatus",
        ), nullable=False, server_default="pending"),
        sa.Column("attempt_number", sa.Integer, nullable=False, server_default="1"),
        sa.Column("created_at",     sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("updated_at",     sa.DateTime(timezone=True), nullable=True),
    )

    # ── 8. approval_step_assignments ──────────────────────────────────────────
    op.create_table(
        "approval_step_assignments",
        sa.Column("id",                  CHAR(36), primary_key=True),
        sa.Column("approval_request_id", CHAR(36), sa.ForeignKey("approval_requests.id", ondelete="CASCADE"), nullable=False),
        sa.Column("step_number",         sa.Integer, nullable=False),
        sa.Column("assigned_to",         CHAR(36),   sa.ForeignKey("employees.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("assigned_at",         sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    # ── 9. approval_history (new) ─────────────────────────────────────────────
    op.create_table(
        "approval_history",
        sa.Column("id",                  CHAR(36), primary_key=True),
        sa.Column("approval_request_id", CHAR(36), sa.ForeignKey("approval_requests.id", ondelete="CASCADE"), nullable=False),
        sa.Column("step_number",         sa.Integer, nullable=False),
        sa.Column("actor_id",            CHAR(36),   sa.ForeignKey("employees.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("action",              sa.Enum(
            "approved", "rejected", "returned", "escalated",
            name="approvalhistoryaction",
        ), nullable=False),
        sa.Column("comment",  sa.Text,  nullable=True),
        sa.Column("acted_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    # ── 10. workflow_audit_trail ──────────────────────────────────────────────
    op.create_table(
        "workflow_audit_trail",
        sa.Column("id",           CHAR(36),      primary_key=True),
        sa.Column("workflow_id",  CHAR(36),      sa.ForeignKey("approval_workflows.id", ondelete="SET NULL"), nullable=True),
        sa.Column("request_id",   sa.String(36), nullable=False),
        sa.Column("request_type", sa.String(50), nullable=False),
        sa.Column("actor_id",     CHAR(36),      sa.ForeignKey("employees.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("actor_role",   sa.String(80), nullable=True),
        sa.Column("step_number",  sa.Integer,    nullable=True),
        sa.Column("action",       sa.Enum(
            "submitted", "approved", "rejected", "returned", "escalated", "recalled",
            name="auditaction",
        ), nullable=False),
        sa.Column("comment",   sa.Text, nullable=True),
        sa.Column("acted_at",  sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    # ── 11. all_requests ─────────────────────────────────────────────────────
    op.create_table(
        "all_requests",
        sa.Column("id",                  CHAR(36),       primary_key=True),
        sa.Column("reference",           sa.String(20),  nullable=False, unique=True),
        sa.Column("request_type",        sa.String(50),  nullable=False),
        sa.Column("request_id",          sa.String(36),  nullable=False),
        sa.Column("title",               sa.String(200), nullable=False),
        sa.Column("raised_by",           CHAR(36),       sa.ForeignKey("employees.id",       ondelete="RESTRICT"), nullable=False),
        sa.Column("department",          sa.String(100), nullable=True),
        sa.Column("status",              sa.Enum(
            "pending", "approved", "rejected", "returned",
            name="allrequeststatus",
        ), nullable=False, server_default="pending"),
        sa.Column("approval_request_id", CHAR(36),       sa.ForeignKey("approval_requests.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at",          sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("updated_at",          sa.DateTime(timezone=True), nullable=True),
    )

    # ── 12. notifications ─────────────────────────────────────────────────────
    op.create_table(
        "notifications",
        sa.Column("id",             CHAR(36),       primary_key=True),
        sa.Column("recipient_id",   CHAR(36),       sa.ForeignKey("employees.id", ondelete="CASCADE"), nullable=False),
        sa.Column("type",           sa.Enum(
            "approval_required", "approved", "rejected", "returned", "info",
            name="notificationtype",
        ), nullable=False),
        sa.Column("title",          sa.String(200), nullable=False),
        sa.Column("message",        sa.Text,        nullable=False),
        sa.Column("reference_type", sa.String(50),  nullable=True),
        sa.Column("reference_id",   sa.String(36),  nullable=True),
        sa.Column("is_read",        sa.Boolean,     nullable=False, server_default="0"),
        sa.Column("created_at",     sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("SET FOREIGN_KEY_CHECKS = 0"))

    for tbl in (
        "notifications",
        "all_requests",
        "workflow_audit_trail",
        "approval_history",
        "approval_step_assignments",
        "approval_requests",
        "workflow_assignments",
        "workflow_steps",
        "approver_group_members",
        "approver_groups",
        "approval_workflows",
    ):
        if _table_exists(tbl):
            op.drop_table(tbl)

    conn.execute(sa.text("SET FOREIGN_KEY_CHECKS = 1"))

    # Recreate old stub tables
    op.create_table(
        "approval_requests",
        sa.Column("id",              sa.String(36),  primary_key=True),
        sa.Column("workflow_type",   sa.String(100), nullable=False),
        sa.Column("reference_id",    sa.String(36),  nullable=False),
        sa.Column("reference_label", sa.String(255), nullable=False),
        sa.Column("status",          sa.String(20),  nullable=False),
        sa.Column("current_step",    sa.Integer,     nullable=False),
        sa.Column("total_steps",     sa.Integer,     nullable=False),
        sa.Column("created_by",      sa.String(36),  nullable=False),
        sa.Column("created_at",      sa.DateTime,    server_default=sa.text("NOW()")),
        sa.Column("updated_at",      sa.DateTime,    nullable=True),
    )
    op.create_table(
        "approval_history",
        sa.Column("id",          sa.String(36), primary_key=True),
        sa.Column("request_id",  sa.String(36), nullable=False),
        sa.Column("action",      sa.String(100), nullable=False),
        sa.Column("actor_id",    sa.String(36), nullable=False),
        sa.Column("step_number", sa.Integer,    nullable=True),
        sa.Column("comment",     sa.Text,       nullable=True),
        sa.Column("timestamp",   sa.DateTime,   server_default=sa.text("NOW()")),
    )
    op.create_table(
        "approval_steps",
        sa.Column("id",           sa.String(36), primary_key=True),
        sa.Column("request_id",   sa.String(36), nullable=False),
        sa.Column("step_number",  sa.Integer,    nullable=False),
        sa.Column("step_type",    sa.String(20), nullable=False),
        sa.Column("group_rule",   sa.String(20), nullable=True),
        sa.Column("status",       sa.String(20), nullable=False),
        sa.Column("completed_at", sa.DateTime,   nullable=True),
    )
    op.create_table(
        "step_assignees",
        sa.Column("id",         sa.String(36), primary_key=True),
        sa.Column("step_id",    sa.String(36), nullable=False),
        sa.Column("user_id",    sa.String(36), nullable=False),
        sa.Column("decision",   sa.String(20), nullable=False),
        sa.Column("decided_at", sa.DateTime,   nullable=True),
        sa.Column("comment",    sa.Text,       nullable=True),
    )
