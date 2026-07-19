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
  | "retired"       // Sold, disposed, or written off
  | "returned";      // Returned from customer, pending inspection

// ── 3. ITEM DISPOSITION ──────────────────────────────────
// export type ItemDisposition = "sold" | "loaned" | "rented";
export type ItemDisposition = "sold" | "loaned";

// ── 4. TRIP INVENTORY ASSIGNMENT ─────────────────────────

// export interface InventoryAssignment {
//   order_id: string;
//   product_id: string;
//   item_ids: string[];
//   disposition: ItemDisposition;
// }

export interface InventoryAssignment {
  order_id: string;
  product_id: string;

  // tracked products
  item_ids: string[];

  // warehouse selected for consumables
  location_id?: string;

  // business disposition
  disposition: ItemDisposition;
}

// ── 4. INVENTORY ITEM ────────────────────────────────────
export interface InventoryItem {
  id: string;
  product_id: string;
  tag_number: string;           // auto-generated, editable
  serial_number?: string;       // optional — supplier serial or barcode
  status: InventoryItemStatus;
  condition: "new" | "used" | "refurbished" | "damaged";
  disposition?: ItemDisposition; // set at check-out
  location_id: string;
  order_id?: string;            // which order it went out on
  customer_id?: string;         // which customer has it
  checked_out_at?: string;
  expected_return_date?: string;
  received_at: string;
  notes?: string;
}

// ── 5. STOCK MOVEMENT ────────────────────────────────────
export type StockMovementType =
  | "check_in"
  | "check_out"
  | "reservation"
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
  movement_type: StockMovementType;
  quantity: number;               // for consumables
  item_ids?: string[];            // for tracked items
  reference_id?: string;          // order_id, trip_id, etc
  reference_type?: StockMovementReferenceType;
  location_id: string;
  notes?: string;
  recorded_by: string;
  created_at: string;
}

// ── 6. CONSUMABLE STOCK ──────────────────────────────────
// Tracks current stock level for bulk/consumable products
export interface ConsumableStock {
  id: string;
  product_id: string;
  location_id: string;
  quantity: number;    // always current level
  updated_at: string;
}

// ── 7. INPUT TYPES ───────────────────────────────────────
export interface CheckInTrackedInput {
  product_id: string;
  product_code: string;
  location_id: string;
  quantity: number;
  condition: InventoryItem["condition"];
  serial_numbers?: string[];  // optional — one per unit
  notes?: string;
  recorded_by: string;
}

export interface CheckInConsumableInput {
  product_id: string;
  location_id: string;
  quantity: number;
  notes?: string;
  recorded_by: string;
}

export interface ReserveItemsInput {
  item_ids: string[];
  order_id: string;
  recorded_by: string;
}

export interface CheckOutItemsInput {
  item_ids: string[];
  trip_id: string;
  disposition: ItemDisposition;
  recorded_by: string;
}

export interface ReturnItemInput {
  item_id: string;
  condition: InventoryItem["condition"];
  notes?: string;
  recorded_by: string;
}