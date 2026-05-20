import { products } from "../mock/products.mock";
import type { Product } from "../types/product.types";

/** All products regardless of status */
export function getAllProducts(): Product[] {
  return products;
}

/** Only active products — use this for order line item dropdowns */
export function getActiveProducts(): Product[] {
  return products.filter((p) => p.status === "active");
}

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

/**
 * Options formatted for FormSelect / DynamicLineItems dropdowns.
 * Only returns active products.
 */
export function getProductSelectOptions(): Array<{ value: string; label: string }> {
  return getActiveProducts().map((p) => ({
    value: p.id,
    label: p.name,
  }));
}