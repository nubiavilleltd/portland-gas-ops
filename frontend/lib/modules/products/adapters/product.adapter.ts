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
  Product,
  ProductImage,
  ProductStatus,
  ProductType,
  ProductUnit,
  UpdateProductInput,
  ProductPickerProduct
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
  description: string | null;

  product_type: string;

  unit: string;

  default_unit_price: string | number;

  minimum_stock: string | number | null;

  status: string;

  images: BackendProductImage[];

  created_at: string;
  updated_at: string;
}

interface BackendProductPicker extends BackendProduct {
  physical_quantity: string | number;
  committed_quantity: string | number;
  available_quantity: string | number;
  is_orderable: boolean;
}

interface BackendProductList {
  items: BackendProduct[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

// ─────────────────────────────────────────────────────────────
// Backend request shapes
// ─────────────────────────────────────────────────────────────

export interface BackendCreateProductInput {
  name: string;
  product_type: ProductType;
  unit: ProductUnit;
  default_unit_price: number;
  code?: string;
  description?: string;
  minimum_stock?: number;
  status?: ProductStatus;
}

export interface BackendUpdateProductInput {
  name?: string;
  product_type?: ProductType;
  unit?: ProductUnit;
  default_unit_price?: number;
  code?: string;
  description?: string;
  minimum_stock?: number;
  status?: ProductStatus;
}

// ─────────────────────────────────────────────────────────────
// Enum mapping
// ─────────────────────────────────────────────────────────────

function mapProductType(value: string): ProductType {
  switch (value) {
    case "tracked":
      return "tracked";
    default:
      return "consumable";
  }
}

function mapProductStatus(value: string): ProductStatus {
  switch (value) {
    case "inactive":
      return "inactive";
    default:
      return "active";
  }
}

function mapProductUnit(value: string): ProductUnit {
  switch (value) {
    case "kg":
    case "litre":
    case "m3":
    case "tonne":
    case "unit":
      return value;

    default:
      return "unit";
  }
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
// Backend → Frontend
// ─────────────────────────────────────────────────────────────

export function adaptProduct(raw: BackendProduct): Product {
  return {
    id: raw.id,

    productNo: raw.product_no,

    name: raw.name,
    code: raw.code ?? undefined,
    description: raw.description ?? undefined,

    productType: mapProductType(raw.product_type),

    unit: mapProductUnit(raw.unit),

    defaultUnitPrice: Number(raw.default_unit_price),

    minimumStock:
      raw.minimum_stock != null
        ? Number(raw.minimum_stock)
        : undefined,

    status: mapProductStatus(raw.status),

    images: (raw.images ?? []).map(mapImage),

    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export function adaptProductList(raw: BackendProductList): Product[] {
  return raw.items.map(adaptProduct);
}

// ─────────────────────────────────────────────────────────────
// Frontend → Backend
// ─────────────────────────────────────────────────────────────

export function adaptCreateProductInput(
  input: CreateProductInput
): BackendCreateProductInput {
  return {
    name: input.name,
    product_type: input.productType,
    unit: input.unit,
    default_unit_price: input.defaultUnitPrice,
    code: input.code,
    description: input.description,
    minimum_stock: input.minimumStock,
    status: input.status,
  };
}

export function adaptUpdateProductInput(
  input: UpdateProductInput
): BackendUpdateProductInput {
  return {
    name: input.name,
    product_type: input.productType,
    unit: input.unit,
    default_unit_price: input.defaultUnitPrice,
    code: input.code,
    description: input.description,
    minimum_stock: input.minimumStock,
    status: input.status,
  };
}




export function adaptProductPicker(
  raw: BackendProductPicker,
): ProductPickerProduct {
  return {
    ...adaptProduct(raw),

    physicalQuantity: Number(raw.physical_quantity),
    committedQuantity: Number(raw.committed_quantity),
    availableQuantity: Number(raw.available_quantity),
    isOrderable: raw.is_orderable,
  };
}

export function adaptProductPickerList(
  raw: {
    items: BackendProductPicker[];
  },
): ProductPickerProduct[] {
  return raw.items.map(adaptProductPicker);
}