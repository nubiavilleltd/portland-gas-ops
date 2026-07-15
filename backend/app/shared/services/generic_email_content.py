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
    ar = ctx["ar"]
    step = ctx["step"]
    request_title = ctx["request_title"]
    # Preserve existing work_initiation special copy:
    if ar.request_type == "work_initiation" and (
        step.step_number == 1 or "supervisor" in step.step_name.lower()
    ):
        return {
            "intro_message": (
                f"You were selected as the supervisor for {request_title} Work Initiation."
            ),
            "action_message": (
                "Click the button above to view the work details and take the "
                "necessary supervisor action."
            ),
            "button_label": "View Details & Take Action",
        }
    return None  # use send_approval_required defaults


def on_step_progress(ctx: dict) -> dict | None:
    return None  # use workflow_email.py defaults


def on_approved(ctx: dict) -> dict | None:
    ar = ctx["ar"]
    if ar.request_type == "work_initiation":
        return {
            "result_message": (
                "Your Work Initiation has been fully approved. You can now raise "
                "a Work Authorization request from the Safety Work Authorization page."
            )
        }
    if ar.request_type == "work_authorization":
        return {
            "result_message": (
                "Your Work Authorization has been fully approved. Once the work "
                "has been inspected and completed, you can raise a Work Completion "
                "and Close-Out request from the Safety Work Completion page."
            )
        }
    return None


def on_rejected(ctx: dict) -> dict | None:
    return None


def on_returned(ctx: dict) -> dict | None:
    return None
