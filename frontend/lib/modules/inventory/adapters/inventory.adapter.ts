import type {
  InventoryItem,
  ConsumableStock,
  StockMovement,
  ConsumableStockDetail,
  ProductAvailability,
  InventoryOverviewItem,
  InventoryOverviewList,
  InventoryTracking,
} from "../types/inventory.types";

// ── Backend shapes ─────────────────────────────────────────

interface BackendInventoryItem {
  id: string;

  product_id: string;
  product_no: string | null;
  product_name: string | null;
  sku: string | null;
  tag_prefix: string | null;

  tag_number: string;
  serial_number: string | null;

  status: string;
  condition: string;
  disposition: string | null;

  location_id: string;
  location_name: string | null;

  order_id: string | null;
  order_no: string | null;

  trip_id: string | null;
  trip_no: string | null;

  customer_id: string | null;
  customer_name: string | null;

  checked_out_at: string | null;
  expected_return_date: string | null;
  received_into_inventory_at: string;

  notes: string | null;
}

interface BackendConsumableStock {
  id: string;

  product_id: string;
  product_no: string | null;
  product_name: string | null;
  sku: string | null;
  tag_prefix: string | null;

  location_id: string;
  location_name: string | null;

  quantity: string | number;
  reserved_quantity: string | number;
  sold_quantity: string | number;

  updated_at: string;
}

interface BackendConsumableStockDetail extends BackendConsumableStock {
  movements: BackendStockMovement[];
}

interface BackendStockMovement {
  id: string;
  product_id: string;
  product_name: string | null;
  movement_type: string;
  quantity: string | number;
  reference_id: string | null;
  reference_type: string | null;
  location_id: string;
  location_name: string | null;
  notes: string | null;
  recorded_by: string;
  recorded_by_name: string | null;
  item_ids: string[];
  created_at: string;
}

interface BackendProductAvailability {
  product_id: string;
  total: string | number;
  available: string | number;
  reserved: string | number;
  sold: string | number;
}

interface BackendInventoryOverviewItem {
  product_id: string;
  product_no: string;
  product_name: string;
  sku: string | null;
  tag_prefix: string | null;
  category_id: string;
  category_name: string | null;
  inventory_tracking: string;
  unit_label: string;
  unit_code: string;
  total: string | number;
  available: string | number;
  reserved: string | number;
  sold: string | number;
  minimum_stock: string | number | null;
  is_low_stock: boolean;
}

interface BackendInventoryOverviewList {
  items: BackendInventoryOverviewItem[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

// ── Adapters ───────────────────────────────────────────────

function mapInventoryTracking(value: string): InventoryTracking {
  return value === "INDIVIDUAL_ITEMS"
    ? "INDIVIDUAL_ITEMS"
    : "STOCK_QUANTITY";
}

export function adaptInventoryItem(
  raw: BackendInventoryItem,
): InventoryItem {
  return {
    id: raw.id,

    product_id: raw.product_id,
    product_no: raw.product_no ?? undefined,
    product_name: raw.product_name ?? "",
    sku: raw.sku ?? undefined,
    tag_prefix: raw.tag_prefix ?? undefined,

    tag_number: raw.tag_number,
    serial_number: raw.serial_number ?? undefined,

    status: raw.status as InventoryItem["status"],
    condition: raw.condition as InventoryItem["condition"],
    disposition: (raw.disposition ?? undefined) as
      | InventoryItem["disposition"]
      | undefined,

    location_id: raw.location_id,
    location_name: raw.location_name ?? "",

    order_id: raw.order_id ?? undefined,
    order_no: raw.order_no ?? undefined,

    trip_id: raw.trip_id ?? undefined,
    trip_no: raw.trip_no ?? undefined,

    customer_id: raw.customer_id ?? undefined,
    customer_name: raw.customer_name ?? undefined,

    checked_out_at: raw.checked_out_at ?? undefined,
    expected_return_date: raw.expected_return_date ?? undefined,
    received_into_inventory_at: raw.received_into_inventory_at,

    notes: raw.notes ?? undefined,
  };
}

export function adaptConsumableStock(
  raw: BackendConsumableStock,
): ConsumableStock {
  return {
    id: raw.id,

    product_id: raw.product_id,
    product_no: raw.product_no ?? undefined,
    product_name: raw.product_name ?? "",
    sku: raw.sku ?? undefined,
    tag_prefix: raw.tag_prefix ?? undefined,

    location_id: raw.location_id,
    location_name: raw.location_name ?? "",

    quantity: Number(raw.quantity),
    reserved_quantity: Number(raw.reserved_quantity),
    sold_quantity: Number(raw.sold_quantity),

    updated_at: raw.updated_at,
  };
}

export function adaptConsumableStockDetail(
  raw: BackendConsumableStockDetail,
): ConsumableStockDetail {
  return {
    ...adaptConsumableStock(raw),
    movements: raw.movements.map(adaptStockMovement),
  };
}

export function adaptStockMovement(
  raw: BackendStockMovement,
): StockMovement {
  return {
    id: raw.id,
    product_id: raw.product_id,
    product_name: raw.product_name ?? undefined,
    movement_type: raw.movement_type as StockMovement["movement_type"],
    quantity: Number(raw.quantity),
    reference_id: raw.reference_id ?? undefined,
    reference_type: (raw.reference_type ?? undefined) as
      | StockMovement["reference_type"]
      | undefined,
    location_id: raw.location_id,
    location_name: raw.location_name ?? undefined,
    notes: raw.notes ?? undefined,
    recorded_by: raw.recorded_by,
    recorded_by_name: raw.recorded_by_name ?? "",
    item_ids: raw.item_ids ?? [],
    created_at: raw.created_at,
  };
}

export function adaptProductAvailability(
  raw: BackendProductAvailability,
): ProductAvailability {
  return {
    productId: raw.product_id,
    total: Number(raw.total),
    available: Number(raw.available),
    reserved: Number(raw.reserved),
    sold: Number(raw.sold),
  };
}

export function adaptInventoryOverviewItem(
  raw: BackendInventoryOverviewItem,
): InventoryOverviewItem {
  return {
    productId: raw.product_id,
    productNo: raw.product_no,
    productName: raw.product_name,
    sku: raw.sku ?? undefined,
    tagPrefix: raw.tag_prefix ?? undefined,
    categoryId: raw.category_id,
    categoryName: raw.category_name ?? undefined,
    inventoryTracking: mapInventoryTracking(raw.inventory_tracking),
    unitLabel: raw.unit_label,
    unitCode: raw.unit_code,
    total: Number(raw.total),
    available: Number(raw.available),
    reserved: Number(raw.reserved),
    sold: Number(raw.sold),
    minimumStock:
      raw.minimum_stock != null ? Number(raw.minimum_stock) : undefined,
    isLowStock: raw.is_low_stock,
  };
}

export function adaptInventoryOverviewList(
  raw: BackendInventoryOverviewList,
): InventoryOverviewList {
  return {
    items: raw.items.map(adaptInventoryOverviewItem),
    total: raw.total,
    page: raw.page,
    pageSize: raw.page_size,
    hasNext: raw.has_next,
  };
}