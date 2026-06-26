from app.products.model import Product
from app.products.enums import ProductStatus


def can_deactivate(product: Product) -> bool:
    return product.status == ProductStatus.active


def can_activate(product: Product) -> bool:
    return product.status == ProductStatus.inactive