import type {
  Product,
  ProductPickerProduct,
} from "@/lib/modules/products/types/product.types";

type ProductLike = Product | ProductPickerProduct;

export function getProductById<T extends ProductLike>(
  products: readonly T[],
  id: string,
): T | undefined {
  return products.find((p) => p.id === id);
}

export function getActiveProducts<T extends ProductLike>(
  products: readonly T[],
): T[] {
  return products.filter((p) => p.status === "active");
}

export function getProductSelection(
  products: readonly ProductLike[],
): { value: string; label: string }[] {
  return products.map((product) => ({
    value: product.id,
    label: `${product.productNo} • ${product.name}`,
  }));
}

export function getStockStatus(
  product: Pick<Product, "minimumStock">,
  quantity: number,
): boolean {
  return (
    product.minimumStock != null && quantity <= product.minimumStock
  );
}

export function getAvailableQuantity(
  product?: Pick<ProductPickerProduct, "available">,
): number {
  return product?.available ?? 0;
}