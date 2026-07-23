// lib/modules/inventory/selectors/inventory.selectors.ts

import type {
  InventoryItem,
  InventoryItemStatus,
  ConsumableStock,
  StockMovement,
  WarehouseLocation,
  TrackedInventoryKPIs,
  ConsumableInventoryKPIs,
} from "../types/inventory.types";

import type { Product } from "@/lib/modules/products/types/product.types";


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

export function getTrackedInventoryKPIs(
  items: InventoryItem[],
): TrackedInventoryKPIs {
  return {
    totalTrackedItems: items.length,
    availableItems: items.filter((i) => i.status === "available").length,
    reservedItems: items.filter((i) => i.status === "reserved").length,
    checkedOutItems: items.filter((i) => i.status === "checked_out").length,
    withCustomerItems: items.filter((i) => i.status === "with_customer").length,
    maintenanceItems: items.filter((i) => i.status === "maintenance").length,
    retiredItems: items.filter((i) => i.status === "retired").length,
  };
}





export function getConsumableInventoryKPIs(
  stock: ConsumableStock[],
  products: Product[],
): ConsumableInventoryKPIs {
  const lowStockProducts = stock.filter((item) => {
    const product = products.find((p) => p.id === item.product_id);

    return (
      product?.minimumStock != null &&
      item.quantity <= product.minimumStock
    );
  }).length;

  const outOfStockProducts = stock.filter(
    (item) => item.quantity <= 0,
  ).length;

  const warehouseCount = new Set(
    stock.map((s) => s.location_id),
  ).size;

  return {
    totalProducts: stock.length,
    totalQuantity: stock.reduce(
      (sum, item) => sum + item.quantity,
      0,
    ),
    lowStockProducts,
    outOfStockProducts,
    warehouseCount,
  };
}