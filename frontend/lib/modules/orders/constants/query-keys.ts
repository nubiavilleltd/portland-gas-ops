export const ORDER_KEYS = {
  all: ["orders"] as const,

  lists: () => [...ORDER_KEYS.all, "list"] as const,

  list: (
    filters?: Record<string, unknown>,
  ) => [...ORDER_KEYS.lists(), filters ?? {}] as const,

  details: () => [...ORDER_KEYS.all, "detail"] as const,

  detail: (orderNo: string) =>
    [...ORDER_KEYS.details(), orderNo] as const,
} as const;