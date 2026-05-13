# TODO: Implement email notifications using a service like SendGrid or SMTP
# This service will send:
# - Approval request notifications to assignees
# - Status update emails to request creators
# - Password reset emails


def send_approval_notification(to_email: str, request_label: str, action_url: str) -> None:
    # TODO: Integrate with email provider (SendGrid recommended)
    pass


def send_status_update(to_email: str, request_label: str, new_status: str) -> None:
    # TODO: Notify submitter when their request status changes
    pass


def send_password_reset(to_email: str, reset_link: str) -> None:
    # TODO: Send password reset link
    pass
