export type ProductType = "consumable" | "tracked";

export type ProductStatus =
  | "active"
  | "inactive";

export type ProductUnit =
  | "kg"
  | "litre"
  | "m3"
  | "tonne"
  | "unit";

export interface Product {
  id: string;
  name: string;
  code?: string;
  description?: string;
  default_unit_price: number;
  unit: ProductUnit;
  unit_label?: string;
  status: ProductStatus;
  product_type: ProductType;
  minimum_stock?: number;
  created_at: string;
  updated_at?: string;
}



export interface CreateProductInput {
  name: string;
  unit: ProductUnit;
  default_unit_price: number;  // always number here — no form concerns
  product_type: ProductType;
  description?: string;
  code?: string;
  status?: ProductStatus;
  minimum_stock?: number;
}

export interface UpdateProductInput {
  name?: string;
  unit?: ProductUnit;
  default_unit_price?: number;
  product_type?: ProductType;
  description?: string;
  code?: string;
  status?: ProductStatus;
  minimum_stock?: number;
}

export const UNIT_LABELS: Record<ProductUnit, string> = {
  kg:     "kg",
  litre:  "L",
  m3:     "m³",
  unit:   "unit",
  tonne:  "t",
};

export function getUnitLabel(
  product: Pick<Product, "unit" | "unit_label">
): string {
  return product.unit_label ?? UNIT_LABELS[product.unit];
}


// export function getUnitLabel(
//   product: Pick<Product, "unit" | "unit_label">
// ): string {
//   return UNIT_LABELS[product.unit];
// }

export function isTracked(product: Pick<Product, "product_type">): boolean {
  return product.product_type === "tracked";
}

export function isConsumable(product: Pick<Product, "product_type">): boolean {
  return product.product_type === "consumable";
}