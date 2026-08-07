// // ============================================================
// //  PRODUCTS SELECTORS
// //  Pure functions. No imports from mock files. No side effects.
// //
// //  TODAY:   called with data fetched by useProducts() hook
// //  FUTURE:  called via select: in useQuery — nothing changes here
// // ============================================================

// import type { Product } from "@/lib/modules/products/types/product.types";


// export function getProductById(
//   products: Product[],
//   id: string
// ): Product | undefined {
//   return products.find((p) => p.id === id);
// }

// export function getActiveProducts(products: Product[]): Product[] {
//   return products.filter((p) => p.status === "active");
// }


// export function getProductSelection(products: Product[]):{value:string; label:string}[] {
//   return (
//     products.map((product) => ({
//       value: product.id,
//       label: `${product.productNo} • ${product.name}`,
//     })))
// }




// export function getStockStatus(product: Product, quantity: number) {
//   return product?.minimumStock != null &&
//     quantity <= product?.minimumStock;
// }





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
    product.minimumStock != null &&
    quantity <= product.minimumStock
  );
}


export function getAvailableQuantity(
  product?: Pick<ProductPickerProduct, "availableQuantity">,
): number {
  return product?.availableQuantity ?? 0;
}