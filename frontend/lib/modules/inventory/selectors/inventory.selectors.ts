// lib/modules/inventory/selectors/inventory.selectors.ts

import type {
  InventoryItem,
  InventoryItemStatus,
  ConsumableStock,
  StockMovement,
  WarehouseLocation,
} from "../types/inventory.types";

// ── LOCATIONS ────────────────────────────────────────────

export function getDefaultLocation(
  locations: WarehouseLocation[]
): WarehouseLocation | undefined {
  return locations.find((l) => l.is_default);
}

export function getLocationById(
  locations: WarehouseLocation[],
  id: string
): WarehouseLocation | undefined {
  return locations.find((l) => l.id === id);
}

// ── ITEM LOOKUPS ─────────────────────────────────────────

export function getItemById(
  items: InventoryItem[],
  id: string
): InventoryItem | undefined {
  return items.find((i) => i.id === id);
}

export function getItemByTag(
  items: InventoryItem[],
  tagNumber: string
): InventoryItem | undefined {
  return items.find((i) => i.tag_number === tagNumber);
}

// ── ITEM FILTERS ─────────────────────────────────────────

export function getItemsByProduct(
  items: InventoryItem[],
  productId: string
): InventoryItem[] {
  return items.filter((i) => i.product_id === productId);
}

export function getItemsByStatus(
  items: InventoryItem[],
  status: InventoryItemStatus
): InventoryItem[] {
  return items.filter((i) => i.status === status);
}

export function getAvailableItems(
  items: InventoryItem[],
  productId: string
): InventoryItem[] {
  return items.filter(
    (i) => i.product_id === productId && i.status === "available"
  );
}

export function getAvailableCount(
  items: InventoryItem[],
  productId: string
): number {
  return getAvailableItems(items, productId).length;
}

export function getItemsByCustomer(
  items: InventoryItem[],
  customerId: string
): InventoryItem[] {
  return items.filter((i) => i.customer_id === customerId);
}

export function getItemsByOrder(
  items: InventoryItem[],
  orderId: string
): InventoryItem[] {
  return items.filter((i) => i.order_id === orderId);
}

// ── CONSUMABLE STOCK ─────────────────────────────────────

export function getConsumableStockByProduct(
  stock: ConsumableStock[],
  productId: string
): ConsumableStock | undefined {
  return stock.find((s) => s.product_id === productId);
}

export function getConsumableStockLevel(
  stock: ConsumableStock[],
  productId: string
): number {
  return getConsumableStockByProduct(stock, productId)?.quantity ?? 0;
}

// ── STOCK MOVEMENTS ──────────────────────────────────────

export function getMovementsByProduct(
  movements: StockMovement[],
  productId: string
): StockMovement[] {
  return movements.filter((m) => m.product_id === productId);
}

export function getMovementsByItem(
  movements: StockMovement[],
  itemId: string
): StockMovement[] {
  return movements.filter((m) => m.item_ids?.includes(itemId));
}

// ── KPIs ─────────────────────────────────────────────────

export interface InventoryKPIs {
  totalTrackedItems: number;
  availableItems: number;
  reservedItems: number;
  checkedOutItems: number;
  withCustomerItems: number;
  maintenanceItems: number;
  retiredItems: number;
}

export function getInventoryKPIs(items: InventoryItem[]): InventoryKPIs {
  return {
    totalTrackedItems: items.length,
    availableItems:    items.filter((i) => i.status === "available").length,
    reservedItems:     items.filter((i) => i.status === "reserved").length,
    checkedOutItems:   items.filter((i) => i.status === "checked_out").length,
    withCustomerItems: items.filter((i) => i.status === "with_customer").length,
    maintenanceItems:  items.filter((i) => i.status === "maintenance").length,
    retiredItems:      items.filter((i) => i.status === "retired").length,
  };
}