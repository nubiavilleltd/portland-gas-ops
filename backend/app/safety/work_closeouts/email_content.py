"""Workflow email content for Safety Work Completion and Close-Out."""

from app.safety.work_closeouts.models import (
    SafetyWorkCloseOut,
    WorkCloseOutStatus,
)


def _get_request(ctx: dict) -> SafetyWorkCloseOut | None:
    ar = ctx["ar"]
    return (
        ctx["db"].query(SafetyWorkCloseOut)
        .filter(SafetyWorkCloseOut.id == ar.request_id)
        .first()
    )


def _title(request: SafetyWorkCloseOut) -> str:
    authorization = request.work_authorization
    initiation = authorization.work_initiation if authorization else None
    return initiation.title if initiation else "Work Close-Out"


def on_submitted(ctx: dict) -> dict | None:
    request = _get_request(ctx)
    if not request:
        return None
    return {"subject": f"Work Close-Out Submitted - {request.reference}"}


def on_step_assigned(ctx: dict) -> dict | None:
    request = _get_request(ctx)
    if not request:
        return None

    step_name = ctx["step"].step_name.lower()
    if "supervisor" in step_name:
        intro = (
            f"Work Close-Out {request.reference}: {_title(request)} is ready for "
            "your supervisor review."
        )
        action = (
            "Review the completion details, monitoring attestations, area condition, "
            "and supporting evidence before recording your decision."
        )
    elif "operation" in step_name:
        intro = (
            f"Work Close-Out {request.reference}: {_title(request)} is ready for "
            "Operations Manager review."
        )
        action = (
            "Review the completed work and supervisor decision before recording "
            "the operational close-out decision."
        )
    elif "hse" in step_name or "safety" in step_name:
        intro = (
            f"Work Close-Out {request.reference}: {_title(request)} requires final "
            "HSE verification."
        )
        action = (
            "Verify the submitted close-out checks and evidence, then record the "
            "final HSE decision."
        )
    else:
        intro = None
        action = None

    return {
        "intro_message": intro,
        "action_message": action,
        "button_label": "Review Work Close-Out",
    }


def on_step_progress(ctx: dict) -> dict | None:
    request = _get_request(ctx)
    if not request:
        return None
    return {"subject": f"Work Close-Out Update - {request.reference}"}


def on_approved(ctx: dict) -> dict | None:
    request = _get_request(ctx)
    if not request:
        return None

    if request.status == WorkCloseOutStatus.acknowledged:
        message = (
            f"Work Close-Out {request.reference}: {_title(request)} has been "
            "acknowledged as an exception for audit purposes. It was not approved "
            "as a successful close-out."
        )
        return {
            "subject": f"Work Close-Out Acknowledged - {request.reference}",
            "result_heading": "Exception Close-Out Acknowledged",
            "action_label": "Acknowledged",
            "action_color": "#2563eb",
            "result_message": message,
        }
    else:
        message = (
            f"Work Close-Out {request.reference}: {_title(request)} has completed "
            "supervisor, Operations Manager, and HSE review and is now approved."
        )
    return {"result_message": message}


def on_rejected(ctx: dict) -> dict | None:
    request = _get_request(ctx)
    if not request:
        return None
    return {
        "subject": f"Work Close-Out Denied - {request.reference}",
        "result_heading": "Your Work Close-Out Has Been Denied",
        "action_label": "Denied",
        "result_message": (
            f"Work Close-Out {request.reference}: {_title(request)} has been denied."
        )
    }


def on_returned(ctx: dict) -> dict | None:
    request = _get_request(ctx)
    if not request:
        return None
    return {
        "result_message": (
            f"Work Close-Out {request.reference}: {_title(request)} has been returned "
            "for correction. Review the comment, update the close-out, and resubmit it."
        )
    }
