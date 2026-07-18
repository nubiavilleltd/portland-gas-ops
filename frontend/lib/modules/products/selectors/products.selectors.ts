// ============================================================
//  PRODUCTS SELECTORS
//  Pure functions. No imports from mock files. No side effects.
//
//  TODAY:   called with data fetched by useProducts() hook
//  FUTURE:  called via select: in useQuery — nothing changes here
// ============================================================

import type { Product } from "@/lib/modules/products/types/product.types";


export function getProductById(
  products: Product[],
  id: string
): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getActiveProducts(products: Product[]): Product[] {
  return products.filter((p) => p.status === "active");
}



export function getStockStatus(product: Product, quantity: number) {
  return product?.minimumStock != null &&
    quantity <= product?.minimumStock;
}