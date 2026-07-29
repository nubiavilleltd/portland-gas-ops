export const INVENTORY_KEYS = {
  all: ["inventory"] as const,

  // Dashboard
  kpis: () => [...INVENTORY_KEYS.all, "kpis"] as const,

  // Inventory Items
  items: () => [...INVENTORY_KEYS.all, "items"] as const,
  item: (id: string) => [...INVENTORY_KEYS.items(), id] as const,
  itemsByProduct: (productId: string) =>
    [...INVENTORY_KEYS.items(), "product", productId] as const,

  // Consumable Stock
  consumableStock: () =>
    [...INVENTORY_KEYS.all, "consumable-stock"] as const,

  consumableStockDetail: (id: string) =>
    [...INVENTORY_KEYS.consumableStock(), id] as const,

  consumableStockByProduct: (productId: string) =>
    [...INVENTORY_KEYS.consumableStock(), "product", productId] as const,

  // Stock Movements
  movements: () => [...INVENTORY_KEYS.all, "movements"] as const,

  movementsByProduct: (productId: string) =>
    [...INVENTORY_KEYS.movements(), "product", productId] as const,

  // Locations
  locations: () => [...INVENTORY_KEYS.all, "locations"] as const,
  consumableLocations: (productId: string) => [
    "inventory",
    "consumable-locations",
    productId,
],
} as const;