export const INVENTORY_ROUTES = {
  list:     () => "/inventory",
  checkIn:  () => "/inventory/check-in",
  detail:   (id: string) => `/inventory/${id}`,
  return:   (id: string) => `/inventory/${id}/return`,
  movements: () => "/inventory/movements",
} as const;