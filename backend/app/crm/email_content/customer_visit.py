"""
Customer visit email content.

Used when a customer visit is scheduled.
"""

import logging

logger = logging.getLogger(__name__)


def on_scheduled(ctx: dict) -> dict | None:
    visit = ctx["visit"]
    customer = ctx["customer"]
    contact = ctx["contact"]
    requester_name = ctx.get("requester_name", "CRM Team")
    recipient_type = ctx.get("recipient_type", "submitter")

    visit_date = visit.visit_date.strftime("%d %B %Y")
    visit_time = visit.visit_date.strftime("%I:%M %p")

    contact_name = (
        f"{contact.first_name or ''} {contact.last_name or ''}"
    ).strip() or "Customer Contact"

    visit_type = (
        visit.visit_type.value.replace("_", " ").title()
        if hasattr(visit.visit_type, "value")
        else str(visit.visit_type).replace("_", " ").title()
    )

    # ---------------------------------------------------------
    # CUSTOMER VERSION
    # ---------------------------------------------------------
    if recipient_type == "customer":
        return {
            "subject": (
                f"A visit has been scheduled with you for {visit_date}"
            ),
            "greeting": (
                        f"Hi {contact.first_name or 'there'},"
            ),
            "intro_message": (
            f"We are writing to let you know that "
            f"<strong>{requester_name}</strong> "
            f"has scheduled a visit with you for {visit_date}."
            ),

            "result_message": (
                "They look forward to meeting with you."
            ),

            "button_label": "View Visit",
        }
    # ---------------------------------------------------------
    # SUBMITTER VERSION
    # ---------------------------------------------------------
    return {
        "subject": (
            f"Customer Visit Scheduled"
        ),
        "greeting": (
                f"Hi {requester_name},"
            ),
        "intro_message": (
            f"You have scheduled a customer visit with "
            f"<strong>{customer.customer_name}</strong>."
        ),

        "result_message": (
            ""
        ),

        "button_label": "View Visit",
    }