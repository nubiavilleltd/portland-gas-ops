// ─────────────────────────────────────────────────────────
//  CUSTOMER ROUTES
//

export const CUSTOMER_ROUTES = {
  list:   () => "/admin/customers",
  new:    () => "/admin/customers/new",
  detail: (customerNo: string) => `/admin/customers/${customerNo}`,
  edit:   (customerNo: string) => `/admin/customers/${customerNo}/edit`,
} as const;