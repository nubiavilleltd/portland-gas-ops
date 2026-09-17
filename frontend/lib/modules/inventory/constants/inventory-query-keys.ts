export const INVENTORY_KEYS = {
  all: ["inventory"] as const,

  // Dashboard
  kpis: () => [...INVENTORY_KEYS.all, "kpis"] as const,

  // Overview (aggregated by product)
  overview: (filters?: {
    search?: string;
    inventoryTracking?: string;
    categoryId?: string;
    stockStatus?: string;
    page?: number;
    pageSize?: number;
  }) => [...INVENTORY_KEYS.all, "overview", filters] as const,

  // Product availability (single product)
  productAvailability: (productId: string) =>
    [...INVENTORY_KEYS.all, "product-availability", productId] as const,

  // Inventory Items
  items: () => [...INVENTORY_KEYS.all, "items"] as const,
  item: (id: string) => [...INVENTORY_KEYS.items(), id] as const,
  itemsByProduct: (productId: string) =>
    [...INVENTORY_KEYS.items(), "product", productId] as const,

  // Stock Quantity
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

  consumableLocations: (productId: string) =>
    [
      ...INVENTORY_KEYS.all,
      "consumable-locations",
      productId,
    ] as const,
} as const;