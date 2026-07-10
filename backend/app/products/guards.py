# from app.products.model import Product
# from app.products.enums import ProductStatus


# def can_deactivate(product: Product) -> bool:
#     return product.status == ProductStatus.active


# def can_activate(product: Product) -> bool:
#     return product.status == ProductStatus.inactive


from app.products.enums import ProductStatus
from app.products.model import Product


def can_deactivate(product: Product) -> bool:
    """
    Only active products can be deactivated.
    """
    return product.status == ProductStatus.active


def can_activate(product: Product) -> bool:
    """
    Only inactive products can be reactivated.
    """
    return product.status == ProductStatus.inactive


def can_delete(product: Product) -> bool:
    """
    Products should generally never be deleted once created.

    Historical orders, invoices, inventory movements and other records
    may reference a product. Products should instead be deactivated.

    If a future requirement allows deletion of unused products, the
    service layer should perform the database relationship checks.
    """
    return False