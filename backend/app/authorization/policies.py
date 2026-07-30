from __future__ import annotations

from app.authorization.constants import ADMIN_ROLES
from app.shared.models.user import User


# --------------------------------------------------------------------------
# Facts
# --------------------------------------------------------------------------

def role(
    user: User,
) -> str:
    return user.role.value


def is_admin(
    user: User,
) -> bool:
    return role(user) in ADMIN_ROLES


# --------------------------------------------------------------------------
# Trips
# --------------------------------------------------------------------------

def can_manage_trips(
    user: User,
) -> bool:
    return is_admin(user)


def can_dispatch_trip(
    user: User,
) -> bool:
    return is_admin(user)


def can_start_any_trip(
    user: User,
) -> bool:
    return is_admin(user)


def can_complete_trip(
    user: User,
) -> bool:
    return is_admin(user)


# --------------------------------------------------------------------------
# Inventory
# --------------------------------------------------------------------------

def can_manage_inventory(
    user: User,
) -> bool:
    return is_admin(user)


def can_assign_inventory(
    user: User,
) -> bool:
    return is_admin(user)


# --------------------------------------------------------------------------
# Customers
# --------------------------------------------------------------------------

def can_manage_customers(
    user: User,
) -> bool:
    return is_admin(user)


# --------------------------------------------------------------------------
# Invoices
# --------------------------------------------------------------------------

def can_manage_invoices(
    user: User,
) -> bool:
    return is_admin(user)


# --------------------------------------------------------------------------
# Payments
# --------------------------------------------------------------------------

def can_record_payments(
    user: User,
) -> bool:
    return is_admin(user)


def can_view_payments(
    user: User,
) -> bool:
    return is_admin(user)