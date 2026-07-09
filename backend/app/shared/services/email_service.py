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


# ── Workflow notification emails ───────────────────────────────────────────────

_REQUEST_TYPE_LABELS: dict[str, str] = {
    "procurement":      "Procurement",
    "asset":            "Asset",
    "leave":            "Leave",
    "cash_requisition": "Cash Requisition",
    "invoice":          "Invoice",
    "work_initiation":  "Work Initiation",
    "work_authorization": "Work Authorization",
    "work_closeout":    "Work Closeout",
    "safety":           "Safety",
}

# Maps request_type → frontend URL path segment
_REQUEST_TYPE_PATHS: dict[str, str] = {
    "procurement":      "procurement",
    "asset":            "assets",
    "leave":            "leave",
    "cash_requisition": "cash-requisitions",
    "invoice":          "invoices",
    "work_initiation":  "safety/work-initiation",
    "work_authorization": "safety/work-authorization",
    "work_closeout":    "safety/work-close-out",
    "safety":           "safety",
}


def get_request_type_label(request_type: str) -> str:
    return _REQUEST_TYPE_LABELS.get(request_type, request_type.replace("_", " ").title())


def get_request_url(request_type: str, request_id: str) -> str:
    """Build the deep-link URL for a request's detail page."""
    path = _REQUEST_TYPE_PATHS.get(request_type, request_type)
    base = settings.FRONTEND_URL.rstrip("/")
    return f"{base}/{path}/{request_id}"


def send_approval_required(
    to_email: str,
    approver_name: str,
    requester_name: str,
    request_type_label: str,
    request_title: str,
    step_name: str,
    action_url: str,
) -> None:
    """Notify an approver that a step is waiting for their action."""
    subject = f"Action Required: {request_type_label} request awaiting your approval"
    html = _render("approval_required.html", {
        "subject":            subject,
        "approver_name":      approver_name,
        "requester_name":     requester_name,
        "request_type_label": request_type_label,
        "request_title":      request_title,
        "step_name":          step_name,
        "action_url":         action_url,
    })
    _send(to_email, subject, html)


def send_approval_result(
    to_email: str,
    requester_name: str,
    request_type_label: str,
    request_title: str,
    action: str,  # "approved" | "rejected" | "returned"
    comment: str | None,
    action_url: str,
) -> None:
    """Notify the requester of the outcome of their request."""
    _ACTION_META = {
        "approved": {
            "label":   "Approved",
            "color":   "#16a34a",
            "heading": "Your Request Has Been Approved",
            "message": "Your request has been fully approved. You can view the details by clicking the button below.",
        },
        "rejected": {
            "label":   "Rejected",
            "color":   "#dc2626",
            "heading": "Your Request Has Been Rejected",
            "message": "Unfortunately your request has been rejected. Please contact your manager if you have questions.",
        },
        "returned": {
            "label":   "Returned for Revision",
            "color":   "#d97706",
            "heading": "Your Request Needs Revision",
            "message": "Your request has been returned for revision. Please review the comment below, make the necessary changes, and resubmit.",
        },
    }
    meta = _ACTION_META.get(action, {
        "label":   action.title(),
        "color":   "#6b7280",
        "heading": f"Request {action.title()}",
        "message": "",
    })

    # Build optional comment row
    if comment:
        comment_row_html = (
            f'<tr style="background:#f9fafb;">'
            f'<td style="padding:10px 14px; font-size:13px; color:#6b7280; font-weight:600;">Comment</td>'
            f'<td style="padding:10px 14px; font-size:13px; color:#111118;">{comment}</td>'
            f'</tr>'
        )
        comment_row_style = "border-bottom:1px solid #e5e7eb;"
    else:
        comment_row_html = ""
        comment_row_style = ""

    subject = f"{request_type_label} Request {meta['label']}"
    html = _render("approval_result.html", {
        "subject":            subject,
        "requester_name":     requester_name,
        "request_type_label": request_type_label,
        "request_title":      request_title,
        "action_label":       meta["label"],
        "action_color":       meta["color"],
        "result_heading":     meta["heading"],
        "result_message":     meta["message"],
        "comment_row_html":   comment_row_html,
        "comment_row_style":  comment_row_style,
        "action_url":         action_url,
    })
    _send(to_email, subject, html)
