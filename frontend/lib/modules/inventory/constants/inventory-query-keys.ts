export const INVENTORY_KEYS = {
  all: ["inventory"] as const,

  items: () => [...INVENTORY_KEYS.all, "items"] as const,
  item: (id: string) => [...INVENTORY_KEYS.items(), id] as const,
  itemsByProduct: (productId: string) =>
    [...INVENTORY_KEYS.items(), "product", productId] as const,

  consumableStock: () => [...INVENTORY_KEYS.all, "consumable-stock"] as const,
  consumableStockByProduct: (productId: string) =>
    [...INVENTORY_KEYS.consumableStock(), productId] as const,

  movements: () => [...INVENTORY_KEYS.all, "movements"] as const,
  movementsByProduct: (productId: string) =>
    [...INVENTORY_KEYS.movements(), "product", productId] as const,

  locations: () => [...INVENTORY_KEYS.all, "locations"] as const,
} as const;