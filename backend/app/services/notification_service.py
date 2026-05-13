# TODO: Implement in-app notification system
# Notifications should be stored in a notifications table
# and surfaced via a /api/notifications endpoint (SSE or polling)


def create_notification(user_id: str, message: str, link: str = None) -> None:
    # TODO: Insert into notifications table
    pass


def mark_as_read(notification_id: str, user_id: str) -> None:
    # TODO: Mark notification as read
    pass
