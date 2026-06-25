"""
Email service using Brevo (formerly Sendinblue) API.

Templates live in app/templates/email/. Edit the HTML files there — no Python
changes needed for copy/layout updates.

When BREVO_API_KEY is not set, all emails are logged to the console instead
of being sent. This lets the team develop and test without a live API key.
"""

import logging
import httpx
from pathlib import Path
from app.core.config import settings

# Force a basic logging config so email logs always appear in the terminal.
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

TEMPLATE_DIR = Path(__file__).parent.parent.parent / "templates" / "email"


def _load_template(template_name: str) -> str:
    path = TEMPLATE_DIR / template_name
    if not path.exists():
        raise FileNotFoundError(f"Email template not found: {path}")
    return path.read_text(encoding="utf-8")


def _load_base(subject: str, body_content: str) -> str:
    base = _load_template("base.html")

    if settings.LOGO_URL:
        logo_src = f"{settings.LOGO_URL.rstrip('/')}/Portland-gas-logo.png"
        logo_html = f'<img src="{logo_src}" alt="Portland Gas" class="logo-img" />'
    else:
        logo_html = '<div class="logo-mark"><span>PG</span></div>'

    return (
        base
        .replace("{{subject}}", subject)
        .replace("{{body_content}}", body_content)
        .replace("{{logo_html}}", logo_html)
    )


def _render(template_name: str, variables: dict) -> str:
    body = _load_template(template_name)
    for key, value in variables.items():
        body = body.replace("{{" + key + "}}", str(value))
    subject = variables.get("subject", "Portland Gas Operations")
    return _load_base(subject, body)


def _send(to_email: str, subject: str, html: str) -> None:
    """
    Send an email via Brevo, or log to console if API key not configured.
    Drop your BREVO_API_KEY into .env and this will start sending live emails
    with no other code changes.
    """
    if not settings.BREVO_API_KEY:
        logger.warning("BREVO_API_KEY not set — email not sent. To: %s | Subject: %s", to_email, subject)
        return

    try:
        response = httpx.post(
            "https://api.brevo.com/v3/smtp/email",
            headers={
                "api-key": settings.BREVO_API_KEY,
                "Content-Type": "application/json",
            },
            json={
                "sender": {
                    "name": settings.BREVO_FROM_NAME,
                    "email": settings.BREVO_FROM_EMAIL,
                },
                "to": [{"email": to_email}],
                "subject": subject,
                "htmlContent": html,
            },
            timeout=10,
        )
        if not response.is_success:
            logger.error("Brevo rejected email to %s — %s: %s", to_email, response.status_code, response.text)
            return
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


def send_account_setup(
    to_email: str,
    first_name: str,
    setup_link: str,
    employee_no: str,
) -> None:
    subject = "Set up your Portland Gas account"
    html = _render("account_setup.html", {
        "subject": subject,
        "first_name": first_name,
        "setup_link": setup_link,
        "employee_no": employee_no,
    })
    _send(to_email, subject, html)
