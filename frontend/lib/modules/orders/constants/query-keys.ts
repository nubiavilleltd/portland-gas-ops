export const ORDER_KEYS = {
  all: ["orders"] as const,

  lists: () => [...ORDER_KEYS.all, "list"] as const,

  list: (filters?: string) =>
    [...ORDER_KEYS.lists(), { filters }] as const,

  details: () => [...ORDER_KEYS.all, "detail"] as const,

  detail: (id: string) =>
    [...ORDER_KEYS.details(), id] as const,
} as const;