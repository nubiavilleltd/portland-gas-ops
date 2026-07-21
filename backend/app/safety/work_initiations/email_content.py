"""Workflow email content for Safety Work Initiations."""

from app.safety.work_initiations.models import SafetyWorkInitiation


def _get_request(ctx: dict) -> SafetyWorkInitiation | None:
    ar = ctx["ar"]
    return (
        ctx["db"].query(SafetyWorkInitiation)
        .filter(SafetyWorkInitiation.id == ar.request_id)
        .first()
    )


def on_submitted(ctx: dict) -> dict | None:
    request = _get_request(ctx)
    if not request:
        return None
    return {"subject": f"Work Initiation Submitted - {request.reference}"}


def on_step_assigned(ctx: dict) -> dict | None:
    request = _get_request(ctx)
    if not request:
        return None

    step_name = ctx["step"].step_name.lower()
    if "supervisor" in step_name:
        return {
            "intro_message": (
                f"You were selected as the supervisor for {request.reference}: "
                f"{request.title}."
            ),
            "action_message": (
                "Review the work scope, assignment, schedule, and safety details, "
                "then record your supervisor decision."
            ),
            "button_label": "Review Work Initiation",
        }

    if "operation" in step_name:
        return {
            "intro_message": (
                f"Work Initiation {request.reference}: {request.title} is ready "
                "for Operations Manager review."
            ),
            "action_message": (
                "Review the supervisor decision and work details before recording "
                "the operational approval decision."
            ),
            "button_label": "Review Work Initiation",
        }

    return {"button_label": "Review Work Initiation"}


def on_step_progress(ctx: dict) -> dict | None:
    request = _get_request(ctx)
    if not request:
        return None
    return {"subject": f"Work Initiation Update - {request.reference}"}


def on_approved(ctx: dict) -> dict | None:
    request = _get_request(ctx)
    if not request:
        return None
    return {
        "result_message": (
            f"Work Initiation {request.reference}: {request.title} has been fully "
            "approved. You can now raise a Work Authorization request from the "
            "Safety Work Authorization page."
        )
    }


def on_rejected(ctx: dict) -> dict | None:
    request = _get_request(ctx)
    if not request:
        return None
    return {
        "subject": f"Work Initiation Rejected - {request.reference}",
        "result_heading": "Your Work Initiation Has Been Rejected",
        "action_label": "Rejected",
        "result_message": (
            f"Work Initiation {request.reference}: {request.title} has been rejected."
        )
    }


def on_returned(ctx: dict) -> dict | None:
    request = _get_request(ctx)
    if not request:
        return None
    return {
        "result_message": (
            f"Work Initiation {request.reference}: {request.title} has been returned "
            "for correction. Review the comment, update the request, and resubmit it."
        )
    }
