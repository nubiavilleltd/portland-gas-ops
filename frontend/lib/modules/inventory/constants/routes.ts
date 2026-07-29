export const INVENTORY_ROUTES = {
  list: (tab?: "tracked" | "consumable") =>
    tab
      ? `/admin/inventory?tab=${tab}`
      : "/admin/inventory",

  checkIn: () => "/admin/inventory/check-in",

  movements: () => "/admin/inventory/movements",

  trackedDetail: (id: string) =>
    `/admin/inventory/tracked/${id}`,

  returnTracked: (id: string) =>
    `/admin/inventory/tracked/${id}/return`,

  stockDetail: (id: string) =>
    `/admin/inventory/stock/${id}`,
} as const;