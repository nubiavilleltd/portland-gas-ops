"""Add leave request approval workflow

Creates the leave request approval workflow with 3 steps:
- Step 1: Reliever (requester_pick)
- Step 2: Operations Manager (role-based)
- Step 3: Human Resource (specific person - to be configured by admins)

Revision ID: x8y9z0a1b2c3
Revises: w7x8y9z0a1b2
Create Date: 2026-07-14
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
import uuid

revision: str = "x8y9z0a1b2c3"
down_revision: Union[str, None] = "w7x8y9z0a1b2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    workflow_id = str(uuid.uuid4())
    step1_id    = str(uuid.uuid4())
    step2_id    = str(uuid.uuid4())
    step3_id    = str(uuid.uuid4())

    # 1. Create the leave request workflow
    conn.execute(sa.text("""
        INSERT INTO approval_workflows (id, name, description, is_active, reset_on_return, created_at)
        VALUES (:id, :name, :description, :is_active, :reset_on_return, NOW())
    """), {
        "id": workflow_id,
        "name": "Leave Request",
        "description": "Workflow for raising leave requests",
        "is_active": True,
        "reset_on_return": True,
    })

    # 2. Step 1 — Reliever (requester picks)
    conn.execute(sa.text("""
        INSERT INTO workflow_steps
            (id, workflow_id, step_number, step_name, assignee_type, role, employee_id, group_id,
             can_approve, can_reject, can_return, created_at)
        VALUES
            (:id, :workflow_id, 1, 'Reliever', 'requester_pick', NULL, NULL, NULL,
             TRUE, TRUE, FALSE, NOW())
    """), {"id": step1_id, "workflow_id": workflow_id})

    # 3. Step 2 — Operations Manager (role-based)
    conn.execute(sa.text("""
        INSERT INTO workflow_steps
            (id, workflow_id, step_number, step_name, assignee_type, role, employee_id, group_id,
             can_approve, can_reject, can_return, created_at)
        VALUES
            (:id, :workflow_id, 2, 'Operations Manager', 'role', 'Operations Manager', NULL, NULL,
             TRUE, TRUE, TRUE, NOW())
    """), {"id": step2_id, "workflow_id": workflow_id})

    # 4. Step 3 — Human Resource (admins configure employee_id via UI)
    conn.execute(sa.text("""
        INSERT INTO workflow_steps
            (id, workflow_id, step_number, step_name, assignee_type, role, employee_id, group_id,
             can_approve, can_reject, can_return, created_at)
        VALUES
            (:id, :workflow_id, 3, 'Human Resource', 'specific', NULL, NULL, NULL,
             TRUE, TRUE, TRUE, NOW())
    """), {"id": step3_id, "workflow_id": workflow_id})

    # 5. Assign workflow to leave_request type
    conn.execute(sa.text("""
        INSERT INTO workflow_assignments (id, request_type, workflow_id, is_active, updated_at)
        VALUES (:id, 'leave_request', :workflow_id, TRUE, NOW())
    """), {"id": str(uuid.uuid4()), "workflow_id": workflow_id})


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("DELETE FROM workflow_assignments WHERE request_type = 'leave_request'"))
    conn.execute(sa.text("DELETE FROM approval_workflows WHERE name = 'Leave Request'"))
