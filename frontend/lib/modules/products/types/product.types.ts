// ============================================================
//  PRODUCT MODULE — CANONICAL TYPE DEFINITIONS
// ============================================================

export interface ProductImage {
  id: string;
  url: string;
  name: string;
}

export type ProductFormImage =
  | { kind: "existing"; image: ProductImage }
  | { kind: "new"; file: File };

// ── Enums ─────────────────────────────────────────────────

export type InventoryTracking = "INDIVIDUAL_ITEMS" | "STOCK_QUANTITY";

export type ProductStatus = "active" | "inactive";

// ── Reference tables (categories and units) ───────────────

export interface ProductCategory {
  id: string;
  name: string;
  parentId?: string;
  isActive: boolean;
}

export interface ProductUnit {
  id: string;
  code: string;
  label: string;
  category?: string;
  isSystem: boolean;
  isActive: boolean;
}

// ── Product ───────────────────────────────────────────────

export interface Product {
  id: string;
  productNo: string;
  name: string;

  // SKU — optional, unique when present
  code?: string;

  // Tag prefix — required for INDIVIDUAL_ITEMS, absent for STOCK_QUANTITY
  tagPrefix?: string;

  description?: string;
  hasInventory:boolean;

  inventoryTracking: InventoryTracking;

  categoryId: string;
  unitId: string;

  defaultUnitPrice: number;
  minimumStock?: number;

  status: ProductStatus;

  images?: ProductImage[];

  createdAt: string;
  updatedAt?: string;
}

// ── Product picker ────────────────────────────────────────

export interface ProductPickerProduct extends Product {
  total: number;
  available: number;
  reserved: number;
  sold: number;
  isOrderable: boolean;
}

// ── Inputs ────────────────────────────────────────────────

export interface CreateProductInput {
  name: string;
  categoryId: string;
  unitId: string;
  inventoryTracking: InventoryTracking;

  defaultUnitPrice: number;
  minimumStock?: number;

  code?: string;
  tagPrefix?: string;

  description?: string;
  status?: ProductStatus;

  images?: ProductImage[];
}

export interface UpdateProductInput {
  name?: string;
  categoryId?: string;
  unitId?: string;
  inventoryTracking?: InventoryTracking;

  defaultUnitPrice?: number;
  minimumStock?: number;

  code?: string;
  tagPrefix?: string;

  description?: string;
  status?: ProductStatus;

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
  primaryImageId?: string;
}

// ── Helper predicates ─────────────────────────────────────

export function isIndividualItems(
  product: Pick<Product, "inventoryTracking">,
): boolean {
  return product.inventoryTracking === "INDIVIDUAL_ITEMS";
}

export function isStockQuantity(
  product: Pick<Product, "inventoryTracking">,
): boolean {
  return product.inventoryTracking === "STOCK_QUANTITY";
}