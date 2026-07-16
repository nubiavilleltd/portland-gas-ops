from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.employees.models import Employee
from app.shared.models.approval import (
    AllRequest,
    ApprovalOverallStatus,
    ApprovalRequest,
    ApprovalStepAssignment,
    WorkflowStep,
)
from app.shared.models.user import User


def enrich_next_workflow_actors(
    db: Session,
    request_type: str,
    responses: list,
):
    """Attach the current workflow assignee and step to response models."""
    request_ids = [response.id for response in responses]
    if not request_ids:
        return responses

    rows = (
        db.query(
            AllRequest.request_id,
            User.first_name,
            User.last_name,
            User.email,
            WorkflowStep.step_name,
        )
        .join(ApprovalRequest, ApprovalRequest.id == AllRequest.approval_request_id)
        .join(
            ApprovalStepAssignment,
            and_(
                ApprovalStepAssignment.approval_request_id == ApprovalRequest.id,
                ApprovalStepAssignment.step_number == ApprovalRequest.current_step_number,
            ),
        )
        .join(Employee, Employee.id == ApprovalStepAssignment.assigned_to)
        .join(User, User.id == Employee.user_id)
        .join(
            WorkflowStep,
            and_(
                WorkflowStep.workflow_id == ApprovalRequest.workflow_id,
                WorkflowStep.step_number == ApprovalRequest.current_step_number,
            ),
        )
        .filter(
            AllRequest.request_type == request_type,
            AllRequest.request_id.in_(request_ids),
            ApprovalRequest.overall_status == ApprovalOverallStatus.pending,
        )
        .all()
    )

    actor_by_request_id = {
        row.request_id: {
            "name": " ".join(
                part for part in (row.first_name, row.last_name) if part
            )
            or row.email,
            "role": row.step_name,
        }
        for row in rows
    }

    for response in responses:
        actor = actor_by_request_id.get(response.id)
        if actor:
            response.next_actor_name = actor["name"]
            response.current_step_name = actor["role"]

    return responses
