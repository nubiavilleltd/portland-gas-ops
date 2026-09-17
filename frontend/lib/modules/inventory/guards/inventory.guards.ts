import type { InventoryItem, ConsumableStock } from "../types/inventory.types";

export function canReserve(item: InventoryItem): boolean {
  return item.status === "available";
}

export function canCheckOut(item: InventoryItem): boolean {
  return item.status === "reserved";
}

export function canReturn(item: InventoryItem): boolean {
  return (
    item.status === "with_customer" &&
    item.disposition === "loaned"
  );
}

export function canSendToMaintenance(item: InventoryItem): boolean {
  return (
    item.status === "available" ||
    item.status === "maintenance"
  );
}

export function canRetire(item: InventoryItem): boolean {
  return (
    item.status === "available" ||
    item.status === "maintenance" ||
    item.status === "with_customer"
  );
}

export function hasEnoughConsumableStock(
  stock: ConsumableStock,
  required: number,
): boolean {
  // Available = quantity - reserved_quantity
  const available = stock.quantity - stock.reserved_quantity;
  return available >= required;
}

export function hasEnoughTrackedItems(
  availableCount: number,
  required: number,
): boolean {
  return availableCount >= required;
}