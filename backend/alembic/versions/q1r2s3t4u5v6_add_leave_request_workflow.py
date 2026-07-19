"""Add leave request approval workflow

Creates the leave request approval workflow with 3 steps:
- Step 1: Reliever (requester_pick)
- Step 2: Operations Manager (role-based)
- Step 3: Human Resource (specific person - to be configured by admins)

Revision ID: q1r2s3t4u5v6
Revises: p0q1r2s3t4u5
Create Date: 2026-07-14
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
import uuid

revision: str = "q1r2s3t4u5v6"
down_revision: Union[str, None] = "p0q1r2s3t4u5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # 1. Create the leave request workflow
    workflow_id = str(uuid.uuid4())
    op.execute(
        sa.insert(sa.table('approval_workflows')).values(
            id=workflow_id,
            name="Leave Request",
            description="it is for raising leave",
            is_active=True,
            reset_on_return=True,
            created_at=sa.func.now(),
        )
    )

    # 2. Create Step 1: Reliever approval (requester picks)
    step1_id = str(uuid.uuid4())
    op.execute(
        sa.insert(sa.table('workflow_steps')).values(
            id=step1_id,
            workflow_id=workflow_id,
            step_number=1,
            step_name="Reliever",
            assignee_type="requester_pick",
            role=None,
            employee_id=None,
            group_id=None,
            can_approve=True,
            can_reject=True,
            can_return=False,
            created_at=sa.func.now(),
        )
    )

    # 3. Create Step 2: Operations Manager approval (role-based)
    step2_id = str(uuid.uuid4())
    op.execute(
        sa.insert(sa.table('workflow_steps')).values(
            id=step2_id,
            workflow_id=workflow_id,
            step_number=2,
            step_name="Operations Manager",
            assignee_type="role",
            role="Operations Manager",
            employee_id=None,
            group_id=None,
            can_approve=True,
            can_reject=True,
            can_return=True,
            created_at=sa.func.now(),
        )
    )

    # 4. Create Step 3: Human Resource approval (to be configured by admins)
    step3_id = str(uuid.uuid4())
    op.execute(
        sa.insert(sa.table('workflow_steps')).values(
            id=step3_id,
            workflow_id=workflow_id,
            step_number=3,
            step_name="Human Resource",
            assignee_type="specific",
            role=None,
            employee_id=None,  # Admins will set this via UI
            group_id=None,
            can_approve=True,
            can_reject=True,
            can_return=True,
            created_at=sa.func.now(),
        )
    )

    # 5. Create workflow assignment for leave_request
    op.execute(
        sa.insert(sa.table('workflow_assignments')).values(
            id=str(uuid.uuid4()),
            request_type="leave_request",
            workflow_id=workflow_id,
            is_active=True,
            updated_at=sa.func.now(),
        )
    )


def downgrade() -> None:
    conn = op.get_bind()

    # Delete in reverse order to avoid FK issues
    conn.execute(
        sa.text(
            "DELETE FROM workflow_assignments WHERE request_type = 'leave_request'"
        )
    )

    conn.execute(
        sa.text(
            "DELETE FROM approval_workflows WHERE name = 'Leave Request'"
        )
    )
