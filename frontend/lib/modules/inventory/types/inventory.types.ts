// ============================================================
//  INVENTORY MODULE — CANONICAL TYPE DEFINITIONS
// ============================================================

// ── 1. WAREHOUSE LOCATION ────────────────────────────────
export interface WarehouseLocation {
  id: string;
  name: string;
  address?: string;
  is_default: boolean;
}

// ── 2. INVENTORY ITEM STATUS ─────────────────────────────
export type InventoryItemStatus =
  | "available"      // In warehouse, ready to assign
  | "reserved"       // Locked to a confirmed order, not yet dispatched
  | "checked_out"    // On the truck / in transit
  | "with_customer"  // Delivered, at customer site
  | "maintenance"    // Unavailable, being serviced
  | "sold"           // Permanently disposed via a sale
  | "retired";       // Written off, no longer counted in totals

// ── 3. ITEM DISPOSITION ──────────────────────────────────
export type ItemDisposition = "sold" | "loaned";

// ── 4. TRIP INVENTORY ASSIGNMENT ─────────────────────────
export interface InventoryAssignment {
  order_id: string;
  product_id: string;

  // tracked products
  item_ids: string[];

  // warehouse selected for stock-quantity products
  location_id?: string;

  // business disposition
  disposition?: ItemDisposition;
}

// ── 5. INVENTORY ITEM ────────────────────────────────────
export interface InventoryItem {
  id: string;

  product_id: string;
  product_no?: string;
  product_name: string;
  sku?: string;
  tag_prefix?: string;

  tag_number: string;
  serial_number?: string;

  status: InventoryItemStatus;
  condition: "new" | "used" | "refurbished" | "damaged";
  disposition?: ItemDisposition;

  location_id: string;
  location_name: string;

  order_id?: string;
  order_no?: string;

  trip_id?: string;
  trip_no?: string;

  customer_id?: string;
  customer_name?: string;

  checked_out_at?: string;
  expected_return_date?: string;

  received_into_inventory_at: string;

  notes?: string;
}

// ── 6. STOCK MOVEMENT ────────────────────────────────────
export type StockMovementType =
  | "check_in"
  | "check_out"
  | "reservation"
  | "reservation_release"
  | "return"
  | "adjustment";

export type StockMovementReferenceType =
  | "order"
  | "trip"
  | "purchase_order"
  | "manual";

export interface StockMovement {
  id: string;
  product_id: string;
  product_name?: string;
  movement_type: StockMovementType;
  quantity: number;
  item_ids?: string[];
  reference_id?: string;
  reference_type?: StockMovementReferenceType;
  location_id: string;
  location_name?: string;
  notes?: string;
  recorded_by: string;
  recorded_by_name: string;
  created_at: string;
}

// ── 7. STOCK QUANTITY ────────────────────────────────────
export interface ConsumableStock {
  id: string;

  product_id: string;
  product_no?: string;
  product_name: string;
  sku?: string;
  tag_prefix?: string;

  unit_label?: string;    // NEW
  unit_code?: string;     // NEW

  location_id: string;
  location_name: string;

  quantity: number;
  reserved_quantity: number;
  sold_quantity: number;

  updated_at: string;
}

export interface ConsumableStockDetail extends ConsumableStock {
  movements: StockMovement[];
}

// ── 8. PRODUCT AVAILABILITY ──────────────────────────────
export interface ProductAvailability {
  productId: string;
  total: number;
  available: number;
  reserved: number;
  sold: number;
}

// ── 9. INVENTORY OVERVIEW ────────────────────────────────
export type InventoryTracking = "INDIVIDUAL_ITEMS" | "STOCK_QUANTITY";

export interface InventoryOverviewItem {
  id: string; 
  productId: string;
  productNo: string;
  productName: string;
  sku?: string;
  tagPrefix?: string;
  categoryId: string;
  categoryName?: string;
  inventoryTracking: InventoryTracking;
  unitLabel: string;
  unitCode: string;
  total: number;
  available: number;
  reserved: number;
  sold: number;
  minimumStock?: number;
  isLowStock: boolean;
}

export interface InventoryOverviewList {
  items: InventoryOverviewItem[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}

// ── 10. INPUT TYPES ──────────────────────────────────────
export interface CheckInIndividualItemsInput {
  product_id: string;
  location_id: string;
  quantity: number;
  condition: InventoryItem["condition"];
  notes?: string;
}

export interface CheckInStockQuantityInput {
  product_id: string;
  location_id: string;
  quantity: number;
  notes?: string;
}

export interface ReturnItemInput {
  item_id: string;
  condition: InventoryItem["condition"];
  notes?: string;
}

// ── 11. KPI TYPES (legacy, being phased out in 4d) ───────
export interface TrackedInventoryKPIs {
  totalTrackedItems: number;
  availableItems: number;
  reservedItems: number;
  checkedOutItems: number;
}

export interface ConsumableInventoryKPIs {
  totalProducts: number;
  totalQuantity: number;
  lowStockProducts: number;
  outOfStockProducts: number;
}