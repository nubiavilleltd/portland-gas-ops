"""Workflow email content for Safety Work Authorizations."""

from app.safety.work_authorizations.models import SafetyWorkAuthorization


def _get_request(ctx: dict) -> SafetyWorkAuthorization | None:
    ar = ctx["ar"]
    return (
        ctx["db"].query(SafetyWorkAuthorization)
        .filter(SafetyWorkAuthorization.id == ar.request_id)
        .first()
    )


def _title(request: SafetyWorkAuthorization) -> str:
    initiation = request.work_initiation
    return initiation.title if initiation else "Work Authorization"


def on_submitted(ctx: dict) -> dict | None:
    request = _get_request(ctx)
    if not request:
        return None
    return {"subject": f"Work Authorization Submitted - {request.reference}"}


def on_step_assigned(ctx: dict) -> dict | None:
    request = _get_request(ctx)
    if not request:
        return None
    return {
        "intro_message": (
            f"Work Authorization {request.reference}: {_title(request)} requires "
            "your HSE inspection and authorization decision."
        ),
        "action_message": (
            "Review the approved Work Initiation, complete every required HSE "
            "inspection check, and record your decision."
        ),
        "button_label": "Inspect Work Authorization",
    }


def on_step_progress(ctx: dict) -> dict | None:
    request = _get_request(ctx)
    if not request:
        return None
    return {"subject": f"Work Authorization Update - {request.reference}"}


def on_approved(ctx: dict) -> dict | None:
    request = _get_request(ctx)
    if not request:
        return None
    return {
        "result_message": (
            f"Work Authorization {request.reference}: {_title(request)} has been "
            "approved by HSE. Once the authorized work has been completed and "
            "inspected, raise a Work Completion and Close-Out request."
        )
    }


def on_rejected(ctx: dict) -> dict | None:
    request = _get_request(ctx)
    if not request:
        return None
    return {
        "subject": f"Work Authorization Denied - {request.reference}",
        "result_heading": "Your Work Authorization Has Been Denied",
        "action_label": "Denied",
        "result_message": (
            f"Work Authorization {request.reference}: {_title(request)} has been denied."
        )
    }


def on_returned(ctx: dict) -> dict | None:
    request = _get_request(ctx)
    if not request:
        return None
    return {
        "result_message": (
            f"Work Authorization {request.reference}: {_title(request)} has been "
            "returned for correction. Review the HSE comment, update the request, "
            "and resubmit it."
        )
    }
