// inventory/constants/inventory-tabs.ts

export const INVENTORY_TABS = [
  "tracked",
  "consumable",
] as const;

export type InventoryTab = (typeof INVENTORY_TABS)[number];