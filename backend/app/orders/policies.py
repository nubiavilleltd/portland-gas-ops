from app.authorization import policies as auth


def can_manage_orders(user):
    return auth.is_admin(user)


def can_submit_orders(user):
    return auth.is_admin(user)


def can_create_orders(user):
    return True


def can_cancel_orders(user):
    return auth.is_admin(user)


def can_assign_trip(user):
    return auth.is_admin(user)


def can_confirm_delivery(user):
    return auth.is_admin(user)


def can_update_fulfillment(user):
    return auth.is_admin(user)


def can_assign_invoice(user):
    return auth.is_admin(user)

def is_order_owner(user, order):
    return order.created_by == user.id
