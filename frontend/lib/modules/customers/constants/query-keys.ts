export const CUSTOMER_KEYS = {
  all: ["customers"] as const,
  lists: () => [...CUSTOMER_KEYS.all, "list"] as const,
  list: (filters?: string) => [...CUSTOMER_KEYS.lists(), { filters }] as const,
  details: () => [...CUSTOMER_KEYS.all, "detail"] as const,
  detail: (id: string) => [...CUSTOMER_KEYS.details(), id] as const,
  orders: (customerNo: string) =>
    [...CUSTOMER_KEYS.all, "orders", customerNo] as const,
} as const;