export interface ProductImage {
  id: string;
  // NOTE: object URL in POC — valid for this session only.
  // Replace with Cloudinary URL in production.
  url: string;
  name: string;
}

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
  productNo: string;
  description?: string;
  defaultUnitPrice: number;
  unit: ProductUnit;
  unitLabel?: string;
  status: ProductStatus;
  productType: ProductType;
  minimumStock?: number;
  images?: ProductImage[];
  createdAt: string;
  updatedAt?: string;
}



export interface CreateProductInput {
  name: string;
  unit: ProductUnit;
  defaultUnitPrice: number;  // always number here — no form concerns
  productType: ProductType;
  description?: string;
  code?: string;
  status?: ProductStatus;
  minimumStock?: number;
  images?: ProductImage[];
}

export interface UpdateProductInput {
  name?: string;
  unit?: ProductUnit;
  defaultUnitPrice?: number;
  productType?: ProductType;
  description?: string;
  code?: string;
  status?: ProductStatus;
  minimumStock?: number;
  images?: ProductImage[];
}

export interface CreateProductPayload {
  product: CreateProductInput;
  imageFiles: File[];
}

export interface UpdateProductPayload {
  product: UpdateProductInput;
  newImageFiles: File[];
  keptImageIds: string[];
}

export const UNIT_LABELS: Record<ProductUnit, string> = {
  kg:     "kg",
  litre:  "L",
  m3:     "m³",
  unit:   "unit",
  tonne:  "t",
};

export function getUnitLabel(
  product: Pick<Product, "unit" | "unitLabel">
): string {
  return product.unitLabel ?? UNIT_LABELS[product.unit];
}


// export function getUnitLabel(
//   product: Pick<Product, "unit" | "unit_label">
// ): string {
//   return UNIT_LABELS[product.unit];
// }

export function isTracked(product: Pick<Product, "productType">): boolean {
  return product.productType === "tracked";
}

export function isConsumable(product: Pick<Product, "productType">): boolean {
  return product.productType === "consumable";
}