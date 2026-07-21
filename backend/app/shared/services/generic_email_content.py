"""
Generic email content — used as fallback for any request_type not registered
in the content registry.

Each hook receives a `ctx` dict and returns a dict of overrides (any of:
subject, intro_message, action_message, button_label, result_message), or
None to defer to the defaults in workflow_email.py / email_service.
"""


def on_submitted(ctx: dict) -> dict | None:
    return None  # use workflow_email.py defaults


def on_step_assigned(ctx: dict) -> dict | None:
    return None  # use send_approval_required defaults


def on_step_progress(ctx: dict) -> dict | None:
    return None  # use workflow_email.py defaults


def on_approved(ctx: dict) -> dict | None:
    return None


def on_rejected(ctx: dict) -> dict | None:
    return None


def on_returned(ctx: dict) -> dict | None:
    return None
