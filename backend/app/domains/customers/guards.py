from app.domains.customers.model import Customer
from app.domains.customers.enums import CustomerStatus


def can_deactivate(customer: Customer) -> bool:
    return customer.status == CustomerStatus.active


def can_activate(customer: Customer) -> bool:  # was: can_reactivate
    return customer.status in (CustomerStatus.inactive, CustomerStatus.suspended)

def can_delete(customer: Customer) -> bool:
    """
    Customers with any linked orders can never be deleted — only deactivated.
    The actual order check happens in the service (requires DB query).
    This guard covers status-only cases.
    """
    return customer.status == CustomerStatus.inactive