"""
Email service using Resend SDK.

Templates live in app/templates/email/. Edit the HTML files there — no Python
changes needed for copy/layout updates.

When RESEND_API_KEY is not set, all emails are logged to the console instead
of being sent. This lets the team develop and test without a live API key.
"""

import os
import logging
from pathlib import Path
from app.config import settings

logger = logging.getLogger(__name__)

TEMPLATE_DIR = Path(__file__).parent.parent / "templates" / "email"


def _load_template(template_name: str) -> str:
    """Read a body template file and return its contents."""
    path = TEMPLATE_DIR / template_name
    if not path.exists():
        raise FileNotFoundError(f"Email template not found: {path}")
    return path.read_text(encoding="utf-8")


def _load_base(subject: str, body_content: str) -> str:
    """Inject body content into the base layout."""
    base = _load_template("base.html")
    return base.replace("{{subject}}", subject).replace("{{body_content}}", body_content)


def _render(template_name: str, variables: dict) -> str:
    """Load a body template, substitute variables, then wrap in base layout."""
    body = _load_template(template_name)
    for key, value in variables.items():
        body = body.replace("{{" + key + "}}", str(value))
    subject = variables.get("subject", "Portland Gas Operations")
    return _load_base(subject, body)


def _send(to_email: str, subject: str, html: str) -> None:
    """
    Send an email via Resend, or log to console if API key not configured.
    Drop your RESEND_API_KEY into .env and this will start sending live emails
    with no other code changes.
    """
    if not settings.RESEND_API_KEY:
        logger.warning(
            "RESEND_API_KEY not set — email not sent. Would have sent to: %s | Subject: %s",
            to_email,
            subject,
        )
        return

    import resend
    resend.api_key = settings.RESEND_API_KEY

    try:
        resend.Emails.send({
            "from": f"{settings.RESEND_FROM_NAME} <{settings.RESEND_FROM_EMAIL}>",
            "to": [to_email],
            "subject": subject,
            "html": html,
        })
        logger.info("Email sent to %s — subject: %s", to_email, subject)
    except Exception as exc:
        logger.error("Failed to send email to %s: %s", to_email, exc)
        # Don't raise — email failure should not crash the API response


def send_otp_verification(to_email: str, name: str, otp_code: str) -> None:
    subject = "Your Portland Gas verification code"
    html = _render("otp_verification.html", {
        "subject": subject,
        "name": name,
        "otp_code": otp_code,
        "expire_minutes": str(settings.OTP_EXPIRE_MINUTES),
    })
    _send(to_email, subject, html)


def send_forgot_password(to_email: str, name: str, reset_link: str) -> None:
    subject = "Reset your Portland Gas password"
    html = _render("forgot_password.html", {
        "subject": subject,
        "name": name,
        "reset_link": reset_link,
        "expire_minutes": "30",
    })
    _send(to_email, subject, html)


def send_welcome(to_email: str, name: str, login_url: str) -> None:
    subject = "Welcome to Portland Gas Operations"
    html = _render("welcome.html", {
        "subject": subject,
        "name": name,
        "login_url": login_url,
    })
    _send(to_email, subject, html)
