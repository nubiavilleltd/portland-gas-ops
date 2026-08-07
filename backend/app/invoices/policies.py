from app.authorization import policies as auth

def can_manage_invoices(user):
    return auth.is_admin(user)

def is_invoice_owner(user, invoice):
    return invoice.created_by == user.id
