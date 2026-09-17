/**
 * Product Adapter
 *
 * Translates between backend API shapes (snake_case)
 * and frontend domain models (camelCase).
 *
 * This is the ONLY place that knows both languages.
 */

import type {
  CreateProductInput,
  InventoryTracking,
  Product,
  ProductCategory,
  ProductImage,
  ProductPickerProduct,
  ProductStatus,
  ProductUnit,
  UpdateProductInput,
} from "../types/product.types";

// ─────────────────────────────────────────────────────────────
// Backend response shapes
// ─────────────────────────────────────────────────────────────

interface BackendProductImage {
  id: string | number;
  url: string;
  name: string;
}

interface BackendProduct {
  id: string;
  product_no: string;

  name: string;
  code: string | null;
  tag_prefix: string | null;
  description: string | null;
  has_inventory:boolean

  inventory_tracking: string;

  category_id: string;
  unit_id: string;

  default_unit_price: string | number;
  minimum_stock: string | number | null;

  status: string;

  images: BackendProductImage[];

  created_at: string;
  updated_at: string;
}

interface BackendProductPicker extends BackendProduct {
  total: string | number;
  available: string | number;
  reserved: string | number;
  sold: string | number;
  is_orderable: boolean;
}

interface BackendProductList {
  items: BackendProduct[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

interface BackendProductCategory {
  id: string;
  name: string;
  parent_id: string | null;
  is_active: boolean;
}

interface BackendProductUnit {
  id: string;
  code: string;
  label: string;
  category: string | null;
  is_system: boolean;
  is_active: boolean;
}

// ─────────────────────────────────────────────────────────────
// Backend request shapes
// ─────────────────────────────────────────────────────────────

export interface BackendCreateProductInput {
  name: string;
  category_id: string;
  unit_id: string;
  inventory_tracking: InventoryTracking;

  default_unit_price: number;
  minimum_stock?: number;

  code?: string;
  tag_prefix?: string;

  description?: string;
}

export interface BackendUpdateProductInput {
  name?: string;
  category_id?: string;
  unit_id?: string;
  inventory_tracking?: InventoryTracking;

  default_unit_price?: number;
  minimum_stock?: number;

  code?: string;
  tag_prefix?: string;

  description?: string;
  status?: ProductStatus;
}

// ─────────────────────────────────────────────────────────────
// Enum mapping
// ─────────────────────────────────────────────────────────────

function mapInventoryTracking(value: string): InventoryTracking {
  return value === "INDIVIDUAL_ITEMS"
    ? "INDIVIDUAL_ITEMS"
    : "STOCK_QUANTITY";
}

function mapProductStatus(value: string): ProductStatus {
  return value === "inactive" ? "inactive" : "active";
}

// ─────────────────────────────────────────────────────────────
// Image mapping
// ─────────────────────────────────────────────────────────────

function mapImage(raw: BackendProductImage): ProductImage {
  return {
    id: String(raw.id),
    url: raw.url,
    name: raw.name,
  };
}

// ─────────────────────────────────────────────────────────────
// Reference table mapping
// ─────────────────────────────────────────────────────────────

export function adaptProductCategory(
  raw: BackendProductCategory,
): ProductCategory {
  return {
    id: raw.id,
    name: raw.name,
    parentId: raw.parent_id ?? undefined,
    isActive: raw.is_active,
  };
}

export function adaptProductUnit(
  raw: BackendProductUnit,
): ProductUnit {
  return {
    id: raw.id,
    code: raw.code,
    label: raw.label,
    category: raw.category ?? undefined,
    isSystem: raw.is_system,
    isActive: raw.is_active,
  };
}

// ─────────────────────────────────────────────────────────────
// Backend → Frontend
// ─────────────────────────────────────────────────────────────

export function adaptProduct(raw: BackendProduct): Product {
  return {
    id: raw.id,
    productNo: raw.product_no,
    name: raw.name,

    code: raw.code ?? undefined,
    tagPrefix: raw.tag_prefix ?? undefined,

    description: raw.description ?? undefined,

    inventoryTracking: mapInventoryTracking(raw.inventory_tracking),
    hasInventory:raw.has_inventory,

    categoryId: raw.category_id,
    unitId: raw.unit_id,

    defaultUnitPrice: Number(raw.default_unit_price),

    minimumStock:
      raw.minimum_stock != null ? Number(raw.minimum_stock) : undefined,

    status: mapProductStatus(raw.status),

    images: (raw.images ?? []).map(mapImage),

    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export function adaptProductList(raw: BackendProductList): Product[] {
  return raw.items.map(adaptProduct);
}

export function adaptProductPicker(
  raw: BackendProductPicker,
): ProductPickerProduct {
  return {
    ...adaptProduct(raw),
    total: Number(raw.total),
    available: Number(raw.available),
    reserved: Number(raw.reserved),
    sold: Number(raw.sold),
    isOrderable: raw.is_orderable,
  };
}

export function adaptProductPickerList(raw: {
  items: BackendProductPicker[];
}): ProductPickerProduct[] {
  return raw.items.map(adaptProductPicker);
}

// ─────────────────────────────────────────────────────────────
// Frontend → Backend
// ─────────────────────────────────────────────────────────────

export function adaptCreateProductInput(
  input: CreateProductInput,
): BackendCreateProductInput {
  return {
    name: input.name,
    category_id: input.categoryId,
    unit_id: input.unitId,
    inventory_tracking: input.inventoryTracking,
    default_unit_price: input.defaultUnitPrice,
    minimum_stock: input.minimumStock,
    code: input.code,
    tag_prefix: input.tagPrefix,
    description: input.description,
  };
}

export function adaptUpdateProductInput(
  input: UpdateProductInput,
): BackendUpdateProductInput {
  return {
    name: input.name,
    category_id: input.categoryId,
    unit_id: input.unitId,
    inventory_tracking: input.inventoryTracking,
    default_unit_price: input.defaultUnitPrice,
    minimum_stock: input.minimumStock,
    code: input.code,
    tag_prefix: input.tagPrefix,
    description: input.description,
    status: input.status,
  };
}