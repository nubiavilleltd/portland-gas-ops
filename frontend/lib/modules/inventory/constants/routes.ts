export const INVENTORY_ROUTES = {
  list:     () => "/admin/inventory",
  checkIn:  () => "/admin/inventory/check-in",
  detail:   (id: string) => `/admin/inventory/${id}`,
  return:   (id: string) => `/admin/inventory/${id}/return`,
  movements: () => "/admin/inventory/movements",
} as const;