"""
Customer Visit Reminder Emails

Sends reminder emails to the employee who created the visit.

Flow:

CustomerVisit
    -> creator (Employee)
        -> user (User)
            -> email

The reminder runs once every day at the configured scheduler time
and sends reminders for visits whose reminder_date is today.

Emails are sent ONLY through the existing:
    app.shared.services.email_service

No SMTP is used.
No email is sent from the frontend.
"""

from __future__ import annotations

import logging
from datetime import datetime, date, time

from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.crm.model import CustomerVisit, VisitStatus
from app.shared.services import email_service


logger = logging.getLogger(__name__)


# ============================================================
# EMAIL
# ============================================================

def send_customer_visit_reminder(
    *,
    db: Session,
    visit: CustomerVisit,
) -> None:
    """
    Send one reminder email for a customer visit.

    Recipient:
        visit.creator.user.email
    """

    try:
        if not visit.creator:
            logger.warning(
                "Visit reminder skipped: visit %s has no creator.",
                visit.id,
            )
            return

        if not visit.creator.user:
            logger.warning(
                "Visit reminder skipped: visit %s creator has no user.",
                visit.id,
            )
            return

        recipient_email = visit.creator.user.email

        if not recipient_email:
            logger.warning(
                "Visit reminder skipped: visit %s creator has no email.",
                visit.id,
            )
            return

        if not visit.visit_date:
            logger.warning(
                "Visit reminder skipped: visit %s has no visit date.",
                visit.id,
            )
            return

        creator_name = visit.creator.user.full_name or "there"

        action_url = (
            f"{settings.FRONTEND_URL}/crm/visits/{visit.id}"
        )

        variables = {
            "creator_name": creator_name,
            "visit_number": visit.visit_number,
            "visit_date": visit.visit_date.strftime(
                "%d %b %Y"
            ),
            "visit_time": visit.visit_date.strftime(
                "%I:%M %p"
            ),
            "visit_type": visit.visit_type,
            "location": visit.location,
            "purpose": visit.purpose,
            "action_url": action_url,
        }

        email_service.send_template_email(
            to_email=recipient_email,
            subject=(
                f"Customer Visit Reminder — "
                f"{visit.visit_number}"
            ),
            template_name="crm/visit_reminder.html",
            variables=variables,
        )

        logger.info(
            "Customer visit reminder sent: "
            "visit=%s recipient=%s",
            visit.id,
            recipient_email,
        )

    except Exception:
        # Email failures must not break the application request.
        logger.exception(
            "Failed to send customer visit reminder "
            "for visit %s.",
            getattr(visit, "id", "unknown"),
        )


# ============================================================
# DAILY REMINDER JOB
# ============================================================

def send_daily_customer_visit_reminders(
    db: Session,
) -> None:
    """
    Find today's reminder records and send their emails.

    A visit is eligible when:

        reminder_date is today
        AND
        status is Scheduled

    The creator receives the email.
    """

    today = date.today()

    start_of_day = datetime.combine(
        today,
        time.min,
    )

    start_of_next_day = datetime.combine(
        today,
        time.max,
    )

    visits = (
        db.query(CustomerVisit)
        .options(
            joinedload(CustomerVisit.creator)
            .joinedload("user")
        )
        .filter(
            CustomerVisit.reminder_date >= start_of_day,
            CustomerVisit.reminder_date <= start_of_next_day,
            CustomerVisit.status == VisitStatus.Scheduled,
        )
        .all()
    )

    logger.info(
        "Customer visit reminder job found %s visit(s) "
        "for %s.",
        len(visits),
        today,
    )

    for visit in visits:
        send_customer_visit_reminder(
            db=db,
            visit=visit,
        )