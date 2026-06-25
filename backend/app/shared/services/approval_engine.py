from sqlalchemy.orm import Session
from app.shared.models.approval import ApprovalRequest, ApprovalStep, StepAssignee, ApprovalHistory, ApprovalStatus
from app.shared.models.user import User

# TODO: Implement full multi-step approval engine
# This service will handle:
# - Advancing to next step after all required assignees decide
# - Group approval rules (any_one vs all_must)
# - Notifying next assignees when a step is activated
# - Auto-completing requests when final step is approved
# - Rolling back to previous step on "return" action


def get_pending_for_user(user: User, db: Session) -> list:
    # TODO: Join approval_requests -> approval_steps -> step_assignees
    # where step_assignees.user_id == user.id and decision == "pending"
    # and approval_requests.status == "in_progress"
    return []


def approve_step(request_id: str, actor: User, comment: str, db: Session) -> dict:
    # TODO: Find active step for this request, record actor decision as "approved",
    # check if step completion conditions are met, advance to next step or complete request
    return {"message": "Approval recorded (stub)", "request_id": request_id}


def reject_request(request_id: str, actor: User, comment: str, db: Session) -> dict:
    # TODO: Mark the request as "rejected", record history, notify submitter
    return {"message": "Rejection recorded (stub)", "request_id": request_id}


def return_request(request_id: str, actor: User, comment: str, db: Session) -> dict:
    # TODO: Mark the request as "returned", reset to submitter for correction
    return {"message": "Return recorded (stub)", "request_id": request_id}
