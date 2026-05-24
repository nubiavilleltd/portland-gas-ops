// // ============================================================
// //  PRODUCTS MODULE — TYPE DEFINITIONS
// //  Products are the sellable items (gas types, services) that
// //  appear on order line items. Managed by admins, selected
// //  by users on the order creation page.
// // ============================================================

// /**
//  * Unit of measurement for a product.
//  * Extend this union as new product types are introduced.
//  */
// export type ProductUnit =
//   | "kg"       // Kilograms      — gas by weight (CNG, LNG, LPG)
//   | "litre"    // Litres         — liquid products
//   | "m3"       // Cubic metres   — volumetric gas
//   | "unit"     // Discrete count — items, cylinders, etc.
//   | "tonne"    // Metric tonnes  — bulk solids
//   | "custom";  // Custom         — see unit_label

// export type ProductStatus = "active" | "inactive";

// export interface Product {
//   id: string;
//   name: string;
//   unit: ProductUnit;
//   /** Only used when unit === "custom" — the text shown in the UI */
//   unit_label?: string;
//   /** Suggested default price in NGN; can be overridden per order line */
//   default_unit_price: number;
//   description?: string;
//   status: ProductStatus;
//   created_at: string;
// }

// // ── INPUT TYPES ────────────────────────────────────────────
// export interface CreateProductInput {
//   name: string;
//   unit: ProductUnit;
//   unit_label?: string;
//   default_unit_price: number;
//   description?: string;
// }

// export interface UpdateProductInput extends Partial<CreateProductInput> {
//   status?: ProductStatus;
// }

// // ── DISPLAY HELPERS ───────────────────────────────────────
// export const UNIT_LABELS: Record<ProductUnit, string> = {
//   kg:     "kg",
//   litre:  "L",
//   m3:     "m³",
//   unit:   "unit",
//   tonne:  "t",
//   custom: "",
// };

// export function getUnitLabel(
//   product: Pick<Product, "unit" | "unit_label">
// ): string {
//   if (product.unit === "custom") return product.unit_label ?? "";
//   return UNIT_LABELS[product.unit];
// }







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

  created_at: string;

  updated_at?: string;
}



export interface CreateProductInput {
  name: string;
  unit: ProductUnit;
  default_unit_price: number;  // always number here — no form concerns
  description?: string;
  status?: ProductStatus;
}

export interface UpdateProductInput {
  name?: string;
  unit?: ProductUnit;
  default_unit_price?: number;
  description?: string;
  status?: ProductStatus;
}