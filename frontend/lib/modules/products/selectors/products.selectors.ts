// import { products } from "../mock/products.mock";
// import type { Product } from "../types/product.types";

// /** Only active products — use this for order line item dropdowns */
// export function getActiveProducts(): Product[] {
//   return products.filter((p) => p.status === "active");
// }

// export function getProductById(id: string): Product | undefined {
//   return products.find((p) => p.id === id);
// }

// /**
//  * Options formatted for FormSelect / DynamicLineItems dropdowns.
//  * Only returns active products.
//  */
// export function getProductSelectOptions(): Array<{ value: string; label: string }> {
//   return getActiveProducts().map((p) => ({
//     value: p.id,
//     label: p.name,
//   }));
// }





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

export function getProductSelectOptions(
  products: Product[]
): Array<{ value: string; label: string }> {
  return getActiveProducts(products).map((p) => ({
    value: p.id,
    label: p.name,
  }));
}